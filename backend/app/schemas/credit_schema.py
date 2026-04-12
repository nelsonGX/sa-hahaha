from pydantic import BaseModel
from typing import List

# 單筆修課紀錄格式
class CourseRecord(BaseModel):
    semester: str
    course_name: str
    credits: int
    score: str
    category: str

# 爬蟲回傳的整體學生資料
class StudentData(BaseModel):
    student_id: str
    department_name: str
    enrollment_year: int
    course_records: List[CourseRecord]
