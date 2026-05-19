import time
import random
from playwright.sync_api import sync_playwright
from playwright_stealth import Stealth

def test_playwright_login(username, password):
    with sync_playwright() as p:
        # 為了測試，我們開啟 headed 模式 (可以看到瀏覽器操作)
        # headless=False 代表會顯示瀏覽器視窗
        browser = p.chromium.launch(headless=False, args=['--disable-blink-features=AutomationControlled'])
        
        # 創建一個 context，模擬真實使用者的 user-agent
        context = browser.new_context(
            user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            viewport={'width': 1280, 'height': 800}
        )
        
        page = context.new_page()
        
        # 套用 stealth 隱藏指紋
        stealth = Stealth()
        stealth.apply_stealth_sync(page)
        
        url = "https://learningcounseling.fju.edu.tw/Student"
        print(f"正在前往: {url}")
        
        try:
            page.goto(url, wait_until="networkidle")
            print("頁面載入完成，等待一下讓 JS 執行...")
            time.sleep(random.uniform(2.0, 4.0)) # 隨機停頓，模擬真人
            
            # 尋找輸入框並「模擬真人打字」 (不要一次貼上)
            print("開始輸入帳號密碼...")
            # 輔大的 id 可能是 LdapID，pwd 可能是 LdapPassword
            page.locator("input[name='LdapID'], input[id='LdapID'], input[type='text']").first.type(username, delay=random.randint(50, 150))
            time.sleep(random.uniform(0.5, 1.5))
            
            page.locator("input[name='LdapPassword'], input[id='LdapPassword'], input[type='password']").first.type(password, delay=random.randint(50, 150))
            time.sleep(random.uniform(1.0, 2.0))
            
            # 點擊登入按鈕
            print("點擊登入按鈕...")
            page.locator("button[type='submit'], input[type='submit'], .btn-primary").first.click()
            
            # 等待跳轉或錯誤訊息出現 (最多等 10 秒)
            print("等待登入結果...")
            page.wait_for_timeout(5000) # 給他一點時間看會不會轉圈圈
            
            # 檢查結果
            page_text = page.content()
            if "鍾孟奇" in page_text or "登出" in page_text:
                print("✅ Playwright 成功突破 Cloudflare 並登入！")
                
                # 試著點進檢核表
                print("嘗試進入檢核表...")
                links = page.locator("a").all()
                for link in links:
                    text = link.inner_text()
                    if '檢核' in text or 'Check' in text:
                        link.click()
                        page.wait_for_timeout(3000)
                        break
                        
                with open('playwright_success.html', 'w', encoding='utf-8') as f:
                    f.write(page.content())
                print("已將最終 HTML 存入 playwright_success.html")
                
            elif "Cloudflare" in page_text or "Turnstile" in page_text:
                print("❌ 失敗：還是被 Cloudflare 抓到了。")
                # 截個圖看看 Cloudflare 顯示什麼
                page.screenshot(path="cloudflare_block.png")
                print("已截圖至 cloudflare_block.png")
            else:
                print("⚠️ 狀態未明，請看截圖或 HTML。")
                page.screenshot(path="unknown_status.png")
                with open('playwright_unknown.html', 'w', encoding='utf-8') as f:
                    f.write(page_text)
                    
        except Exception as e:
            print(f"執行期間發生錯誤: {e}")
            
        finally:
            print("保留瀏覽器視窗 5 秒鐘供您查看...")
            time.sleep(5)
            browser.close()

if __name__ == "__main__":
    test_playwright_login("413401223", "By775come733")
