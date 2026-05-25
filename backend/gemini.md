# Backend 開發紀錄 - 岩壁計算機 (SA-HAHAHA)

## 📌 目前進度摘要 (Latest Update)

後端「資管系畢業初審大腦」已完成核心架構實作與進階規則升級。具備極速雙系統爬取（SIS 歷年 + ESTU 當期）、智慧通識代碼判定、進階防呆機制（重複修習剔除、遠距上限、軍訓排除），並支援 NotebookLM 自動化批次生成全校系所畢業門檻規則。

---

## ✅ 已實作功能 (Implemented)

### 1. 基礎架構
- [x] **CORS 設定**: `main.py` 已加入 `CORSMiddleware`。
- [x] **Health Check**: 新增 `/health` 接口。
- [x] **Schema 擴充**: `credit_schema.py` 已準備好 `EnglishProficiency`, `ComputerProficiency`, `EMIProficiency` 結構，支援跨系所多元門檻。

### 2. 極速爬蟲服務 (`FjuScraperService`)
- [x] **SIS 資訊最大化**: 解析 `GradesInquiry/Grades` API，完整擷取 `gInfo` (包含通識代碼) 與 `couClassify` (官方課程標記如 英-專業、程)。
- [x] **ESTU 最小化抓取**: 僅模擬登入抓取「當期正在修 (enrolled)」的課程，大幅縮短登入時間至 2~3 秒，不再陷入爬取歷年的效能瓶頸。
- [x] **資料補強合併**: 將 ESTU 抓到的詳細開課單位，精準補入 SIS 歷年紀錄，提供後續審查更完整的 Metadata。

### 3. 進階審查大腦 (`Auditor Logic` - v8)
- [x] **前綴與關鍵字混合判定 (Hybrid GE Matching)**:
  - 優先識別 `PT`(人文)、`NT`(自然)、`ST`(社會)、`DT`(永續) 代碼，完美解決新舊制對照問題 (例如舊生修習永續課程時能正確歸位)。
  - 支援關鍵字強制導流（如「資訊科技」強制歸類至「自然」）。
- [x] **進階畢業防呆規則 (Advanced Rules)**:
  - **重複修習剔除**: 智慧還原課名，將 `-英`、`-網` 視為同名課程，利用 Set 機制避免重複計分。
  - **軍訓與體育選修排除**: `軍訓`、`全民國防`、`ATP3` 等選修課強制過濾，標註為「不計畢業學分」。
  - **遠距教學上限**: 自動統計 `-網` 或 `[網]` 標記之學分，若超過畢業總學分 1/2 即跳出紅色警告。
  - **學年課未完成警告**: 透過 API `termNa` 解析，若 `1(學年)` 的課沒有後續紀錄且未修課中，會給予警告提示。
- [x] **資管系專屬規則**:
  - 全人教育超修不計入總分（單領域上限與總和上限 32 學分）。
  - 自動追蹤「資訊管理」開課單位或 `40` 代碼，標註「系選修」以確認 10 學分門檻。
- [x] **官方標記識別**: 全域掃描並自動標註 `(EMI)` 與 `(程式)` 課程。

### 4. 自動化規則生成 (`auto_rules_generator.py`)
- [x] **NotebookLM 串接**: 使用 `nlm` CLI 自動搜尋輔大各系所必修科目表並萃取為標準化 JSON。
- [x] **全校批次腳本 (`generate_all_rules.py`)**: 
  - 支援跨學年度自動巡迴 (114 -> 110)。
  - 內建 Rate Limit 防封鎖機制 (每個系停 15 秒，跨學年停 30 秒)。
  - 支援參數化斷點續傳 (指定起始 Index)。

---

## 🛠️ 開發與維護操作指南

### 產生全校畢業門檻 JSON
若遇到 Google NotebookLM API 限制 (Rate Limit) 或執行中斷，請善用分批與續傳功能：

```bash
# 執行特定學年度全校系所 (預設從第 0 個開始)
python3 backend/scripts/generate_all_rules.py 114

# 斷點續傳：從第 33 個系所 (索引 32) 開始接續跑 114 學年度
python3 backend/scripts/generate_all_rules.py 114 32

# 跑多個學年度 (114 到 110，耗時較長，建議背景執行)
python3 backend/scripts/generate_all_rules.py all
```

### 開發環境啟動
```bash
cd backend
uv sync
uv run fastapi dev
```
(或直接開啟 `http://localhost:8000/` 進行前端儀表板測試)

---

## 🏗️ 後端架構檢討與未來優化 (Architecture Review)

目前的架構已經非常完整且具備高度精確性，但針對未來的大規模高併發上線，建議進行以下架構優化：

1. **非同步 I/O (Async/Await)**
   - **現狀**: 爬蟲服務使用同步的 `requests` 模組，這會在等待輔大伺服器回應時阻塞整個 FastAPI 的 Event Loop。
   - **建議**: 將 `requests` 替換為 `httpx` 或 `aiohttp`，並將 `ScraperService` 改寫為 async 方法。這樣能讓後端同時處理數百個學生的登入請求而不卡頓。

2. **快取與資料庫層 (Caching Layer)**
   - **現狀**: 每次呼叫 API 都會即時登入輔大系統爬取資料。
   - **建議**: 引入 Redis 或 SQLite。當學生第二次開啟 APP 時，若距離上次更新不到 24 小時，直接從快取回傳 `StudentData` JSON，實現「零延遲」載入，同時大幅降低對輔大伺服器的請求壓力。

3. **服務層解耦 (Service Separation)**
   - **現狀**: `FjuScraperService` 負責了爬蟲登入、資料清理、以及呼叫 `AuditService`。
   - **建議**: 建立獨立的 `DataTransformerService` 來專門處理課程名稱正規化與 `gInfo`/`couClassify` 的字串解析，讓爬蟲服務嚴格遵守單一職責原則 (Single Responsibility Principle)，只專心做 HTTP Request 與 Response 處理。
