from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.scraper_service import FjuScraperService

router = APIRouter()
scraper_service = FjuScraperService()

class LoginRequest(BaseModel):
    student_id: str
    password: str

@router.post("/sync-grades")
async def sync_grades(request: LoginRequest):
    try:
        student_data = scraper_service.scrape_student_data(
            student_id=request.student_id, 
            password=request.password, 
            use_mock=True # 目前預設啟用 Mock 模式
        )
        return {
            "status": "success",
            "message": "成績同步成功",
            "data": student_data.model_dump()
        }
    except ValueError as ve:
        raise HTTPException(status_code=401, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail="系統爬取失敗，請聯絡管理員")
