import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db.models import Department, GraduationRule

DB_PATH = "sqlite:///app/data/sa_hahaha.db"
engine = create_engine(DB_PATH)
Session = sessionmaker(bind=engine)
session = Session()

# 找出資訊管理學系
dept = session.query(Department).filter_by(name="資訊管理學系").first()
if not dept:
    print("Department not found")
    sys.exit(1)

# 把 113、112、111 的 holistic_core_credits 設定為 8
rules = session.query(GraduationRule).filter(
    GraduationRule.department_id == dept.id,
    GraduationRule.year <= 113
).all()

count = 0
for rule in rules:
    rule.holistic_core_credits = 8
    count += 1

session.commit()
print(f"✅ Successfully updated {count} records. Holistic core credits for IM set to 8 for year <= 113.")
