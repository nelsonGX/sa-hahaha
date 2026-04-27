import sys
from app.services.estu_scraper import EstuScraper
from bs4 import BeautifulSoup

def debug_scraper(student_id, pwd):
    scraper = EstuScraper()
    response = scraper.session.get(scraper.LOGIN_URL)
    response.encoding = 'utf-8'
    soup = BeautifulSoup(response.text, 'html.parser')
    
    viewstate = soup.find("input", {"id": "__VIEWSTATE"})
    eventvalidation = soup.find("input", {"id": "__EVENTVALIDATION"})
    viewstategenerator = soup.find("input", {"id": "__VIEWSTATEGENERATOR"})
    
    payload = {
        "__VIEWSTATE": viewstate["value"],
        "__VIEWSTATEGENERATOR": viewstategenerator["value"] if viewstategenerator else "",
        "__EVENTVALIDATION": eventvalidation["value"],
        "TxtLdapId": student_id,
        "TxtLdapPwd": pwd,
        "ButLogin": "登 入 "
    }
    
    login_response = scraper.session.post(scraper.LOGIN_URL, data=payload)
    login_response.encoding = 'utf-8'
    
    with open("estu_result.html", "w", encoding="utf-8") as f:
        f.write(login_response.text)
    
    result_soup = BeautifulSoup(login_response.text, 'html.parser')
    tables = result_soup.find_all("table")
    for i, table in enumerate(tables):
        print(f"--- Table {i} ---")
        rows = table.find_all("tr")
        if rows:
            headers = [th.text.strip().replace("\n", "").replace(" ", "") for th in rows[0].find_all(["th", "td"])]
            print(f"Headers: {headers}")

if __name__ == "__main__":
    if len(sys.argv) == 3:
        debug_scraper(sys.argv[1], sys.argv[2])
