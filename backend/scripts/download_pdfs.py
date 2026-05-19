import os
import argparse
import requests
from bs4 import BeautifulSoup
from pathlib import Path
import urllib.parse
import urllib3

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

def download_pdfs(year: str, dest_dir: Path):
    dest_dir.mkdir(parents=True, exist_ok=True)
    
    # 由於輔大課務組網頁可能會阻擋簡單的腳本請求，這裡提供一個基本的爬蟲框架。
    # 實際上，如果有特定的 anti-bot 機制，可能需要手動下載。
    url = f"https://academic.fju.edu.tw/curriculum.jsp?labelID=6"
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://academic.fju.edu.tw/'
    }
    
    print(f"嘗試從 {url} 獲取 {year} 學年度的必修科目表...")
    
    session = requests.Session()
    try:
        response = session.get(url, headers=headers, verify=False, timeout=10)
        response.encoding = 'utf-8'
        
        if "錯誤的指示" in response.text:
            print("⚠️ 輔大網站阻擋了自動爬蟲。請您手動從輔大課務組網站下載 PDF，並放置於 app/data/pdfs/ 目錄下。")
            return
            
        soup = BeautifulSoup(response.text, 'html.parser')
        links = soup.find_all('a', href=True)
        
        pdf_links = []
        for l in links:
            href = l['href']
            # 假設連結包含年份，且結尾是 pdf 或檔案類型
            if year in l.text and '.pdf' in href.lower():
                pdf_links.append((l.text.strip(), href))
                
        if not pdf_links:
            print(f"未找到 {year} 學年度的 PDF 連結，請確認網頁結構或手動下載。")
            return
            
        for name, link in pdf_links:
            full_url = urllib.parse.urljoin(url, link)
            print(f"下載: {name} -> {full_url}")
            
            pdf_resp = session.get(full_url, headers=headers, verify=False, timeout=10)
            if pdf_resp.status_code == 200:
                # 檔名清理
                safe_name = "".join(c for c in name if c.isalnum() or c in (' ', '-', '_')).strip()
                file_path = dest_dir / f"{safe_name}_{year}.pdf"
                with open(file_path, "wb") as f:
                    f.write(pdf_resp.content)
                print(f"✅ 已儲存至 {file_path}")
            else:
                print(f"❌ 下載失敗: {pdf_resp.status_code}")
                
    except Exception as e:
        print(f"執行時發生錯誤: {e}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="自動下載輔大各系必修科目表 PDF")
    parser.add_argument("--year", type=str, default="113", help="要下載的學年度 (預設: 113)")
    args = parser.parse_args()
    
    pdf_dir = Path(__file__).parent.parent / "app" / "data" / "pdfs"
    download_pdfs(args.year, pdf_dir)
