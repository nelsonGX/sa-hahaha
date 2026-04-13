from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from app.api.endpoints import credits
import os

app = FastAPI(
    title="岩壁計算機 API",
    version="1.0.0"
)

# 設定 CORS 允許前端 (localhost:3000) 存取 API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # 測試階段允許所有來源
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 註冊 API 路由
app.include_router(credits.router, prefix="/api", tags=["學分系統"])

# 健康檢查路由
@app.get("/health")
async def health():
    return {"status": "ok!"}

# 提供靜態首頁 (測試用儀表板)
@app.get("/")
async def index():
    return FileResponse("index.html")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

