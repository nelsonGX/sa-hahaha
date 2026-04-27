import requests
from app.schemas.credit_schema import (
    StudentData, CourseRecord, CreditSummary, 
    CreditCategory, GeneralEducationCredit, DetailedRequirements
)
from app.services.estu_scraper import EstuScraper

class FjuScraperService:
    def __init__(self):
        self.session = requests.Session()
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
                domain = item.get("gInfo", "")           
                category = f"{course_type}-{domain}" if domain else course_type
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
                
            # 2. 同步爬取選課系統 (當前學期正在修的課)
            try:
                estu_scraper = EstuScraper()
                enrolled_courses = estu_scraper.get_enrolled_courses(student_id, password)
                
                def normalize_name(name):
                    return name.replace("英-專業", "").replace("英-專", "").replace(" ", "").strip()
                    
                existing_records_map = {normalize_name(r.course_name): r for r in records if r.score.strip() in ["", "未評定成績"]}
                
                for course in enrolled_courses:
                    course_name = course.get("科目名稱")
                    if not course_name:
                        continue
                        
                    norm_name = normalize_name(course_name)
                    
                    # 判斷分類，選課系統有通識領域欄位
                    domain = course.get("通識領域", "").strip()
                    req_sel = course.get("學生選課設定選別", "").strip()
                    
                    category = "必修"
                    if req_sel == "選": category = "選修"
                    elif req_sel == "通": category = f"通識-{domain}" if domain else "通識"
                    
                    # 判斷是否為 EMI (看課程標記或名稱)
                    mark = course.get("課程標記", "")
                    if "EMI" in mark or "英-專" in course_name:
                        category += " (EMI)"
                        
                    if norm_name in existing_records_map:
                        existing_cat = existing_records_map[norm_name].category
                        
                        # 如果歷年成績系統的分類比較詳細(例如通識-人文)，就保留歷年系統的分類
                        if "通識-" in existing_cat and "通識" in category and "通識-" not in category:
                            final_category = existing_cat
                        else:
                            final_category = category
                            
                        # 保留 EMI 標記
                        if "(EMI)" in category and "(EMI)" not in final_category:
                            final_category += " (EMI)"
                            
                        # 覆蓋為合併後的分類
                        existing_records_map[norm_name].category = final_category
                        existing_records_map[norm_name].course_name = course_name
                    else:
                        try:
                            credits_val = int(float(course.get("學分", 0)))
                        except ValueError:
                            credits_val = 0
                            
                        records.append(CourseRecord(
                            semester=f"{course.get('學年度', '114')}-{course.get('學期', '2')}", # fallback
                            course_name=course_name,
                            credits=credits_val,
                            score="", # 空字串代表正在修 (enrolled)
                            category=category
                        ))
            except Exception as estu_e:
                print(f"⚠️ 選課系統爬取失敗，但不影響主成績單: {estu_e}")
            
            estimated_enrollment_year = 100 + int(student_id[1:3]) if len(student_id) >= 3 and student_id.startswith('4') else 0
            department_name = self.DEPARTMENT_MAP.get(student_id[3:5], "未知系所") if len(student_id) >= 5 else "未知系所"

            summary, warnings = self._calculate_credit_summary(records, department_name, estimated_enrollment_year)

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

    def _calculate_credit_summary(self, records: list[CourseRecord], department_name: str, enrollment_year: int) -> tuple[CreditSummary, list[str]]:
        warnings = []
        
        def get_status(score: str):
            if not score or score.strip() == "" or score.strip() == "未評定成績": return "enrolled"
            if score.isdigit(): return "passed" if int(score) >= 60 else "failed"
            if score in ["抵免", "及格", "通過"]: return "passed"
            return "failed"

        # 計數器
        earned_total = 0
        req_earned = 0
        ele_earned = 0
        ge_earned = 0
        
        holistic_core_earned = 0
        basic_skills_earned = 0
        pe_count = 0

        ge_domains = {
            "人文藝術領域": CreditCategory(earned=0, target=4),
            "自然科技領域": CreditCategory(earned=0, target=4),
            "社會科學領域": CreditCategory(earned=0, target=4),
        }

        # 關鍵字清單
        HOLISTIC_CORE_KEYWORDS = ["大學入門", "人生哲學", "專業倫理", "企業倫理"]
        BASIC_SKILLS_KEYWORDS = ["國文", "外語", "外國語文", "英語", "英文", "法文", "德文", "日文", "西班牙文", "韓文"]
        PE_KEYWORDS = ["體育", "羽球", "桌球", "游泳", "網球", "排球", "籃球"]

        passed_courses = {r.course_name for r in records if get_status(r.score) == "passed"}
        enrolled_courses = {r.course_name for r in records if get_status(r.score) == "enrolled"}
        failed_courses = {r.course_name for r in records if get_status(r.score) == "failed" and r.score != "停修"}

        for r in records:
            r.status = get_status(r.score)
            
            if r.status == "failed":
                r.audit_category = "不及格/停修"
                continue
            
            # 以下分類適用於 passed (計算學分) 與 enrolled (僅標示分類，不計學分，除非你想讓修課中算進去，但通常不算)
            # 這裡我們為了進度條準確，enrolled不加學分，但分類正確
            is_passed_course = (r.status == "passed")
            
            # 核心課程 (含體育)
            if any(k in r.course_name for k in PE_KEYWORDS):
                r.audit_category = "核心課程(體育)"
                if is_passed_course:
                    pe_count += 1
                    holistic_core_earned += r.credits
                    earned_total += r.credits
            elif any(k in r.course_name for k in HOLISTIC_CORE_KEYWORDS):
                r.audit_category = "核心課程"
                if is_passed_course:
                    holistic_core_earned += r.credits
                    earned_total += r.credits
            
            # 基本能力課程 (含國文與外語)
            elif any(k in r.course_name for k in BASIC_SKILLS_KEYWORDS):
                r.audit_category = "基本能力課程"
                if is_passed_course:
                    basic_skills_earned += r.credits
                    earned_total += r.credits

            # 通識課程 (12學分)
            elif "通識" in r.category:
                r.audit_category = "通識課程"
                if is_passed_course:
                    ge_earned += r.credits
                    earned_total += r.credits
                
                for domain in ge_domains:
                    if domain[:2] in r.category:
                        sub_domain = r.category.split(":")[-1].strip() if ":" in r.category else ""
                        r.audit_category = f"通識-{domain[:2]} ({sub_domain})" if sub_domain else f"通識-{domain[:2]}"
                        if is_passed_course:
                            ge_domains[domain].earned += r.credits

            # 必修 (排除以上全人課程後的剩餘必修)
            elif "必修" in r.category:
                if any(k in r.course_name for k in ["軍訓", "操行"]):
                    r.audit_category = "不計畢業學分"
                else:
                    r.audit_category = "必修"
                    if is_passed_course:
                        req_earned += r.credits
                        earned_total += r.credits

            # 選修
            elif "選修" in r.category:
                r.audit_category = "選修"
                if is_passed_course:
                    ele_earned += r.credits
                    earned_total += r.credits
            
            else:
                r.audit_category = "其他"

            if "(EMI)" in r.category:
                r.audit_category += " (EMI)"

        # 擋修預警
        if "系統分析與設計" not in passed_courses and "系統分析與設計" not in enrolled_courses: 
            warnings.append("⚠️ 您尚未通過『系統分析與設計』(且未正在修課)，這將擋修『資訊系統專題一』。")
        elif "系統分析與設計" in enrolled_courses:
            warnings.append("📝 您正在修習『系統分析與設計』，請確保及格以免擋修『資訊系統專題一』。")
            
        if any("資訊系統專題二" in c for c in failed_courses): 
            warnings.append("🚨 您的『資訊系統專題二』不及格，依規定需重修『專題一』與『專題二』。")

        # 封裝結果
        details = None
        if department_name == "資訊管理學系":
            details = DetailedRequirements(
                required_courses=CreditCategory(earned=req_earned, target=64),
                elective_courses=CreditCategory(earned=ele_earned, target=32),
                holistic_education=CreditCategory(earned=holistic_core_earned + basic_skills_earned + ge_earned, target=32),
                holistic_core=CreditCategory(earned=holistic_core_earned, target=8),
                basic_skills=CreditCategory(earned=basic_skills_earned, target=12),
                general_ed=GeneralEducationCredit(earned=ge_earned, target=12, domains=ge_domains),
                pe_semesters=CreditCategory(earned=pe_count, target=4)
            )

        summary = CreditSummary(
            total_earned=earned_total,
            details=details
        )
        return summary, warnings

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
        summary, warnings = self._calculate_credit_summary(records, "資訊管理學系", 113)
        return StudentData(
            student_id=student_id, department_name="資訊管理學系", enrollment_year=113,
            course_records=records, credit_summary=summary, warnings=warnings
        )
