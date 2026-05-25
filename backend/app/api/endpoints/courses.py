from fastapi import APIRouter
from app.services.course_catalog_service import get_recommendations

router = APIRouter()

@router.get("/recommend-courses")
async def recommend_courses(category: str, needed_credits: float = 2.0, department: str = ""):
    results = get_recommendations(category, needed_credits, department)
    return {"courses": results}
