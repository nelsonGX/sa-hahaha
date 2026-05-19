import subprocess
import json
import os
import sys
import time
import re

# 預設的主筆記本 ID (輔大畢業門檻資料庫)
MASTER_NOTEBOOK_ID = "d838553d-8ce6-4578-b915-f4c106357000"

def run_command(cmd):
    """執行 shell 指令並傳回結果"""
    print(f"Executing: {' '.join(cmd)}")
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"Error: {result.stderr}")
        return None
    return result.stdout

def generate_rule_for_dept(dept_name, year="114"):
    """
    為指定系所生成畢業門檻 JSON。
    流程：
    1. 使用 nlm research start --notebook-id [MASTER_ID] --mode fast 進行搜尋。
    2. 針對該 Master Notebook 進行結構化提問。
    3. 儲存 JSON。
    """
    filename = f"app/data/rules/{dept_name}_{year}.json"
    if os.path.exists(filename):
        print(f"Rule for {dept_name} {year} already exists. Skipping.")
        return True

    print(f"\n--- Processing: {dept_name} ({year}) ---")
    
    # 1. Start Research (將資料加入主筆記本)
    topic = f"輔仁大學 {dept_name} {year}學年度 畢業學分 必修科目表 畢業門檻"
    # 使用 --notebook-id 指定加入現有的筆記本，且使用 --mode fast
    res_out = run_command(["nlm", "research", "start", topic, "--mode", "fast", "--notebook-id", MASTER_NOTEBOOK_ID])
    
    if not res_out:
        return False
        
    print(f"Research started for {dept_name} in Master Notebook {MASTER_NOTEBOOK_ID}")

    # 2. Wait for completion
    max_retries = 10
    for i in range(max_retries):
        print(f"Checking status ({i+1}/{max_retries})...")
        status_out = run_command(["nlm", "research", "status", MASTER_NOTEBOOK_ID])
        if "completed" in status_out.lower() or "finished" in status_out.lower() or "success" in status_out.lower():
            print("Research completed.")
            break
        time.sleep(10)
    else:
        print("Research timed out. Proceeding anyway...")
    
    # 3. Import sources
    print("Importing sources to Master Notebook...")
    run_command(["nlm", "research", "import", MASTER_NOTEBOOK_ID])
    time.sleep(2)

    # 4. Query Master Notebook for structured data
    # 這裡我們加入一些校級的基礎規則提示，避免 AI 抓到舊資訊
    query = f"""
    請根據這本筆記本的內容，以 JSON 格式回傳『{dept_name}』在『{year}』學年度的畢業門檻。
    
    注意：如果這本筆記本中有關 114 學年度的通用規定與特定系所規定衝突，請遵循 114 學年度全校公版：
    - 全人核心學分: 10
    - 通識涵養學分: 10 (含人文、自然、社會、永續四大領域各 2 學分)
    
    必須包含以下欄位：
    - department_name: 系所全名
    - required_credits: 專業必修學分總數 (數值)
    - elective_credits: 畢業應修選修學分總數 (數值)
    - total_graduation_credits: 畢業總學分 (數值)
    - holistic_total_credits: 全人教育總學分 (32)
    - holistic_core_credits: 全人核心學分 (10)
    - basic_skills_credits: 基本能力學分 (12)
    - general_education_credits: 通識學分 (10)
    - emi_course_minimum: EMI 課程要求 (門數或學分)
    - other_requirements: 其他門檻列表
    
    請直接回傳純 JSON 字串，不要包含 markdown 標記。
    """
    
    query_out = run_command(["nlm", "notebook", "query", MASTER_NOTEBOOK_ID, query, "--json"])
    if not query_out:
        return False

    try:
        query_data = json.loads(query_out)
        answer = query_data.get("value", {}).get("answer", "")
        
        start = answer.find("{")
        end = answer.rfind("}") + 1
        if start != -1 and end != -1:
            json_str = answer[start:end]
            final_json = json.loads(json_str)
            
            with open(filename, "w", encoding="utf-8") as f:
                json.dump(final_json, f, indent=2, ensure_ascii=False)
            print(f"✅ Successfully saved rule to {filename}")
            return True
        else:
            print("Could not extract JSON from the answer.")
            return False
    except Exception as e:
        print(f"Error parsing query output: {e}")
        return False

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python scripts/auto_rules_generator.py [DeptName] [Year]")
        sys.exit(1)
    
    dept = sys.argv[1]
    yr = sys.argv[2] if len(sys.argv) > 2 else "114"
    generate_rule_for_dept(dept, yr)
