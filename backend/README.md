# 岩壁計算機 (SA-HAHAHA) - 後端系統

這是一個為輔仁大學學生設計的「畢業學分審查」後端系統。它能自動從輔大 SIS 系統與選課清單系統雙管齊下爬取資料，並進行精確的學分分類與畢業條件審查。

## 🚀 快速開始

### 1. 安裝環境
本專案使用 `uv` 作為套件管理工具。請確保已安裝 `uv`，並安裝所有依賴（包含 `beautifulsoup4`, `lxml` 等網頁解析套件）。
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

1.  **Crawler (雙系統爬蟲層)**: 
    - **SIS 歷年成績**: 使用 `requests` 登入取得 JWT Token，呼叫內部 JSON API 獲取歷年成績。
    - **ESTU 當期選課**: 模擬登入 ASP.NET 選課清單系統，使用 `beautifulsoup4` 解析 HTML 表格，取得「修課中」的精確官方分類與標記。
2.  **Auditor (審查層)**: 
    - **狀態追蹤**: 支援及格 (`passed`)、不及格 (`failed`) 與修課中 (`enrolled`) 三種狀態判定。
    - **精確分類**: 結合雙系統資料，精準辨識必/選修、全人教育、通識領域（含次領域如 `PT歷史與文化`）與 `(EMI)` 課程。
    - **畢業檢查**: 提供動態擋修預警（會將正在修習的先修課程納入考量）、四大領域總學分計算。
3.  **API 層**: 使用 `FastAPI` 提供 RESTful 介面給前端呼叫。

## 📊 API 端點

### `POST /api/sync-grades`
同步學生歷年成績與當期選課資料。

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
    "course_records": [
      {
        "semester": "114-2",
        "course_name": "系統分析與設計",
        "credits": 3,
        "score": "",
        "category": "必修",
        "audit_category": "必修",
        "status": "enrolled"
      }
    ],
    "credit_summary": {
      "total_earned": 60,
      "details": {
        "required_courses": { "earned": 25, "target": 64 },
        "general_ed": { 
            "earned": 10, 
            "target": 12,
            "domains": {
                "人文藝術領域": { "earned": 4, "target": 4 }
            }
        }
      }
    },
    "warnings": ["📝 您正在修習『系統分析與設計』，請確保及格以免擋修『資訊系統專題一』。"]
  }
}
```

## 🛠 開發說明
- **資料模型**: 定義於 `app/schemas/credit_schema.py`。
- **爬蟲與邏輯**: 核心代碼位於 `app/services/scraper_service.py` 與 `app/services/estu_scraper.py`。
- **測試資料**: 開啟 `use_mock: true` 即可使用內建測試資料進行開發。

## 🚀 未來改進計畫 (Architecture Review)
為了讓系統更專業且具備擴充性，計畫進行以下升級：
1.  **職責分離 (AuditService)**: 將「學分審查邏輯」從爬蟲中獨立出來，方便支援多系所。
2.  **規則配置化 (JSON Rules)**: 將各系所門檻抽離成 JSON 檔案，實現「免改程式碼」即可擴充科系。
3.  **非同步請求 (httpx)**: 改用 `async/await` 架構，提升爬取與 API 效能。
4.  **快取與持久化**: 引入 SQLite/Redis 存取已同步的資料，減少重複爬取次數。
5.  **單元測試**: 加入 `pytest` 確保學分計算與預警邏輯的 100% 正確性。
