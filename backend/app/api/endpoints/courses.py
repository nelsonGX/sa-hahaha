from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
from app.services.course_catalog_service import get_recommendations

router = APIRouter()

class EnrolledCourse(BaseModel):
    name: str
    offering_dept: str = ""

class RecommendationRequest(BaseModel):
    category: str
    needed_credits: float = 2.0
    department: str = ""
    passed_courses: List[str] = []
    enrolled_courses: List[EnrolledCourse] = []

@router.post("/recommend-courses")
async def recommend_courses(req: RecommendationRequest):
    results = get_recommendations(
        category=req.category, 
        needed_credits=req.needed_credits, 
        department=req.department,
        passed_courses=req.passed_courses,
        enrolled_courses=req.enrolled_courses
    )
    return {"courses": results}
