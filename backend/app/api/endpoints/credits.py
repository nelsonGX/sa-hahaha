from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.scraper_service import FjuScraperService
from app.utils.exceptions import FjuAppError
from datetime import datetime
import traceback

router = APIRouter()
scraper_service = FjuScraperService()

class LoginRequest(BaseModel):
    student_id: str
    password: str
    use_mock: bool = True

@router.post("/sync-grades")
async def sync_grades(request: LoginRequest):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    try:
        # 現在是 async 了，需要 await
        student_data = await scraper_service.scrape_student_data(
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
    except FjuAppError as fe:
        # 捕捉結構化異常
        print(f"[{timestamp}] ⚠️ 業務異常 ({fe.code}): {fe.message}")
        status_code = 401 if fe.code == "AUTH_FAILED" else 500
        raise HTTPException(
            status_code=status_code, 
            detail={"message": fe.message, "timestamp": timestamp, "code": fe.code}
        )
    except Exception as e:
        # 非預期系統錯誤
        error_msg = str(e)
        print(f"[{timestamp}] 🔥 系統崩潰: {error_msg}")
        print(traceback.format_exc())
        
        raise HTTPException(
            status_code=500, 
            detail={"message": "系統忙碌中，請稍後再試", "timestamp": timestamp, "code": "SYSTEM_ERROR"}
        )
