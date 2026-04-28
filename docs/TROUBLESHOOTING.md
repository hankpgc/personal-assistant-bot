# 故障排除

## n8n 無法存取

### 症狀：https://n8n.your-domain.com 顯示 502 Bad Gateway

可能原因：
- n8n 容器沒運行
- n8n 容器啟動失敗

排查：
```powershell
docker ps                    # 看有沒有 n8n
docker ps -a                 # 看停止的容器
docker logs n8n --tail 50    # 看錯誤訊息
docker restart n8n           # 重啟
```

### 症狀：DNS_PROBE_FINISHED_NXDOMAIN

DNS 還沒生效或本機快取問題。

```powershell
nslookup n8n.your-domain.com 1.1.1.1
ipconfig /flushdns
```

### 症狀：Cloudflare Tunnel 沒連線

```powershell
Get-Service cloudflared
Restart-Service cloudflared
```

## Discord 互動沒反應

### 症狀：Slash Command 顯示「應用程式沒有回應」

可能原因：n8n Workflow 沒有 Active。

解法：到 n8n 把 Discord Router Workflow 切到 Active。

### 症狀：Bot 顯示「正在思考...」之後消失

n8n Workflow 執行失敗。

排查：
1. n8n 左側選單 → Executions
2. 找失敗的那筆
3. 點進去看哪個節點紅色
4. 看 Error 訊息和 Input/Output

## OAuth 認證失敗

### 症狀：redirect_uri_mismatch

n8n 給的 Redirect URI 和 Google Cloud Console 設定的不一致。

解法：
1. 進 n8n Credential 看實際的 Redirect URL
2. 完整貼到 Google Cloud Console「已授權的重新導向 URI」
3. 等 5 分鐘讓 Google 設定生效

### 症狀：應用程式未通過 Google 驗證

正常現象，自架 Bot 不需要送審。

解法：點「進階」→「前往（不安全）」即可。

### 症狀：每 7 天 OAuth 就失效

OAuth 應用還在「測試」狀態，Refresh Token 只有 7 天有效。

解法：
1. Google Cloud Console → OAuth 同意畫面
2. 找到「發布狀態」→ 點「發布應用程式」
3. 確認改成「In Production」

雖然會跳警告說需要驗證，但個人自用不需要送審。

## Discord 簽名驗證失敗

### 症狀：Discord Developer Portal 存 Interactions Endpoint URL 失敗

排查順序：
1. 確認 Cloudflare Worker 已部署
2. 確認環境變數 `DISCORD_PUBLIC_KEY` 是 Discord Public Key 不是 Bot Token
3. 確認 `N8N_WEBHOOK_URL` 是正確的 Webhook URL
4. 檢查 n8n Webhook Workflow 是 Active

## 時區問題

### 症狀：提醒功能輸入 12:45，顯示變成 20:45

`new Date().setHours()` 內部用 UTC 計算造成偏移。

解法：用「分鐘總數」直接比較，不經過 Date 物件的 UTC 換算。詳見 `workflows/09-reminder.json` 的 Code 節點。

### 症狀：Sheets 存的時間和 Discord 顯示不一致

Sheets 存 ISO 格式（UTC），Discord 顯示時用 `toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })` 轉成台北時間。這是設計上的選擇，UTC 比對更準確。

## Google Sheets 失效

### 症狀：The provided authorization grant is invalid

Refresh Token 過期，常見於：
- OAuth 應用還在測試狀態（7 天失效）
- 改了 n8n Base URL（身分變更）
- 90 天沒用過該 Credential

解法：到 Credential 重新點「Sign in with Google」授權。

## n8n 環境變數錯誤

### 症狀：n8n 啟動後一直 crash

最常見：`N8N_PORT="443"` 設錯。

`N8N_PORT` 是告訴 n8n 對外 Port，但不能用來改容器內部監聽 Port。內部還是 5678。

解法：移除 `N8N_PORT` 環境變數，重新啟動。

```powershell
docker stop n8n
docker rm n8n

docker run -d --restart always --name n8n -p 5678:5678 `
  -e GENERIC_TIMEZONE="Asia/Taipei" `
  -e TZ="Asia/Taipei" `
  -e N8N_SECURE_COOKIE=false `
  -e N8N_HOST="n8n.your-domain.com" `
  -e N8N_PROTOCOL="https" `
  -e WEBHOOK_URL="https://n8n.your-domain.com/" `
  -e N8N_EDITOR_BASE_URL="https://n8n.your-domain.com" `
  -v n8n_data:/home/node/.n8n `
  docker.n8n.io/n8nio/n8n
```

## Workflow 執行紀錄為空

Workflow 沒執行成功時可能根本沒進到節點層級的紀錄。

排查：
1. 確認 Workflow 是 Active
2. 確認 Webhook URL 是 Production URL（路徑 `/webhook/` 不是 `/webhook-test/`）
3. 看 Cloudflare Worker 的 Logs 確認請求有送到 n8n
