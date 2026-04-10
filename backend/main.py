from fastapi import FastAPI

app = FastAPI(
    title="岩壁計算機 API",
    root_path="/api",
)

@app.get("/health")
async def health():
    return {"status": "ok"}