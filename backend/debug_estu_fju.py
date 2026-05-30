import requests
from bs4 import BeautifulSoup

def debug_estu():
    print("=== ESTU Debugger ===")
    session = requests.Session()
    session.headers.update({
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    })
    
    # 這裡請使用者手動輸入帳密測試，或直接分析 HTML 結構
    login_url = "http://estu.fju.edu.tw/CheckSelList/HisListNew.aspx"
    
    print(f"Connecting to {login_url}...")
    try:
        r = session.get(login_url, timeout=10)
        r.encoding = 'utf-8'
        soup = BeautifulSoup(r.text, 'html.parser')
        
        # 檢查關鍵欄位
        print("Checking initial page...")
        vs = soup.find("input", {"id": "__VIEWSTATE"})
        print(f"Found VIEWSTATE: {bool(vs)}")
        
        print("\n[Instruction for User]")
        print("請確認以下事項：")
        print("1. 進修部的選課系統網址是否也是 http://estu.fju.edu.tw/CheckSelList/HisListNew.aspx ?")
        print("2. 登入後，體育課在表格中的『開課選別』或『學生選課設定選別』顯示什麼？")
        print("3. 表格的標題列（Header）是否包含『科目名稱』、『學分』、『通識領域』等？")
        print("\n如果你有登入後的 HTML 原始碼，可以提供表格的部分，我能更精確地修正。")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    debug_estu()
