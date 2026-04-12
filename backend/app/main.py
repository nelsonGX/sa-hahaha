from fastapi import FastAPI
from api.endpoints import credits

app = FastAPI(title="岩壁計算機 API", version="1.0.0")

app.include_router(credits.router, prefix="/api", tags=["學分系統"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
