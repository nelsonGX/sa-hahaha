from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.scraper_service import FjuScraperService

router = APIRouter()
scraper_service = FjuScraperService()

class LoginRequest(BaseModel):
    student_id: str
    password: str
    use_mock: bool = True

from datetime import datetime

@router.post("/sync-grades")
async def sync_grades(request: LoginRequest):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    try:
        student_data = scraper_service.scrape_student_data(
            student_id=request.student_id, 
            password=request.password, 
            use_mock=request.use_mock
        )
        return {
            "status": "success",
            "message": "成績同步成功",
            "timestamp": timestamp,
            "data": student_data.model_dump()
        }
    except ValueError as ve:
        # 帳號密碼錯誤或系統鎖定等預期內的錯誤
        print(f"[{timestamp}] ⚠️ 登入失敗: {str(ve)}")
        raise HTTPException(
            status_code=401, 
            detail={"message": str(ve), "timestamp": timestamp, "code": "AUTH_FAILED"}
        )
    except Exception as e:
        # 網路連線或程式邏輯等非預期錯誤
        error_msg = str(e)
        print(f"[{timestamp}] 🔥 系統錯誤: {error_msg}") 
        raise HTTPException(
            status_code=500, 
            detail={"message": f"系統爬取失敗: {error_msg}", "timestamp": timestamp, "code": "SYSTEM_ERROR"}
        )
