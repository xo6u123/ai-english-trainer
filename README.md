# AI English Trainer

一套全端 AI 英語學習應用程式。使用者依主題與課程選擇單字，系統透過大型語言模型即時生成單字表、測驗題、聽力練習與例句翻譯，並以遊戲化機制（經驗值、等級、連續天數、成就徽章）維持學習動機。後端對 AI 生成內容進行資料庫快取，以降低回應延遲與 API 成本。

## 功能特色

- **單字學習**：依主題與課程難度生成 8 個單字，附詞性、中文定義與例句；自動排除前面課程已學過的單字，形成漸進式難度。
- **單字測驗**：針對該課單字生成選擇題，答錯時由 AI 提供中文解析。
- **聽力練習**：以瀏覽器語音合成（Web Speech API）朗讀例句，使用者依聽到的內容作答。
- **例句翻譯**：批次將英文例句翻譯為自然的繁體中文。
- **故事生成**：以當課單字串成短篇故事並附中文翻譯，強化記憶。
- **遊戲化系統**：經驗值與等級、每日連續學習天數、成就徽章；學習與錯題紀錄保存於瀏覽器端。
- **主題涵蓋**：日常生活、旅遊、商務、飲食、購物、科技。

## 系統架構

```
React SPA (Vite + Tailwind)
        │  REST / JSON
        ▼
Flask API
        ├─ Gemini 2.5 Flash  （生成單字、測驗、翻譯、故事、解析）
        └─ SQLAlchemy        （快取生成內容：SQLite / PostgreSQL）
```

開發階段前後端分離（Vite 開發伺服器以 proxy 轉發 API）；生產階段由 Flask 直接提供建置後的前端靜態檔，整個應用以單一程序運行。

## 設計重點

- **生成內容快取**：單字表與測驗題以「主題＋課程」為鍵存入資料庫，重複存取時直接回傳，避免重複呼叫 LLM，明顯降低延遲與費用。
- **低延遲生成設定**：將 Gemini 的 thinking budget 設為 0，於生成式任務中換取更快的回應速度。
- **漸進式難度**：生成新課單字時帶入先前課程已出現的單字作為排除清單，確保內容不重複且難度遞增。
- **單一程序部署**：Flask 同時擔任 API 服務與前端靜態檔伺服器，簡化部署流程。
- **資料庫可切換**：本機預設使用 SQLite，部署時透過 `DATABASE_URL` 環境變數切換為 PostgreSQL（並自動修正 `postgres://` 前綴）。

## 技術棧

| 類別 | 技術 |
|------|------|
| 前端 | React 19、Vite、Tailwind CSS、Framer Motion、axios |
| 後端 | Flask、Flask-CORS、Flask-SQLAlchemy、Gunicorn |
| AI | Google Gemini 2.5 Flash（google-genai SDK） |
| 資料庫 | SQLite（開發）／PostgreSQL（部署） |
| 語音 | Web Speech API（瀏覽器端語音合成） |

## 環境需求

- Python 3.x 與 Node.js
- Google Gemini API Key

於專案根目錄建立 `.env`，並設定下列變數：

| 變數 | 必填 | 說明 |
|------|------|------|
| `GEMINI_API_KEY` | 是 | Google Gemini API Key |
| `DATABASE_URL` | 否 | PostgreSQL 連線字串；未設定時使用本機 SQLite |
| `PORT` | 否 | 服務埠號，預設 8080 |

## 本機開發

開發模式採前後端分離、支援熱重載，需開兩個終端機。

後端：

```
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```

前端：

```
cd frontend
npm install
npm run dev
```

開發伺服器位於 http://localhost:5173，API 請求由 Vite proxy 自動轉發至後端的 8080 埠。

## 建置與部署

建置前端後，由 Flask 以單一程序同時提供 API 與前端頁面：

```
cd frontend
npm run build      # 產生 ../dist/
cd ..
python app.py      # 開啟 http://localhost:8080 即為完整應用
```

部署時可使用 Gunicorn 啟動，並設定 `GEMINI_API_KEY` 與 `DATABASE_URL` 等環境變數。

## 專案結構

| 路徑 | 說明 |
|------|------|
| `app.py` | Flask 後端：API 路由、資料模型、AI 呼叫與前端靜態檔服務 |
| `frontend/` | React 前端原始碼（Vite 專案） |
| `dist/` | 前端建置輸出（由 Flask 提供） |
| `requirements.txt` | 後端相依套件 |
| `.env.example` | 環境變數範本 |

## 備註

- 遊戲化進度與錯題紀錄保存於瀏覽器 localStorage，清除瀏覽器資料後將重置。
- 聽力功能依賴瀏覽器的語音合成支援，不同瀏覽器的語音品質可能有所差異。
