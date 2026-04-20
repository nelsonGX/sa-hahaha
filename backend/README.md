# 岩壁計算機 (SA-HAHAHA) - 後端系統

這是一個為輔仁大學學生設計的「畢業學分審查」後端系統。它能自動從輔大 SIS 系統爬取歷年成績，並進行精確的學分分類與畢業條件審查。

## 🚀 快速開始

### 1. 安裝環境
本專案使用 `uv` 作為套件管理工具。請確保已安裝 `uv`。
```bash
cd backend
uv sync
```

### 2. 啟動伺服器
```bash
uv run fastapi dev
```
啟動後，您可以存取：
- **測試儀表板**: [http://localhost:8000/](http://localhost:8000/) (內建簡易測試介面)
- **API 文件 (Swagger)**: [http://localhost:8000/docs](http://localhost:8000/docs)

## 🏗 系統架構

1.  **Crawler (爬蟲層)**: 使用 `requests` 模擬瀏覽器登入輔大 SIS 系統，並取得 JWT Token。
2.  **Parser (解析層)**: 直接呼叫輔大內部 JSON API 取得原始成績資料，具備高穩定性。
3.  **Auditor (審查層)**: 
    - **系所識別**: 根據學號自動判斷系所名稱。
    - **課程分類**: 自動辨識必修、選修、全人教育（核心課程、基本能力）、通識課程。
    - **畢業檢查**: 提供擋修預警、總學分計算（全人教育、必修、選修、通識四大進度）。
4.  **API 層**: 使用 `FastAPI` 提供 RESTful 介面給前端呼叫。

## 📊 API 端點

### `POST /api/sync-grades`
同步學生成績資料。

**Request Body:**
```json
{
  "student_id": "413401223",
  "password": "your_password",
  "use_mock": false
}
```

**Response Sample:**
```json
{
  "status": "success",
  "data": {
    "student_id": "413401223",
    "department_name": "資訊管理學系",
    "enrollment_year": 113,
    "credit_summary": {
      "total_earned": 60,
      "details": {
        "required_courses": { "earned": 25, "target": 64 },
        "elective_courses": { "earned": 10, "target": 32 },
        "holistic_education": { "earned": 15, "target": 32 },
        "general_ed": { "earned": 10, "target": 12 }
      }
    },
    "warnings": ["⚠️ 您尚未通過『系統分析與設計』，這將擋修『資訊系統專題一』。"]
  }
}
```

## 🛠 開發說明
- **資料模型**: 定義於 `app/schemas/credit_schema.py`。
- **爬蟲與邏輯**: 核心代碼位於 `app/services/scraper_service.py`。
- **測試資料**: 開啟 `use_mock: true` 即可使用內建測試資料進行開發。

## 🚀 未來改進計畫 (Architecture Review)
為了讓系統更專業且具備擴充性，計畫進行以下升級：
1.  **職責分離 (AuditService)**: 將「學分審查邏輯」從爬蟲中獨立出來，方便支援多系所。
2.  **規則配置化 (JSON Rules)**: 將各系所門檻抽離成 JSON 檔案，實現「免改程式碼」即可擴充科系。
3.  **非同步請求 (httpx)**: 改用 `async/await` 架構，提升 API 效能與併發處理能力。
4.  **快取與持久化**: 引入 SQLite/Redis 存取已同步的資料，減少重複爬取次數。
5.  **單元測試**: 加入 `pytest` 確保學分計算與預警邏輯的 100% 正確性。