import requests
from bs4 import BeautifulSoup
from typing import List, Dict

class EstuScraper:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "Accept-Language": "zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7",
        })
        self.LOGIN_URL = "http://estu.fju.edu.tw/CheckSelList/HisListNew.aspx"

    def get_enrolled_courses(self, student_id: str, password: str) -> List[Dict]:
        """登入選課系統並爬取當前學期的課程清單"""
        response = self.session.get(self.LOGIN_URL)
        response.encoding = 'utf-8'
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
        
        login_response = self.session.post(self.LOGIN_URL, data=payload)
        login_response.encoding = 'utf-8'
        result_soup = BeautifulSoup(login_response.text, 'html.parser')
        
        if "請重新輸入" in login_response.text or "密碼錯誤" in login_response.text:
            raise ValueError("選課系統登入失敗：帳號或密碼錯誤")

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
            return []

        # 處理巢狀表格，只抓第一層 tr
        tbody = target_table.find("tbody")
        if tbody:
            rows = tbody.find_all("tr", recursive=False)
        else:
            rows = target_table.find_all("tr", recursive=False)

        if not rows:
            return []

        # 取得標題 (注意網頁上可能會有奇怪的空白，例如 "學生 選課設定選別")
        headers = [th.text.strip().replace("\n", "").replace(" ", "") for th in rows[0].find_all(["th", "td"], recursive=False)]
        
        courses = []
        for row in rows[1:]:
            cols = row.find_all("td", recursive=False)
            if len(cols) >= 10:
                course_data = {}
                for i, col in enumerate(cols):
                    if i < len(headers):
                        val = col.text.strip()
                        # 清理換行符號
                        val = " ".join(val.split())
                        course_data[headers[i]] = val
                
                # 確定這是一筆有效的課程
                if course_data.get('科目名稱'):
                    courses.append(course_data)

        return courses

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