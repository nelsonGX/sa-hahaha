import requests
import re
from app.schemas.credit_schema import (
    StudentData, CourseRecord, CreditSummary, 
    CreditCategory, GeneralEducationCredit, DetailedRequirements
)
from app.services.estu_scraper import EstuScraper
from app.services.audit_service import AuditService

class FjuScraperService:
    def __init__(self):
        self.session = requests.Session()
        self.audit_service = AuditService()
        self.LOGIN_URL = "https://travellerlink.fju.edu.tw/FjuBase/api/Account/LdapLogin" 
        self.GRADES_URL = "https://travellerlink.fju.edu.tw/Score/api/GradesInquiry/Grades"

        # 輔大系所代碼對照表
        self.DEPARTMENT_MAP = {
            "01": "中國文學系", "02": "歷史學系", "03": "哲學系", "04": "圖書資訊學系",
            "05": "影像傳播學系", "06": "新聞傳播學系", "07": "廣告傳播學系",
            "08": "體育學系體育學組", "09": "體育學系運動競技組", "10": "體育學系運動健康管理組",
            "11": "英國語文學系", "12": "法國語文學系", "13": "西班牙語文學系",
            "14": "日本語文學系", "15": "義大利語文學系", "16": "德國語文學系",
            "17": "數學系資訊數學組", "18": "數學系應用數學組", "19": "化學系",
            "20": "心理學系", "21": "織品服裝學系織品設計組", "22": "織品服裝學系織品服飾行銷組",
            "23": "織品服裝學系服飾設計組", "24": "電機工程學系", "26": "資訊工程學系",
            "27": "生命科學系", "28": "物理學系物理組", "29": "物理學系光電物理組",
            "30": "餐旅管理學系", "31": "兒童與家庭學系", "32": "法律學系",
            "33": "社會學系", "34": "社會工作學系", "35": "經濟學系",
            "36": "財經法律學系", "37": "學士後法律學系", "38": "企業管理學系",
            "39": "會計學系", "40": "資訊管理學系", "41": "金融與國際企業學系",
            "42": "統計資訊學系", "43": "音樂學系", "44": "應用美術系",
            "45": "景觀設計系", "46": "食品科學系", "47": "營養科學系",
            "48": "宗教學系", "49": "護理學系", "50": "公共衛生學系",
            "51": "醫學系", "52": "臨床心理學系", "53": "職能治療學系",
            "54": "呼吸治療學系", "55": "天主教研修學士學位學程",
            "56": "教育領導與科技發展學士學位學程", "57": "醫學資訊與創新應用學士學位學程",
            "58": "人工智慧與資訊安全學士學位學程"
        }

    def _normalize_course_name(self, name: str) -> str:
        normalized = name.replace("英-專業", "").replace("英-專", "").replace(" ", "").strip()
        return re.sub(r"(網|EMI)$", "", normalized).strip()

    def _is_enrolled_score(self, score: str) -> bool:
        return score.strip() in ["", "未評定成績"]

    def _more_specific_category(self, current: str, candidate: str) -> str:
        current = current.strip()
        candidate = candidate.strip()
        if not current:
            return candidate
        if not candidate:
            return current
        if "通識-" in candidate and "通識-" not in current:
            return candidate
        if "通識-" in current and "通識-" not in candidate:
            return current
        if len(candidate) > len(current):
            return candidate
        return current

    def _deduplicate_enrolled_records(self, records: list[CourseRecord]) -> list[CourseRecord]:
        seen_enrolled: dict[str, CourseRecord] = {}
        deduped: list[CourseRecord] = []

        for record in records:
            if not self._is_enrolled_score(record.score):
                deduped.append(record)
                continue

            key = self._normalize_course_name(record.course_name)
            existing = seen_enrolled.get(key)
            if not existing:
                seen_enrolled[key] = record
                deduped.append(record)
                continue

            existing.category = self._more_specific_category(existing.category, record.category)
            if not existing.score.strip():
                existing.score = record.score

        return deduped

    def scrape_student_data(self, student_id: str, password: str, use_mock: bool = True) -> StudentData:
        if use_mock:
            return self._get_mock_data(student_id)

        try:
            # 1. 登入主系統獲取歷年成績
            login_payload = {"empNo": student_id, "password": password, "systemSn": 31}
            login_headers = {
                "Content-Type": "application/json",
                "Origin": "https://sis.fju.edu.tw",
                "Referer": "https://sis.fju.edu.tw/",
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            }
            
            login_response = self.session.post(self.LOGIN_URL, json=login_payload, headers=login_headers, timeout=10, verify=False)
            if login_response.status_code != 200:
                error_msg = login_response.json().get("errorMessage", [{}])[0].get("message", "登入失敗")
                raise ValueError(error_msg)
            
            auth_token = login_response.json()["result"]["auth_token"]
            headers = {"Authorization": f"Bearer {auth_token}", "Accept": "application/json"}
            
            grades_response = self.session.get(self.GRADES_URL, headers=headers, timeout=10, verify=False)
            grades_data = grades_response.json()
            
            records = []
            for item in grades_data["result"]:
                year = item.get("hy", 0)
                semester_num = item.get("htPeriod", 0)
                course_type = item.get("reqSelCNa", "")  
                domain_info = item.get("gInfo", "") # 包含領域名稱與 PT/NT 代碼
                
                # 擷取所有課程標記 (如: 英-專業, 程, 網)
                classify_marks = []
                for classify in item.get("couClassify", []):
                    mark = classify.get("couClassifyNoteCna", "")
                    if mark: classify_marks.append(mark)
                
                # 將標記串接至 category 供後續辨識
                marks_str = ",".join(classify_marks)
                category = f"{course_type}-{domain_info}" if domain_info else course_type
                if marks_str:
                    category += f" [{marks_str}]"

                score_str = item.get("scoreDisplay", "")
                credits = item.get("credit", 0)
                course_name = item.get("couCNa", "")

                records.append(CourseRecord(
                    semester=f"{year}-{semester_num}",
                    course_name=course_name,
                    credits=credits,
                    score=score_str,
                    category=category
                ))
                
            # 2. 同步爬取選課系統 (僅抓當期正在修的課以提升效能)
            try:
                estu_scraper = EstuScraper()
                # 僅抓取當前學期選課清單
                enrolled_courses = estu_scraper.get_enrolled_courses(student_id, password, fetch_all_history=False)
                
                # 建立 SIS 現有正在修課的索引
                existing_enrolled = {
                    self._normalize_course_name(r.course_name): r
                    for r in records if self._is_enrolled_score(r.score)
                }

                for course in enrolled_courses:
                    course_name = course.get("科目名稱", "")
                    if not course_name: continue
                    
                    norm_name = self._normalize_course_name(course_name)
                    domain = course.get("通識領域", "").strip()
                    req_sel = course.get("學生選課設定選別", "").strip()
                    offering_dept = course.get("開課單位名稱", "").strip()
                    mark = course.get("課程標記", "")
                    
                    category = "必修"
                    if req_sel == "選": category = "選修"
                    elif req_sel == "通": category = f"通識-{domain}" if domain else "通識"
                    
                    if "英-專業" in mark:
                        category += " [英-專業]"
                        
                    if norm_name in existing_enrolled:
                        r = existing_enrolled[norm_name]
                        # 補全開課單位 (包含 PT/NT 標記)
                        if offering_dept: r.offering_dept = offering_dept
                        # 合併分類資訊
                        r.category = self._more_specific_category(r.category, category)
                    else:
                        try:
                            credits_val = int(float(course.get("學分", 0)))
                        except ValueError:
                            credits_val = 0
                            
                        records.append(CourseRecord(
                            semester=f"{course.get('學年度', '114')}-{course.get('學期', '2')}",
                            course_name=course_name,
                            credits=credits_val,
                            score="", 
                            category=category,
                            offering_dept=offering_dept
                        ))
            except Exception as estu_e:
                print(f"⚠️ 選課系統當期資料同步失敗: {estu_e}")
            
            records = self._deduplicate_enrolled_records(records)

            estimated_enrollment_year = 100 + int(student_id[1:3]) if len(student_id) >= 3 and student_id.startswith('4') else 0
            department_name = self.DEPARTMENT_MAP.get(student_id[3:5], "未知系所") if len(student_id) >= 5 else "未知系所"

            summary, warnings = self.audit_service.calculate_credit_summary(records, department_name, estimated_enrollment_year)

            return StudentData(
                student_id=student_id,
                department_name=department_name, 
                enrollment_year=estimated_enrollment_year,
                course_records=records,
                credit_summary=summary,
                warnings=warnings
            )

        except Exception as e:
            raise e
        finally:
            self.session.cookies.clear()

    def _get_mock_data(self, student_id: str) -> StudentData:
        records = [
            CourseRecord(semester="113-1", course_name="大學入門", credits=2, score="85", category="必修"),
            CourseRecord(semester="113-1", course_name="微積分", credits=3, score="80", category="必修"),
            CourseRecord(semester="113-1", course_name="程式設計概論", credits=3, score="90", category="必修"),
            CourseRecord(semester="113-1", course_name="通識-人文", credits=2, score="75", category="通識-人文藝術領域"),
            CourseRecord(semester="113-2", course_name="羽球", credits=0, score="88", category="必修"),
            CourseRecord(semester="113-2", course_name="會計學", credits=3, score="92", category="必修"),
            CourseRecord(semester="114-1", course_name="雲端應用", credits=3, score="85", category="選修"),
            CourseRecord(semester="114-1", course_name="系統分析與設計", credits=3, score="", category="必修"),
        ]
        summary, warnings = self.audit_service.calculate_credit_summary(records, "資訊管理學系", 113)
        return StudentData(
            student_id=student_id, department_name="資訊管理學系", enrollment_year=113,
            course_records=records, credit_summary=summary, warnings=warnings
        )
