import httpx
import re
import urllib3
from app.schemas.credit_schema import (
    StudentData, CourseRecord, CreditSummary, 
    CreditCategory, GeneralEducationCredit, DetailedRequirements,
    EnglishProficiency, ComputerProficiency, EMIProficiency
)
from app.services.estu_scraper import EstuScraper
from app.services.audit_service import AuditService
from app.services.course_catalog_service import get_course_time_string
from app.constants import DEPARTMENT_MAP
from app.utils.course_utils import normalize_course_name
from app.utils.exceptions import FjuAuthError, SchoolServerError, DataProcessingError

# 關閉 SSL 安全警告
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

class FjuScraperService:
    def __init__(self):
        self.audit_service = AuditService()
        self.LOGIN_URL = "https://travellerlink.fju.edu.tw/FjuBase/api/Account/LdapLogin" 
        self.GRADES_URL = "https://travellerlink.fju.edu.tw/Score/api/GradesInquiry/Grades"
        self.HEADERS = {
            "Content-Type": "application/json",
            "Origin": "https://sis.fju.edu.tw",
            "Referer": "https://sis.fju.edu.tw/",
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }

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

            key = normalize_course_name(record.course_name)
            existing = seen_enrolled.get(key)
            if not existing:
                seen_enrolled[key] = record
                deduped.append(record)
                continue

            existing.category = self._more_specific_category(existing.category, record.category)
            if not existing.score.strip():
                existing.score = record.score

        return deduped

    async def scrape_student_data(self, student_id: str, password: str, use_mock: bool = True) -> StudentData:
        if use_mock:
            return self._get_mock_data(student_id)

        async with httpx.AsyncClient(headers=self.HEADERS, verify=False, timeout=15.0) as client:
            try:
                # 1. 登入主系統獲取歷年成績
                login_payload = {"empNo": student_id, "password": password, "systemSn": 31}
                login_response = await client.post(self.LOGIN_URL, json=login_payload)
                
                if login_response.status_code != 200:
                    try:
                        error_msg = login_response.json().get("errorMessage", [{}])[0].get("message", "登入失敗")
                    except:
                        error_msg = "登入服務無回應"
                    raise FjuAuthError(error_msg)
                
                auth_token = login_response.json()["result"]["auth_token"]
                headers = {"Authorization": f"Bearer {auth_token}", "Accept": "application/json"}
                
                grades_response = await client.get(self.GRADES_URL, headers=headers)
                if grades_response.status_code != 200:
                    raise SchoolServerError("無法取得成績資料")
                    
                grades_data = grades_response.json()
                
                records = []
                for item in grades_data.get("result", []):
                    year = item.get("hy", 0)
                    semester_num = item.get("htPeriod", 0)
                    course_type = item.get("reqSelCNa", "")  
                    domain_info = item.get("gInfo", "") 
                    term_na = item.get("termNa", "") 
                    
                    classify_marks = []
                    is_dist = False
                    for classify in item.get("couClassify", []):
                        mark = classify.get("couClassifyNoteCna", "")
                        if mark: 
                            classify_marks.append(mark)
                            if "網" in mark:
                                is_dist = True
                    
                    course_name = item.get("couCNa", "")
                    if "-網" in course_name:
                        is_dist = True
                    
                    marks_str = ",".join(classify_marks)
                    category = f"{course_type}-{domain_info}" if domain_info else course_type
                    if marks_str:
                        category += f" [{marks_str}]"

                    score_str = item.get("scoreDisplay", "")
                    credits_val = item.get("credit", 0)

                    records.append(CourseRecord(
                        semester=f"{year}-{semester_num}",
                        course_name=course_name,
                        credits=credits_val,
                        score=score_str,
                        category=category,
                        is_distance_learning=is_dist,
                        term_type=term_na
                    ))
                    
                # 2. 同步爬取選課系統 (僅抓當期正在修的課以提升效能)
                try:
                    estu_scraper = EstuScraper()
                    enrolled_courses = await estu_scraper.get_enrolled_courses(student_id, password, fetch_all_history=False)
                    
                    existing_enrolled = {
                        normalize_course_name(r.course_name): r
                        for r in records if self._is_enrolled_score(r.score)
                    }

                    for course in enrolled_courses:
                        course_name = course.get("科目名稱", "")
                        if not course_name: continue
                        
                        norm_name = normalize_course_name(course_name)
                        domain = course.get("通識領域", "").strip()
                        req_sel = course.get("學生選課設定選別", "").strip()
                        offering_dept = course.get("開課單位名稱", "").strip()
                        mark = course.get("課程標記", "")
                        
                        category = "必修"
                        if req_sel == "選": category = "選修"
                        elif req_sel == "通": category = f"通識-{domain}" if domain else "通識"
                        
                        if "英-專業" in mark:
                            category += " [英-專業]"

                        # 直接使用 ESTU 爬蟲精確解析出的時間
                        course_time = course.get("time", "")

                        if norm_name in existing_enrolled:
                            r = existing_enrolled[norm_name]
                            if offering_dept: r.offering_dept = offering_dept
                            if course_time: r.time = course_time
                            r.category = self._more_specific_category(r.category, category)
                        else:
                            try:
                                c_val = int(float(course.get("學分", 0)))
                            except:
                                c_val = 0

                            # 直接使用 ESTU 爬蟲精確解析出的時間
                            course_time = course.get("time", "")

                            records.append(CourseRecord(
                                semester=f"{course.get('學年度', '114')}-{course.get('學期', '2')}",
                                course_name=course_name,
                                credits=c_val,
                                score="", 
                                category=category,
                                offering_dept=offering_dept,
                                time=course_time
                            ))
                except Exception as estu_e:
                    print(f"⚠️ 選課系統當期資料同步失敗: {estu_e}")
                
                records = self._deduplicate_enrolled_records(records)

                prefix = student_id[0]
                if len(student_id) >= 3 and prefix in ['4', '5']:
                    estimated_enrollment_year = 100 + int(student_id[1:3])
                else:
                    estimated_enrollment_year = 0
                
                department_code = student_id[3:5] if len(student_id) >= 5 else ""
                department_name = DEPARTMENT_MAP.get(department_code, "未知系所")

                summary, warnings = self.audit_service.calculate_credit_summary(records, department_name, estimated_enrollment_year)

                return StudentData(
                    student_id=student_id,
                    department_name=department_name, 
                    enrollment_year=estimated_enrollment_year,
                    course_records=records,
                    credit_summary=summary,
                    warnings=warnings,
                    is_first_time=True
                )

            except httpx.HTTPError as e:
                raise SchoolServerError(f"學校伺服器連線異常: {str(e)}")
            except (FjuAuthError, SchoolServerError) as e:
                raise e
            except Exception as e:
                import traceback
                print(traceback.format_exc())
                raise DataProcessingError(f"處理學生資料時發生錯誤: {str(e)}")

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
