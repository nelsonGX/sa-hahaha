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
    status: str = "passed"          # 狀態: passed (通過), failed (不及格/停修), enrolled (正在修課)
    offering_dept: str = ""         # 開課單位 (主要由 ESTU 選課系統提供)
    is_distance_learning: bool = False # 是否為遠距教學 (-網)
    term_type: str = ""             # 學期課/學年課標記 (e.g., "1(學年)")

# 學分進度分類
class CreditCategory(BaseModel):
    earned: int
    target: int

# 通識學分進度
class GeneralEducationCredit(BaseModel):
    earned: int
    target: int
    domains: Dict[str, CreditCategory]

# 英文檢定狀態
class EnglishProficiency(BaseModel):
    status: str = "未通過"      # 未通過, 已通過 (B2), 自學方案中, 自學方案完成
    method: str = ""           # 檢定名稱 (TOEIC, TOEFL等) 或 "自學方案"
    test_score: Optional[str] = None
    self_study_count: int = 0  # 已參加自學測驗次數 (目標 8)

# 機測題目狀態
class ComputerProficiency(BaseModel):
    passed_count: int = 0      # 已通過題數
    target_count: int = 5      # 目標題數
    has_programming_elective: bool = False # 是否修畢一門程式設計相關選修 (用於3題門檻)

# EMI 課程狀態
class EMIProficiency(BaseModel):
    earned_credits: int = 0    # 已取得 EMI 學分 (目標 15)
    course_count: int = 0      # 已修畢 EMI 門數 (目標 5)
    target_credits: int = 15
    target_courses: int = 5

# 簡化後的畢業門檻結構 (v2)
class DetailedRequirements(BaseModel):
    required_courses: CreditCategory      # 必修 (64)
    elective_courses: CreditCategory      # 選修 (32)
    holistic_education: CreditCategory    # 全人教育總計 (32)
    holistic_core: CreditCategory         # 1. 核心課程 (8學分，含大學入門/人哲/專倫)
    basic_skills: CreditCategory          # 2. 基本能力課程 (12學分，含國文/外語)
    general_ed: GeneralEducationCredit    # 3. 通識 (12學分，含人文/自然/社會)
    pe_semesters: CreditCategory          # 體育及格學期數 (4學期)
    english_proficiency: Optional[EnglishProficiency] = None  # 英文畢業門檻
    computer_proficiency: Optional[ComputerProficiency] = None # 機測門檻
    emi_proficiency: Optional[EMIProficiency] = None           # EMI 門檻
    emi_courses: Optional[CreditCategory] = None # 保留相容性
    distance_learning_credits: int = 0    # 遠距教學學分總數 (不得超過畢業總學分 1/2)

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
    is_first_time: bool = True  # 是否為第一次使用/需要引導
