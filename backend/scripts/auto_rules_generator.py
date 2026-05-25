import subprocess
import json
import os
import sys
import time
import re

CACHE_FILE = "app/data/rules/.notebook_cache.json"

def get_active_notebook_id():
    """從快取讀取目前的 Notebook ID，若無則回傳預設值"""
    if os.path.exists(CACHE_FILE):
        try:
            with open(CACHE_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                return data.get("notebook_id")
        except:
            pass
    # 若無快取，回傳使用者剛剛建立的新 ID 作為起始點
    return "3b96477c-8170-4856-998a-1b96e9ec811f"

def set_active_notebook_id(notebook_id):
    """儲存新的 Notebook ID 到快取"""
    os.makedirs(os.path.dirname(CACHE_FILE), exist_ok=True)
    with open(CACHE_FILE, "w", encoding="utf-8") as f:
        json.dump({"notebook_id": notebook_id}, f)
    print(f"🔄 更新 Active Notebook ID 為: {notebook_id}")

def create_new_notebook():
    """自動建立新的筆記本並回傳 ID"""
    timestamp = time.strftime("%Y%m%d_%H%M%S")
    title = f"輔大畢業門檻資料庫_{timestamp}"
    print(f"📦 準備建立新筆記本: {title}")
    
    cmd = ["nlm", "notebook", "create", title, "--json"]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode == 0:
        try:
            data = json.loads(result.stdout)
            # 解析指令回傳的 json 格式
            new_id = data.get("value", {}).get("id") or data.get("id")
            if new_id:
                set_active_notebook_id(new_id)
                return new_id
        except Exception as e:
            print(f"❌ 解析新筆記本 ID 失敗: {e}")
            
    # 如果 --json 失敗，改用純文字解析
    cmd_text = ["nlm", "notebook", "create", title]
    result_text = subprocess.run(cmd_text, capture_output=True, text=True)
    if result_text.returncode == 0:
         # 利用正則表達式擷取 UUID
         match = re.search(r'[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}', result_text.stdout)
         if match:
             new_id = match.group(0)
             set_active_notebook_id(new_id)
             return new_id
             
    print(f"❌ 無法建立新筆記本: {result_text.stderr}")
    return None

def run_command(cmd):
    """執行 shell 指令並傳回結果物件"""
    print(f"Executing: {' '.join(cmd)}")
    result = subprocess.run(cmd, capture_output=True, text=True)
    return result

def generate_rule_for_dept(dept_name, year="114"):
    """
    為指定系所生成畢業門檻 JSON。
    """
    filename = f"app/data/rules/{dept_name}_{year}.json"
    if os.path.exists(filename):
        print(f"Rule for {dept_name} {year} already exists. Skipping.")
        return True

    print(f"\n--- Processing: {dept_name} ({year}) ---")
    
    current_notebook_id = get_active_notebook_id()
    
    # 1. Start Research & Import
    topic = f"輔仁大學 {dept_name} {year}學年度 畢業學分 必修科目表 畢業門檻"
    print(f"Starting research and auto-import for {dept_name} in Notebook: {current_notebook_id}...")
    
    cmd = ["nlm", "research", "start", topic, "--mode", "fast", "--notebook-id", current_notebook_id, "--force", "--auto-import"]
    res = run_command(cmd)
    
    if res.returncode != 0:
        # 檢查是否為來源滿了的錯誤 (API error code 9 / unknown / precondition)
        error_msg = res.stderr.lower() + res.stdout.lower()
        if "api error (code 9)" in error_msg or "failed to import sources" in error_msg or "precondition" in error_msg:
            print("⚠️ 偵測到 Notebook 來源數量可能已達上限 (50個)！自動建立新的 Notebook...")
            new_id = create_new_notebook()
            if new_id:
                print("🔄 重新嘗試在新的 Notebook 中執行 Research...")
                cmd[7] = new_id # 替換指令中的 notebook-id
                current_notebook_id = new_id
                res = run_command(cmd)
                if res.returncode != 0:
                     print(f"❌ 在新筆記本重試失敗: {res.stderr}")
                     return False
            else:
                return False
        else:
            print(f"❌ Research start/import failed: {res.stderr}")
            return False
            
    print("Research and import completed.")

    # 4. Query Master Notebook for structured data
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
    
    query_res = run_command(["nlm", "notebook", "query", current_notebook_id, query, "--json"])
    if query_res.returncode != 0:
        print(f"Query failed: {query_res.stderr}")
        return False

    try:
        query_data = json.loads(query_res.stdout)
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
