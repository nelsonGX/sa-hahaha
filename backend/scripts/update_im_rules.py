import sys
import os
import json
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.db.models import Department, GraduationRule

DB_PATH = "sqlite:///app/data/sa_hahaha.db"
engine = create_engine(DB_PATH)
Session = sessionmaker(bind=engine)
session = Session()

dept_name = "資訊管理學系"
dept = session.query(Department).filter_by(name=dept_name).first()

if not dept:
    print(f"Error: Department {dept_name} not found in DB.")
    sys.exit(1)

# Updates for 114
rule_114 = session.query(GraduationRule).filter_by(department_id=dept.id, year=114).first()
if rule_114:
    rule_114.required_credits = 64
    rule_114.elective_credits = 32
    rule_114.total_graduation_credits = 128
    rule_114.holistic_total_credits = 32
    rule_114.holistic_core_credits = 10 # Updated for 114 (includes PE)
    rule_114.basic_skills_credits = 12
    rule_114.general_education_credits = 10 # Updated for 114
    rule_114.emi_course_minimum = 5 # 15 credits / 3 = 5 courses
    rule_114.other_requirements = json.dumps([
        "需修10學分系上開的專業選修課",
        "強制擋修：1、「系統分析與設計」擋修「資訊系統專題一」",
        "強制擋修：2、「資訊系統專題二」成績不及格，需重修「資訊系統專題一」及「資訊系統專題二」"
    ], ensure_ascii=False)

# Updates for 113
rule_113 = session.query(GraduationRule).filter_by(department_id=dept.id, year=113).first()
if rule_113:
    rule_113.required_credits = 64
    rule_113.elective_credits = 32
    rule_113.total_graduation_credits = 128
    rule_113.holistic_total_credits = 32
    rule_113.holistic_core_credits = 8 # 113 rules
    rule_113.basic_skills_credits = 12
    rule_113.general_education_credits = 12 # 113 rules
    rule_113.emi_course_minimum = 5
    rule_113.other_requirements = json.dumps([
        "需修10學分系上開的專業選修課",
        "強制擋修：1、「系統分析與設計」擋修「資訊系統專題一」",
        "強制擋修：2、「資訊系統專題二」成績不及格，需重修「資訊系統專題一」及「資訊系統專題二」"
    ], ensure_ascii=False)
    
# Updates for 112
rule_112 = session.query(GraduationRule).filter_by(department_id=dept.id, year=112).first()
if rule_112:
    rule_112.required_credits = 64
    rule_112.elective_credits = 32
    rule_112.total_graduation_credits = 128
    rule_112.holistic_total_credits = 32
    rule_112.holistic_core_credits = 8
    rule_112.basic_skills_credits = 12
    rule_112.general_education_credits = 12
    rule_112.emi_course_minimum = 5
    rule_112.other_requirements = json.dumps([
        "需修10學分系上開的專業選修課",
        "強制擋修：1、「系統分析與設計」擋修「資訊系統專題一」",
        "強制擋修：2、「資訊系統專題二」成績不及格，需重修「資訊系統專題一」及「資訊系統專題二」"
    ], ensure_ascii=False)

# Updates for 111
rule_111 = session.query(GraduationRule).filter_by(department_id=dept.id, year=111).first()
if rule_111:
    rule_111.required_credits = 64
    rule_111.elective_credits = 32
    rule_111.total_graduation_credits = 128
    rule_111.holistic_total_credits = 32
    rule_111.holistic_core_credits = 8
    rule_111.basic_skills_credits = 12
    rule_111.general_education_credits = 12
    rule_111.emi_course_minimum = 1 # Minimum of 1 courses (3 credits) for graduation
    rule_111.other_requirements = json.dumps([
        "需修10學分系上開的專業選修課",
        "強制擋修：1、「系統分析與設計」擋修「資訊系統專題一」",
        "強制擋修：2、「資訊系統專題二」成績不及格，需重修「資訊系統專題一」及「資訊系統專題二」"
    ], ensure_ascii=False)

session.commit()
print("✅ Information Management department rules updated successfully.")
