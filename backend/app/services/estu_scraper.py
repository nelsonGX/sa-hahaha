import httpx
from bs4 import BeautifulSoup
from typing import List, Dict
from app.utils.exceptions import FjuAuthError, SchoolServerError

class EstuScraper:
    def __init__(self):
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "Accept-Language": "zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7",
        }
        self.LOGIN_URL = "http://estu.fju.edu.tw/CheckSelList/HisListNew.aspx"

    async def get_enrolled_courses(self, student_id: str, password: str, fetch_all_history: bool = False) -> List[Dict]:
        """登入選課系統並爬取課程清單 (可選是否抓取歷年紀錄)"""
        async with httpx.AsyncClient(headers=self.headers, follow_redirects=True, timeout=15.0) as client:
            try:
                response = await client.get(self.LOGIN_URL)
                soup = BeautifulSoup(response.text, 'html.parser')
                
                viewstate = soup.find("input", {"id": "__VIEWSTATE"})
                eventvalidation = soup.find("input", {"id": "__EVENTVALIDATION"})
                viewstategenerator = soup.find("input", {"id": "__VIEWSTATEGENERATOR"})
                
                if not viewstate or not eventvalidation:
                    return []
                    
                payload = {
                    "__VIEWSTATE": viewstate["value"],
                    "__VIEWSTATEGENERATOR": viewstategenerator["value"] if viewstategenerator else "",
                    "__EVENTVALIDATION": eventvalidation["value"],
                    "TxtLdapId": student_id,
                    "TxtLdapPwd": password,
                    "ButLogin": "登 入 "
                }
                
                login_response = await client.post(self.LOGIN_URL, data=payload)
                
                if "請重新輸入" in login_response.text or "密碼錯誤" in login_response.text:
                    raise FjuAuthError("選課系統登入失敗：帳號或密碼錯誤")

                result_soup = BeautifulSoup(login_response.text, 'html.parser')
                all_courses = []
                
                # 取得所有可選學期
                semester_options = result_soup.find("select", {"id": "DDL_YM"})
                semesters_to_fetch = []
                if semester_options:
                    if fetch_all_history:
                        semesters_to_fetch = [opt["value"] for opt in semester_options.find_all("option")]
                    else:
                        selected = semester_options.find("option", selected=True)
                        semesters_to_fetch = [selected["value"]] if selected else [semester_options.find("option")["value"]]

                for semester_val in semesters_to_fetch:
                    # 如果不是第一個學期，需要發送 PostBack 切換學期
                    if len(semesters_to_fetch) > 1:
                        # 重新取得最新的 ASP.NET 隱藏欄位
                        viewstate = result_soup.find("input", {"id": "__VIEWSTATE"})["value"]
                        eventvalidation = result_soup.find("input", {"id": "__EVENTVALIDATION"})["value"]
                        
                        payload = {
                            "__EVENTTARGET": "DDL_YM",
                            "__EVENTARGUMENT": "",
                            "__LASTFOCUS": "",
                            "__VIEWSTATE": viewstate,
                            "__EVENTVALIDATION": eventvalidation,
                            "DDL_YM": semester_val
                        }
                        semester_response = await client.post(self.LOGIN_URL, data=payload)
                        result_soup = BeautifulSoup(semester_response.text, 'html.parser')

                    # 解析當前頁面的表格
                    tables = result_soup.find_all("table")
                    target_table = None
                    for table in tables:
                        rows = table.find_all("tr")
                        if not rows:
                            continue
                        headers = [th.text.strip().replace("\n", "").replace(" ", "") for th in rows[0].find_all(["th", "td"])]
                        if "NO" in headers and "科目名稱" in headers and "學分" in headers:
                            target_table = table
                            break
                            
                    if not target_table:
                        continue

                    # 處理巢狀表格，只抓第一層 tr
                    tbody = target_table.find("tbody")
                    rows = tbody.find_all("tr", recursive=False) if tbody else target_table.find_all("tr", recursive=False)

                    if not rows:
                        continue

                    # 取得標題
                    headers = [th.text.strip().replace("\n", "").replace(" ", "") for th in rows[0].find_all(["th", "td"], recursive=False)]
                    
                    for row in rows[1:]:
                        cols = row.find_all("td", recursive=False)
                        if len(cols) >= 10:
                            course_data = {}
                            time_parts = []
                            current_day = ""
                            current_period = ""
                            
                            for i, col in enumerate(cols):
                                if i < len(headers):
                                    val = col.text.strip()
                                    val = " ".join(val.split())
                                    header = headers[i]
                                    
                                    if header == "星期":
                                        current_day = val
                                    elif header == "節次":
                                        current_period = val
                                    elif header == "教室":
                                        current_room = val
                                        if current_day and current_period:
                                            day_str = f"週{current_day}" if current_day in "一二三四五六日" else current_day
                                            room_str = f" ({current_room})" if current_room else ""
                                            time_parts.append(f"{day_str} {current_period}{room_str}")
                                        current_day = ""
                                        current_period = ""
                                    elif header not in course_data:
                                        course_data[header] = val
                            
                            if time_parts:
                                course_data['time'] = " / ".join(time_parts)
                            
                            if course_data.get('科目名稱'):
                                if "\n" in course_data['科目名稱']:
                                    course_data['科目名稱'] = course_data['科目名稱'].split('\n')[0].strip()
                                all_courses.append(course_data)

                return all_courses
            except httpx.HTTPError as e:
                raise SchoolServerError(f"連線至選課系統發生錯誤: {str(e)}")
            except Exception as e:
                if isinstance(e, (FjuAuthError, SchoolServerError)):
                    raise e
                raise SchoolServerError(f"爬取選課系統資料時發生非預期錯誤: {str(e)}")

if __name__ == "__main__":
    import sys
    if len(sys.argv) == 3:
        scraper = EstuScraper()
        print("開始登入選課系統...")
        try:
            courses = scraper.get_enrolled_courses(sys.argv[1], sys.argv[2])
            if courses:
                print(f"\n成功爬取 {len(courses)} 門課程！")
                for i, c in enumerate(courses):
                    print(f"[{i+1}] {c.get('科目名稱')} | 學分: {c.get('學分')} | 選別: {c.get('學生選課設定選別')} | 通識領域: {c.get('通識領域')} | 標記: {c.get('課程標記')}")
            else:
                print("沒有找到課程資料。")
        except Exception as e:
            print(e)
    else:
        print("使用方式: python -m app.services.estu_scraper <學號> <LDAP密碼>")