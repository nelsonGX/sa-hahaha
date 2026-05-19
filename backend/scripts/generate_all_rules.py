import sys
import os
import time

# 將 backend 目錄加入 sys.path 以便匯入
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.scraper_service import FjuScraperService
from scripts.auto_rules_generator import generate_rule_for_dept

def generate_all_rules(year="114", start_idx=0, max_count=None):
    scraper = FjuScraperService()
    departments = list(scraper.DEPARTMENT_MAP.values())
    
    # 移除重複的系所名稱
    unique_departments = []
    for d in departments:
        if d not in unique_departments:
            unique_departments.append(d)
            
    print(f"總共找到 {len(unique_departments)} 個獨立系所。")
    
    target_departments = unique_departments[start_idx:]
    if max_count:
        target_departments = target_departments[:max_count]
        
    print(f"預計處理 {len(target_departments)} 個系所 (學年度: {year})...")
    
    success_count = 0
    fail_count = 0
    
    for i, dept in enumerate(target_departments):
        print(f"\n[{i+1}/{len(target_departments)}] 正在處理: {dept}")
        try:
            success = generate_rule_for_dept(dept, year)
            if success:
                success_count += 1
            else:
                fail_count += 1
                
            # 避免被 NotebookLM 限制，每次處理完休息 15 秒
            print("休息 15 秒以避免 Rate Limit...")
            time.sleep(15)
            
        except Exception as e:
            print(f"處理 {dept} 時發生錯誤: {e}")
            fail_count += 1
            time.sleep(15)
            
    print("\n" + "="*30)
    print(f"批次處理完成！")
    print(f"成功: {success_count} 個")
    print(f"失敗: {fail_count} 個")
    print("="*30)

if __name__ == "__main__":
    year_arg = sys.argv[1] if len(sys.argv) > 1 else "114"
    # 可選參數：從第幾個系開始跑 (避免中斷後要重頭跑)
    start_arg = int(sys.argv[2]) if len(sys.argv) > 2 else 0
    # 可選參數：最多跑幾個系 (用於測試)
    max_arg = int(sys.argv[3]) if len(sys.argv) > 3 else None
    
    if year_arg.lower() == "all":
        years = ["114", "113", "112", "111", "110"]
        for y in years:
            print(f"\n{'='*40}\n開始處理 {y} 學年度全校規則\n{'='*40}")
            generate_all_rules(year=y, start_idx=start_arg, max_count=max_arg)
            # 跑完一個學年度後，強制將 start_idx 歸零，否則下個學年度會從中間開始
            start_arg = 0
            if y != years[-1]:
                print(f"\n{y} 學年度處理完畢！大休息 30 秒，準備處理下一個學年度...")
                time.sleep(30)
    else:
        generate_all_rules(year=year_arg, start_idx=start_arg, max_count=max_arg)
