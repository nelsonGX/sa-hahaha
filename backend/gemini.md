# Backend 開發紀錄 - 岩壁計算機 (SA-HAHAHA)

## 📌 目前進度摘要 (Latest Update)

後端「資管系畢業初審大腦」已完成核心非同步架構升級 (httpx)，並實作了進階防呆機制（重複修習剔除、遠距上限、軍訓排除）與「資管系外系選修」動態拆分顯示。
最新加入了「智慧選課推薦」系統，能透過比對全校課程 JSON，自動剔除學生已及格或衝堂的課程，並完美串接至前端 Next.js 儀表板，提供一鍵跨網域零死角的推薦體驗。

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

### 5. 智慧選課推薦 (Intelligent Course Recommendation)
- [x] **POST API 實作**: 支援接收學生已及格與修課中名單，精準過濾推薦內容。
- [x] **智慧剔除機制**: 透過課名正規化自動排除已修過（即便課名含英文）的課程。
- [x] **衝堂過濾機制**: 自動反查學生當期課表，排除與現有課表重疊時段的課程。
- [x] **推薦排序優化**: 優先顯示剩餘名額最多的課程，並過濾併班重複代碼。

### 6. 前端與進階視覺化 (Frontend & UI)
- [x] **資管系選修拆分**: 針對 IM 學生將 32 學分自動拆分為「系所選修 (10)」與「外系/自由選修 (22)」，提供雙進度條顯示。
- [x] **推薦視窗串接**: 點擊任何缺失學分格子可立即獲得推薦課程，並支援一鍵加入「選課購物車」。
- [x] **跨網域連線優化**: 修復 Next.js Proxy 設定，支援透過區網 IP (如手機) 遠端連線開發伺服器。

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

## 🏗️ 後端架構演進 (Architecture Evolution)

目前的架構已完成核心現代化：

1. **非同步 I/O (Async/Await) [DONE]**
   - **實作**: 已將 `requests` 全面替換為 `httpx`，並將所有爬蟲服務與 API 路由改寫為 `async/await`。
   - **效益**: 大幅提升併發處理能力，即使學校伺服器回應緩慢也不會阻塞事件循環。

2. **邏輯整合與工具化 (Logic Consolidation) [DONE]**
   - **實作**: 建立 `app/utils/course_utils.py` 統一管理課名正規化與成績狀態判定；`app/constants.py` 管理系所對照表。
   - **效益**: 減少重複代碼，確保審查邏輯在爬蟲端與審查端完全一致。

3. **結構化異常處理 (Structured Exceptions) [DONE]**
   - **實作**: 導入 `FjuAppError` 體系，區分驗證失敗、伺服器錯誤與資料處理錯誤。
   - **效益**: 前端可根據錯誤代碼 (AUTH_FAILED, SCHOOL_SERVER_ERROR) 提供更精確的用戶回饋。

4. **未來優化方向 (Future Roadmap)**
   - **快取層 (Caching Layer)**: 引入 Redis 或 SQLite 快取，針對短時間內重複登入的學生實現零延遲載入。
   - **服務解耦**: 進一步分離 `DataTransformerService`，讓 Scraper 只專注於原始資料抓取。

