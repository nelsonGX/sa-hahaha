# 岩壁計算機 (SA-HAHAHA)

這是一個專為輔仁大學學生打造的「畢業學分審查大腦與視覺化介面」。
透過學生的帳號密碼，系統能自動登入學校的 SIS 歷年成績系統與 ESTU 選課清單系統，自動抓取成績、進行精確的學分分類、計算畢業進度，並提供擋修預警。

## 系統架構

專案採用前後端分離架構：

- **Backend (後端)**: Python + FastAPI
  - 負責模擬登入雙系統 (SIS 取得歷史成績, ESTU 取得當期選課)。
  - 擁有強大的審查邏輯，自動判定必選修、全人教育、通識次領域與 EMI 課程。
  - 提供修課中 (`enrolled`) 狀態追蹤與動態擋修預警。
- **Frontend (前端)**: Next.js (React 19) + Tailwind CSS v4
  - 現代化且美觀的使用者介面。
  - 視覺化顯示四大領域（必修、選修、全人、通識）的學分進度條。

## 如何執行 (How to run)

### Frontend (前端)
```bash
cd frontend
npm install
npm run dev
```
前端伺服器將啟動於 [http://localhost:3000](http://localhost:3000)

### Backend (後端)
請確保已安裝 `uv` 套件管理器。
```bash
cd backend
uv sync
uv run fastapi dev
```
後端 API 伺服器與測試儀表板將啟動於 [http://localhost:8000](http://localhost:8000)

---

> 更多詳細的後端開發與架構說明，請參考 `backend/README.md` 與 `backend/gemini.md`。
