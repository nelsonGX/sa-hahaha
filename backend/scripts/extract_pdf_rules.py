import os
import json
import argparse
import pdfplumber
import re
from pathlib import Path

def extract_rules_from_pdf(pdf_path: Path, output_dir: Path):
    print(f"正在解析: {pdf_path.name}")
    
    # 解析檔名取得系所與年度，假設檔名格式為 "資訊管理學系_113.pdf" 或類似
    # 這裡採用一個 heuristic，抓取中文系所名稱
    dept_match = re.search(r'([\u4e00-\u9fa5]+系|[\u4e00-\u9fa5]+學程)', pdf_path.name)
    department_name = dept_match.group(1) if dept_match else "未知系所"
    
    year_match = re.search(r'(\d{3})', pdf_path.name)
    year = year_match.group(1) if year_match else "113"

    # 初始化預設 JSON 結構
    rules = {
        "department_name": department_name,
        "required_credits": 0,
        "elective_credits": 0,
        "holistic_total_credits": 32,
        "holistic_core_credits": 8,
        "basic_skills_credits": 12,
        "general_education_credits": 12,
        "general_education_domains": {
            "人文藝術領域": 4,
            "自然科技領域": 4,
            "社會科學領域": 4
        },
        "pe_semesters": 4,
        "holistic_core_keywords": ["大學入門", "人生哲學", "專業倫理", "企業倫理"],
        "basic_skills_keywords": ["國文", "外語", "外國語文", "英語", "英文", "法文", "德文", "日文", "西班牙文", "韓文"],
        "pe_keywords": ["體育", "羽球", "桌球", "游泳", "網球", "排球", "籃球"],
        "prerequisites": []
    }

    try:
        text = ""
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                extracted = page.extract_text()
                if extracted:
                    text += extracted + "\n"
                
                # 嘗試從表格中提取學分數
                tables = page.extract_tables()
                for table in tables:
                    for row in table:
                        row_text = " ".join(str(cell) for cell in row if cell)
                        # 啟發式尋找「必修」與「選修」學分
                        if "必修" in row_text and "學分" in row_text:
                            nums = re.findall(r'\d+', row_text)
                            if nums:
                                # 取最大值，通常代表總必修學分 (這是一個大膽的假設，需要人工覆核)
                                rules["required_credits"] = max(int(n) for n in nums)
                        if "選修" in row_text and "學分" in row_text:
                            nums = re.findall(r'\d+', row_text)
                            if nums:
                                rules["elective_credits"] = max(int(n) for n in nums)
                                
        # 如果透過表格沒抓到，嘗試透過全文正則擷取
        if rules["required_credits"] == 0:
            req_match = re.search(r'必修[^\d]*(\d{2,3})[^\d]*學分', text)
            if req_match:
                rules["required_credits"] = int(req_match.group(1))
                
        if rules["elective_credits"] == 0:
            ele_match = re.search(r'選修[^\d]*(\d{2,3})[^\d]*學分', text)
            if ele_match:
                rules["elective_credits"] = int(ele_match.group(1))

    except Exception as e:
        print(f"⚠️ 讀取 PDF 時發生錯誤: {e}")

    output_path = output_dir / f"{department_name}_{year}.json"
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(rules, f, ensure_ascii=False, indent=4)
        
    print(f"✅ 已輸出初步規則範本至 {output_path}")
    print("   請手動檢閱並修正該 JSON 檔案的學分數與擋修規則！")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="從 PDF 萃取畢業門檻規則並輸出為 JSON")
    parser.add_argument("--pdf-dir", type=str, default="../app/data/pdfs", help="PDF 所在目錄")
    parser.add_argument("--output-dir", type=str, default="../app/data/rules", help="JSON 輸出目錄")
    args = parser.parse_args()
    
    pdf_dir = Path(__file__).parent / args.pdf_dir
    output_dir = Path(__file__).parent / args.output_dir
    output_dir.mkdir(parents=True, exist_ok=True)
    
    if not pdf_dir.exists() or not any(pdf_dir.iterdir()):
        print(f"找不到 PDF 檔案在 {pdf_dir}。請先執行 download_pdfs.py 或手動放入 PDF。")
        exit(1)
        
    for pdf_file in pdf_dir.glob("*.pdf"):
        extract_rules_from_pdf(pdf_file, output_dir)
