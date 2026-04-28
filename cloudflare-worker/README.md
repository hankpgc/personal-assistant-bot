# Cloudflare Worker 部署說明

## 用途

這個 Worker 負責驗證 Discord Interactions Endpoint 送來的 Ed25519 簽名，通過後轉發到 n8n Webhook。

## 為什麼需要

Discord 強制要求 Interactions Endpoint 必須驗證 Ed25519 簽名。n8n.cloud 環境限制了 `tweetnacl` 等加密套件，自架 n8n 也需要額外設定。Cloudflare Worker 邊緣節點原生支援 Web Crypto API 的 Ed25519，是最簡單的解法。

## 部署步驟

### 1. 建立 Worker

前往 https://dash.cloudflare.com/ → Workers & Pages → Create Worker

### 2. 貼入程式碼

複製 `worker.js` 的內容到 Worker 編輯器，點 Save and Deploy。

### 3. 設定環境變數

Settings → Variables and Secrets，新增：

| 變數名稱 | 類型 | 值 |
|---|---|---|
| `DISCORD_PUBLIC_KEY` | Secret | Discord Application 的 Public Key |
| `N8N_WEBHOOK_URL` | Text | 你的 n8n Webhook URL |

### 4. 取得 Worker URL

部署後會有預設 URL：
```
https://discord-bot-verify.<你的帳號>.workers.dev
```

### 5. 設定到 Discord

Discord Developer Portal → 你的 Application → General Information → Interactions Endpoint URL，填入 Worker URL。

存檔時 Discord 會發送驗證 Ping，成功會顯示 "Successfully saved"。

## 流量與費用

- 免費版每天 100,000 次請求
- 個人 Bot 用量遠低於額度
- 完全免費

## 故障排除

| 錯誤 | 原因 | 解法 |
|---|---|---|
| Discord 驗證失敗 | Public Key 設定錯誤 | 重新檢查環境變數 |
| 401 Invalid signature | 簽名驗證失敗 | 確認 Public Key 正確 |
| 502 Bad Gateway | n8n 沒運行 | 檢查家裡 n8n 狀態 |
