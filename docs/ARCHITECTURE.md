# 系統架構

## 整體架構圖

```
┌──────────────────┐
│   Discord User   │
│  (Slash Command) │
└────────┬─────────┘
         │
         │ HTTPS POST (含 Ed25519 簽名)
         ↓
┌────────────────────────────────────┐
│  Cloudflare Worker                 │
│  ─ 驗證 Ed25519 簽名               │
│  ─ 處理 Discord Ping (type:1)      │
│  ─ 轉發其他請求到 n8n              │
└────────┬───────────────────────────┘
         │
         │ HTTPS
         ↓
┌────────────────────────────────────┐
│  Cloudflare Tunnel                 │
│  n8n.kueichi.dev                   │
│  ─ 內網穿透                         │
│  ─ 自動 HTTPS                      │
└────────┬───────────────────────────┘
         │
         │ Tunnel 反向連線
         ↓
┌────────────────────────────────────┐
│  Home Laptop (Windows)             │
│  ┌────────────────────────────┐    │
│  │  Docker Desktop            │    │
│  │  ┌──────────────────────┐  │    │
│  │  │  n8n Container       │  │    │
│  │  │  - Router Workflow   │  │    │
│  │  │  - 13 Feature WFs    │  │    │
│  │  │  - Auto Push WFs     │  │    │
│  │  └──────────────────────┘  │    │
│  └────────────────────────────┘    │
└────────┬───────────────────────────┘
         │
         │ HTTPS
         ↓
┌────────────────────────────────────┐
│  External APIs                     │
│  ─ Yahoo Finance (股價)             │
│  ─ OpenWeatherMap (天氣)            │
│  ─ Google Routes API (距離)         │
│  ─ ExchangeRate API (匯率)          │
│  ─ Google News RSS (新聞)           │
│  ─ Google Gemini (AI 摘要)          │
│  ─ Google Sheets (記帳/待辦/提醒)   │
│  ─ Gmail API (信件)                 │
│  ─ Discord Follow-up API (回覆)     │
└────────────────────────────────────┘
```

## 為什麼需要四層架構

| 層級 | 元件 | 解決什麼問題 |
|---|---|---|
| 前端 | Discord Bot | 用戶介面 |
| 驗證 | Cloudflare Worker | Ed25519 簽名驗證 |
| 連線 | Cloudflare Tunnel | 內網穿透 + HTTPS |
| 邏輯 | n8n on Docker | 視覺化工作流 + 無限執行次數 |

## 資料流範例：`/股價 2330`

```
1. 用戶在 Discord 輸入「/股價 2330」
2. Discord 把指令送到 Interactions Endpoint
   → POST https://discord-bot-verify.xxx.workers.dev
   → Headers: x-signature-ed25519, x-signature-timestamp
   → Body: { type: 2, data: { name: "股價", options: [...] } }

3. Cloudflare Worker:
   - 驗證 Ed25519 簽名 ✓
   - 不是 Ping (type=2)，繼續處理
   - 轉發到 https://n8n.kueichi.dev/webhook/discord-bot

4. Cloudflare Tunnel 把請求轉到家裡筆電
   → http://localhost:5678/webhook/discord-bot

5. n8n Router Workflow:
   - Webhook 節點接收
   - IF 判斷 type=1（Ping）→ 跳過
   - Respond {type: 5}（告訴 Discord「處理中」）
   - Switch 依 commandName 分流到「股價」分支

6. 股價分支:
   - Code 節點：解析「2330」→ 加 .TW → "2330.TW"
   - HTTP Request: GET Yahoo Finance API
   - Code 節點：計算漲跌幅，組成 Discord Embed
   - HTTP Request: PATCH Discord Follow-up API
     → 把 Embed 送回 Discord，更新原本「處理中」的訊息

7. 用戶在 Discord 看到股價卡片
```

## 安全機制

### 第一層：Cloudflare Worker 簽名驗證
- Discord 每個請求都帶 Ed25519 簽名
- Worker 用 Public Key 驗證
- 簽名失敗直接 401 拒絕，不會打到 n8n

### 第二層：Cloudflare Tunnel
- 不開放任何路由器 Port
- 反向連線（家裡主動連到 Cloudflare）
- 外部看不到家裡的真實 IP

### 第三層：n8n 帳號保護
- 進 n8n 介面需要登入
- 可以加 2FA 雙重驗證
- 可以加 Cloudflare Access 多一層 Google 登入

### 第四層：API Token 隔離
- 每個 Token 只給 Workflow 用，不會直接暴露
- Cloudflare Worker 的 Secret 變數加密存儲
- n8n Credential 也加密存儲

## 為什麼不用其他方案

| 方案 | 為什麼不用 |
|---|---|
| n8n.cloud | execution 次數限制（每分鐘輪詢的提醒會超量） |
| ngrok | 免費版 URL 會變動，且有連線數限制 |
| Port Forwarding | 暴露家裡 IP，需要動態 DNS，安全風險高 |
| 自架 VPS | 月費 $5-10，個人用太貴 |
| AWS Lambda | 冷啟動延遲影響 Discord 3 秒回應限制 |
| 純程式碼開發 | 開發迭代慢，n8n 視覺化流程更方便 |

## 效能考量

- **Discord 3 秒限制**：n8n Router 收到後立即回 `type:5` Defer，後續處理透過 Follow-up API 回覆，不會超時
- **Cloudflare Worker 冷啟動**：邊緣節點，全球延遲都很低
- **n8n Webhook 響應**：本機 Docker，幾乎無延遲

## 擴展性

新增功能只需要：
1. 在 `Register Discord Commands` Workflow 加一個指令定義
2. 在 Router Workflow 的 Switch 加一個 Route
3. 設計新的 Feature Workflow（5-10 個節點）

不需要改架構、不需要重新部署 Worker。
