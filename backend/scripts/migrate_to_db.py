import json
import os
import sys
from pathlib import Path

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db.models import Base, Department, GraduationRule, GEExclusion

DB_PATH = "sqlite:///app/data/sa_hahaha.db"
engine = create_engine(DB_PATH)
Base.metadata.create_all(engine)
Session = sessionmaker(bind=engine)
session = Session()

# 1. 處理系所與畢業門檻
rules_dir = Path("app/data/rules")
files = list(rules_dir.glob("*.json"))

departments_map = {} # name -> id

for file_path in files:
    if file_path.name == ".notebook_cache.json": continue
    
    # 解析檔名 哲學系_114.json -> 哲學系, 114
    parts = file_path.stem.split("_")
    dept_name = parts[0]
    try:
        year = int(parts[1]) if len(parts) > 1 else None
    except ValueError:
        # 跳過非數字年份的檔案 (例如 _碩士班.json)
        print(f"Skipping non-bachelor file: {file_path.name}")
        continue
    
    with open(file_path, "r", encoding="utf-8") as f:
        try:
            data = json.load(f)
        except:
            continue
            
    # 建立或取得 department
    dept = session.query(Department).filter_by(name=dept_name).first()
    if not dept:
        dept = Department(name=dept_name)
        session.add(dept)
        session.commit()
        
    departments_map[dept_name] = dept.id
    
    # 建立 Rule
    if year:
        rule = session.query(GraduationRule).filter_by(department_id=dept.id, year=year).first()
        if not rule:
            rule = GraduationRule(department_id=dept.id, year=year)
            session.add(rule)
            
        rule.required_credits = data.get("required_credits", 0)
        rule.elective_credits = data.get("elective_credits", 0)
        rule.total_graduation_credits = data.get("total_graduation_credits", 0)
        rule.holistic_total_credits = data.get("holistic_total_credits", 32)
        rule.holistic_core_credits = data.get("holistic_core_credits", 10)
        rule.basic_skills_credits = data.get("basic_skills_credits", 12)
        rule.general_education_credits = data.get("general_education_credits", 10)
        rule.emi_course_minimum = data.get("emi_course_minimum", 0)
        
        # 轉換陣列為字串
        other_reqs = data.get("other_requirements", [])
        if isinstance(other_reqs, list):
            rule.other_requirements = json.dumps(other_reqs, ensure_ascii=False)
        else:
            rule.other_requirements = str(other_reqs)

session.commit()
print("✅ JSON 畢業門檻匯入完成")

# 2. 處理通識排除名單
tsv_path = rules_dir / "ge_exclusions.tsv"
if tsv_path.exists():
    with open(tsv_path, "r", encoding="utf-8") as f:
        lines = f.readlines()
        
    current_dept_id = None
    
    # TSV parser logic - the provided format is messy (copied from a table).
    # We will do a robust line-by-line parsing looking for course patterns.
    import re
    course_pattern = re.compile(r'(.+?)\(([A-Z0-9]+)\)')
    
    for line in lines:
        line = line.strip()
        if not line or "未設定排除科目" in line or "排除學群之科目" in line:
            continue
            
        parts = line.split('\t')
        
        # Check if this line defines a new department (e.g. "藝術學院	(日)應美	...")
        if len(parts) >= 2 and any(k in parts[0] for k in ["學院", "不分院"]):
            raw_dept = parts[1].replace("(日)", "").replace("(技)", "").strip()
            # 模糊比對系名 (e.g. "應美" -> "應用美術系")
            dept = session.query(Department).filter(Department.name.like(f"%{raw_dept}%")).first()
            if dept:
                current_dept_id = dept.id
            else:
                current_dept_id = None
                
        # Parse courses if we have an active department
        if current_dept_id:
            # Find all courses in the line
            matches = course_pattern.findall(line)
            for name, code in matches:
                # Simple domain guess based on prefix
                domain = "NT" if "NT" in code else "PT" if "PT" in code else "ST" if "ST" in code else "DT" if "DT" in code else "未知"
                
                # Check if exists
                ex = session.query(GEExclusion).filter_by(
                    department_id=current_dept_id, 
                    course_code=code
                ).first()
                
                if not ex:
                    ex = GEExclusion(
                        department_id=current_dept_id,
                        domain_category=domain,
                        course_code=code,
                        course_name=name.split("-")[-1] # Remove the group prefix like 資訊科技學群-
                    )
                    session.add(ex)

    session.commit()
    print("✅ 通識排除名單匯入完成")

print("🎉 資料庫轉換作業全部結束！ DB saved to app/data/sa_hahaha.db")
