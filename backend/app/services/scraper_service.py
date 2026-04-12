import requests
from bs4 import BeautifulSoup
from schemas.credit_schema import StudentData, CourseRecord

class FjuScraperService:
    def __init__(self):
        # 使用 Session 可以自動幫我們記住登入後的 Cookies
        self.session = requests.Session()
        # TODO: 替換成輔大 SIS 系統真實的登入網址與成績網址
        self.LOGIN_URL = "https://sis.fju.edu.tw/login" 
        self.GRADES_URL = "https://sis.fju.edu.tw/student/grades"

    def scrape_student_data(self, student_id: str, password: str, use_mock: bool = True) -> StudentData:
        """
        執行爬蟲任務：登入 -> 抓網頁 -> 解析 -> 回傳 Pydantic 物件
        """
        if use_mock:
            print(f"⚠️ 使用 Mock 資料，模擬登入學號: {student_id}")
            return self._get_mock_data(student_id)

        try:
            # 1. 準備登入的表單資料 (Payload)
            login_payload = {
                "Account": student_id,
                "Password": password
            }
            
            # 2. 發送登入請求
            login_response = self.session.post(self.LOGIN_URL, data=login_payload, timeout=10)
            if "登入失敗" in login_response.text:
                raise ValueError("帳號或密碼錯誤，登入 SIS 失敗")

            # 3. 進入歷年成績頁面
            grades_response = self.session.get(self.GRADES_URL, timeout=10)
            grades_response.encoding = 'utf-8' # 確保中文不亂碼
            
            # 4. 使用 BeautifulSoup 解析 HTML
            soup = BeautifulSoup(grades_response.text, 'html.parser')
            records = []
            
            # 找到包含成績的 tbody
            tbody = soup.find('tbody')
            if not tbody:
                raise ValueError("找不到成績表格，可能是學校系統改版，或這是一個純前端渲染(SPA)的網站。")
                
            rows = tbody.find_all('tr')
            for row in rows:
                cols = row.find_all('td')
                if len(cols) < 11:
                    continue # 跳過不完整的資料列
                    
                # 根據你提供的 HTML 結構解析欄位
                course_category = cols[0].text.strip() # 一般學期 / 暑修
                year = cols[1].text.strip()            # 114
                semester_num = cols[2].text.strip()    # 1
                course_type = cols[3].text.strip()     # 必修 / 選修 / 通識
                
                # 科目名稱 (因為裡面可能包著 div，我們只要第一層的文字)
                course_name = cols[4].contents[0].strip() if cols[4].contents else ""
                if not course_name: # fallback
                    course_name = cols[4].text.strip().split('\n')[0]
                
                credits_str = cols[5].text.strip()
                credits = int(credits_str) if credits_str.isdigit() else 0
                
                domain = cols[7].text.strip()          # 通識領域
                score_str = cols[8].text.strip()       # 成績 (可能是數字或"停修")
                
                # 組合 category (例如：必修，或是通識-社會科學領域)
                category = f"{course_type}-{domain}" if domain else course_type
                if not category:
                    category = "其他"
                    
                records.append(CourseRecord(
                    semester=f"{year}-{semester_num}",
                    course_name=course_name,
                    credits=credits,
                    score=score_str,
                    category=category
                ))
            
            # TODO: 這裡的學號、系所等資訊可能需要從另一個 API 或頁面上方抓取
            return StudentData(
                student_id=student_id,
                department_name="未知系所", 
                enrollment_year=int(year) - 3, # 暫時推估
                course_records=records
            )

        except requests.exceptions.RequestException as e:
            raise Exception(f"網路連線異常: {str(e)}")
        finally:
            # 安全機制：確保最後清空 Session
            self.session.cookies.clear()

    def _get_mock_data(self, student_id: str) -> StudentData:
        """假資料產生器"""
        return StudentData(
            student_id=student_id,
            department_name="資訊管理學系",
            enrollment_year=112,
            course_records=[
                CourseRecord(semester="112-1", course_name="計算機概論", credits=3, score="85", category="系必修"),
                CourseRecord(semester="112-1", course_name="會計學", credits=3, score="55", category="系必修"),
                CourseRecord(semester="112-2", course_name="程式設計", credits=3, score="92", category="系必修"),
                CourseRecord(semester="112-2", course_name="哲學與人生", credits=2, score="78", category="全人-哲學"),
            ]
        )
