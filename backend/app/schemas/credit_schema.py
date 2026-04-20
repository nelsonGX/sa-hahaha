from pydantic import BaseModel
from typing import List, Dict, Optional

# 單筆修課紀錄格式
class CourseRecord(BaseModel):
    semester: str
    course_name: str
    credits: int
    score: str
    category: str           # 學校原始分類
    audit_category: str = "未分類"  # 系統審查後的精確分類

# 學分進度分類
class CreditCategory(BaseModel):
    earned: int
    target: int

# 通識學分進度
class GeneralEducationCredit(BaseModel):
    earned: int
    target: int
    domains: Dict[str, CreditCategory]

# 簡化後的畢業門檻結構 (v2)
class DetailedRequirements(BaseModel):
    required_courses: CreditCategory      # 必修 (64)
    elective_courses: CreditCategory      # 選修 (32)
    holistic_education: CreditCategory    # 全人教育總計 (32)
    holistic_core: CreditCategory         # 1. 核心課程 (8學分，含大學入門/人哲/專倫)
    basic_skills: CreditCategory          # 2. 基本能力課程 (12學分，含國文/外語)
    general_ed: GeneralEducationCredit    # 3. 通識 (12學分，含人文/自然/社會)
    pe_semesters: CreditCategory          # 體育及格學期數 (4學期)

# 整體學分統計
class CreditSummary(BaseModel):
    total_earned: int
    details: Optional[DetailedRequirements] = None

# 爬蟲回傳的整體學生資料
class StudentData(BaseModel):
    student_id: str
    department_name: str
    enrollment_year: int
    course_records: List[CourseRecord]
    credit_summary: CreditSummary
    warnings: List[str] = []
