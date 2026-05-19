import requests
from bs4 import BeautifulSoup
import urllib3

urllib3.disable_warnings()

def test_login(username, password):
    session = requests.Session()
    session.verify = False
    
    url = "https://learningcounseling.fju.edu.tw/Student/"
    print(f"1. GET {url}")
    try:
        resp = session.get(url, timeout=10)
        resp.encoding = 'utf-8'
        soup = BeautifulSoup(resp.text, 'html.parser')
        
        form = soup.find('form')
        if not form:
            print("找不到 form 表單。")
            return
            
        action = form.get('action', '')
        login_url = f"https://learningcounseling.fju.edu.tw{action}" if action.startswith('/') else f"https://learningcounseling.fju.edu.tw/Student/{action}"
        
        payload = {}
        for input_tag in form.find_all('input'):
            name = input_tag.get('name')
            if not name: continue
            
            if name.lower() == 'id' or 'ldapid' in name.lower():
                payload[name] = username
            elif name.lower() == 'pwd' or 'ldappassword' in name.lower():
                payload[name] = password
            elif 'user' in name.lower() or 'account' in name.lower():
                payload[name] = username
            elif 'pass' in name.lower():
                payload[name] = password
            else:
                payload[name] = input_tag.get('value', '')
                
        print(f"2. POST {login_url}")
        print(f"Payload keys: {list(payload.keys())}")
        
        post_resp = session.post(login_url, data=payload, timeout=10)
        post_resp.encoding = 'utf-8'
        
        if "鍾孟奇" in post_resp.text or "登出" in post_resp.text:
            print("✅ 登入成功！")
            
            # 找檢核表連結
            links = BeautifulSoup(post_resp.text, 'html.parser').find_all('a', href=True)
            check_url = None
            for link in links:
                if '檢核' in link.text or 'Check' in link.text or 'Course' in link['href']:
                    check_url = f"https://learningcounseling.fju.edu.tw{link['href']}" if link['href'].startswith('/') else f"https://learningcounseling.fju.edu.tw/Student/{link['href']}"
                    print(f"找到疑似檢核表連結: {link.text.strip()} -> {check_url}")
                    break
                    
            if check_url:
                print(f"3. GET {check_url}")
                check_resp = session.get(check_url, timeout=10)
                check_resp.encoding = 'utf-8'
                with open('test_check_page.html', 'w', encoding='utf-8') as f:
                    f.write(check_resp.text)
                print("已儲存 HTML 至 test_check_page.html")
            else:
                with open('test_index_page.html', 'w', encoding='utf-8') as f:
                    f.write(post_resp.text)
                print("找不到檢核表連結，已儲存首頁 HTML。")
                
        else:
            print("❌ 登入失敗。")
            with open('test_fail.html', 'w', encoding='utf-8') as f:
                f.write(post_resp.text)
                
    except Exception as e:
        print(f"發生錯誤: {e}")

if __name__ == "__main__":
    test_login("413401223", "By775come733")
