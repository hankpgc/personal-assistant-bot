# Personal Assistant Bot

> 一個基於 Discord + n8n 打造的個人化自動助理，整合 13 個 Slash Command 功能與自動推播工作流，部署在家用筆電上 24 小時運作，完全免費。
>
> A personal automation assistant built with Discord + n8n, featuring 13 Slash Commands and automated push workflows, self-hosted on a home laptop running 24/7 — completely free.

[繁體中文](#-繁體中文) · [English](#-english)

---

## 繁體中文

### 專案動機

市面上的個人助理工具（記帳 App、提醒 App、新聞 App、天氣 App）功能分散，每個都要切換介面，且大多有廣告或訂閱費。我想要一個**單一入口**就能完成所有日常查詢和記錄的工具，於是用 Discord 當前端介面、n8n 當邏輯後端，串接 13 個免費 API，做出這個個人化助理。

### Demo

![Demo](screenshots/demo.gif)

### 系統架構

```
Discord 用戶輸入 /指令
        ↓
Cloudflare Worker（驗證 Ed25519 簽名）
        ↓
Cloudflare Tunnel（公網入口 → 內網穿透）
        ↓
家用筆電 Docker 上的 n8n
        ↓
Router Workflow 分發到 13 個功能
        ↓
呼叫外部 API（Google / Yahoo / OpenWeatherMap / Gemini）
        ↓
組成 Discord Embed → 透過 Follow-up API 回覆用戶
```

### 功能列表

| 類別 | 指令 | 功能 |
|---|---|---|
| 查詢 | `/股價 [代號]` | 台股上市/上櫃 ETF/美股自動辨識 |
| 查詢 | `/天氣 [城市]` | 中英文城市對照 |
| 查詢 | `/距離 [地點]` | 計算到家的距離與時間 |
| 查詢 | `/匯率 [幣別] [金額]` | 12 種幣別 + 雙向換算 |
| 查詢 | `/新聞 [主題]` | RSS + Gemini AI 摘要 |
| 記帳 | `/記帳 [項目] [金額] [分類]` | 寫入 Google Sheets |
| 記帳 | `/支出 [範圍]` | 本日/本月/本年統計 |
| 待辦 | `/待辦新增` `/待辦列表` `/待辦完成` | 含 Barcode 顯示版本 |
| 提醒 | `/提醒 [時間] [內容]` | 到時自動推播 |
| 信件 | `/信件摘要` | 抓取未讀 Gmail |
| 信件 | `/寄信` | 透過 Gmail API 寄出 |

另外有兩個自動推播工作流：

- **Reminder Checker**：每5分鐘檢查到期提醒
- **Stock Notifier**：股價波動自動推播到 Discord

### 技術選型決策

| 決策 | 為什麼 |
|---|---|
| Discord 取代 LINE | LINE 主動推播每月只有 200 則免費，Discord 完全無上限 |
| n8n 取代純程式碼 | 視覺化流程便於迭代，Code 節點仍可寫 JS 處理複雜邏輯 |
| 自架 n8n 取代 n8n.cloud | 雲端版有 execution 次數限制，每分鐘輪詢的提醒功能會超量 |
| Cloudflare Tunnel 取代 ngrok / Port Forwarding | 免費、自帶 HTTPS、不開任何路由器 Port |
| Cloudflare Worker 處理 Discord 簽名驗證 | n8n.cloud 環境限制套件，無法做 Ed25519 驗證 |

### 技術挑戰

#### 1. Discord Ed25519 簽名驗證

Discord 強制 Interactions Endpoint 必須驗證 Ed25519 簽名，但 n8n.cloud 限制了 `tweetnacl` 等加密套件，原生 Code 節點也存取不到 `crypto.subtle`。

**解法**：在 Cloudflare Worker 處理驗證，再轉發到 n8n。Worker 邊緣節點原生支援 Web Crypto API 的 Ed25519。

#### 2. 時區處理 Bug

提醒功能輸入 `12:45`，預期是今天的 12:45，但因為 `new Date().setHours()` 內部用 UTC 計算，造成 8 小時偏移誤判。

**解法**：改用「分鐘總數」比較當前台北時間和目標時間，跳過 Date 物件的 UTC 換算。

#### 3. n8n Cloud 執行次數爆量

提醒功能需要每分鐘檢查一次過期提醒，Reminder Checker 一個月就消耗 43,200 次執行，遠超 Starter 方案的 2,500 次。

**解法**：自架 n8n（Docker on Windows），透過 Cloudflare Tunnel 對外，執行次數無限。

### 部署方式

完整部署手冊請看 [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)。

簡略步驟：

1. 申請 Cloudflare、Discord、Google Cloud 帳號
2. 在筆電用 Docker 跑 n8n
3. 設定 Cloudflare Tunnel 將公網 URL 指向 n8n
4. 部署 Cloudflare Worker 處理 Discord 簽名驗證
5. 在 n8n 匯入 `workflows/` 中的 JSON
6. 設定各種 Credential（Google OAuth、API Keys）
7. 啟用 Workflow

### Repo 結構

```
.
├── README.md
├── LICENSE
├── workflows/                    # n8n Workflow 匯出 JSON
│   ├── 01-discord-router.json    # 主分發 Workflow
│   ├── 02-stock.json             # 股價查詢
│   ├── 03-weather.json           # 天氣查詢
│   ├── 04-distance.json          # 距離查詢
│   ├── 05-exchange-rate.json     # 匯率查詢
│   ├── 06-news.json              # 新聞摘要
│   ├── 07-accounting.json        # 記帳 + 支出
│   ├── 08-todo.json              # 待辦事項
│   ├── 09-reminder.json          # 提醒設定
│   ├── 10-gmail.json             # 信件摘要 + 寄信
│   ├── 11-reminder-checker.json  # 提醒檢查器
│   └── 12-stock-notifier.json    # 股價波動通知
│
├── cloudflare-worker/
│   └── worker.js                 # Discord 簽名驗證
│
├── docs/
│   ├── ARCHITECTURE.md           # 系統架構
│   ├── DEPLOYMENT.md             # 完整部署手冊
│   ├── API_REFERENCE.md          # 各 API 整理
│   └── TROUBLESHOOTING.md        # 故障排除
│
└── screenshots/                  # Discord 互動截圖
```

### 學到什麼

- **OAuth 2.0 完整流程**：從 Google Cloud Console 申請憑證到 n8n 整合
- **Webhook 安全機制**：Ed25519 簽名驗證、Token 驗證
- **時區處理陷阱**：UTC vs 本地時區的常見 bug
- **Docker 部署運維**：自動重啟、Volume 持久化、容器更新
- **Cloudflare 邊緣運算**：Worker 環境限制與 Web Crypto API
- **API 整合最佳實踐**：fallback 設計、rate limit、錯誤處理

---

## English

### Motivation

Personal productivity tools (expense trackers, reminder apps, news readers, weather apps) are fragmented — each one requires switching between interfaces, and most include ads or subscription fees. I wanted a **single entry point** for all daily queries and records, so I built this assistant using Discord as the frontend and n8n as the logic backend, integrated with 13 free APIs.

### Architecture

```
Discord User Input
        ↓
Cloudflare Worker (Ed25519 signature verification)
        ↓
Cloudflare Tunnel (public URL → home network)
        ↓
n8n on home laptop (Docker)
        ↓
Router Workflow → 13 feature workflows
        ↓
External APIs (Google / Yahoo / OpenWeatherMap / Gemini)
        ↓
Discord Embed → reply via Follow-up API
```

### Features

13 Slash Commands across 5 categories:

- **Query**: stocks, weather, distance, exchange rate, news (with AI summary)
- **Accounting**: record expenses, view stats by day/month/year
- **Todo**: add/list/complete (with optional Barcode display)
- **Reminders**: schedule with auto push notification
- **Gmail**: summarize unread emails, send emails

Plus 2 automated push workflows: reminder checker (every minute) and Gmail notifier.

### Technical Decisions

| Decision | Reason |
|---|---|
| Discord over LINE | LINE limits push to 200/month free; Discord is unlimited |
| n8n over custom code | Visual workflow + Code nodes for complex logic |
| Self-hosted over n8n.cloud | Cloud plan has execution limits unsuitable for per-minute polling |
| Cloudflare Tunnel | Free, HTTPS built-in, no router port forwarding |
| Cloudflare Worker for Ed25519 | n8n.cloud's sandbox can't run crypto packages |

### Technical Challenges

1. **Ed25519 signature verification**: Discord Interactions Endpoint requires Ed25519 verification, but n8n.cloud restricts crypto packages. Solved by offloading verification to a Cloudflare Worker.

2. **Timezone bug**: `new Date().setHours()` uses UTC internally, causing 8-hour offset on Taiwan time. Fixed by comparing total minutes directly.

3. **Execution quota**: Per-minute reminder checks would consume 43,200 executions/month, far exceeding cloud plan limits. Solved by self-hosting n8n.

### Repo Structure

See above (中文部分) for full directory tree.

### What I Learned

- OAuth 2.0 end-to-end flow
- Webhook security mechanisms
- Timezone pitfalls in JavaScript
- Docker deployment ops
- Cloudflare edge computing
- API integration best practices

---

## License

MIT — see [LICENSE](LICENSE)

## Author

KUEICHI · 2026
