# 部署指南

完整版手冊請看主目錄的 `Discord Bot 完整部署手冊.docx`，本文件為快速部署摘要。

## 前置需求

- Windows 筆電 + Docker Desktop
- 自有域名（已指向 Cloudflare）
- Discord、Cloudflare、Google 帳號

## 步驟總覽

### 1. 在筆電啟動 n8n

```powershell
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

### 2. 設定 Cloudflare Tunnel

1. https://one.dash.cloudflare.com/ → Networks → Tunnels → Create
2. 安裝 cloudflared 在筆電
3. Public Hostname：`n8n.your-domain.com` → `http://localhost:5678`

### 3. 建立 Discord Bot

1. https://discord.com/developers/applications → New Application
2. 取得 Application ID、Bot Token、Public Key
3. OAuth2 URL Generator 邀請 Bot 進你的 Server

### 4. 部署 Cloudflare Worker

1. https://dash.cloudflare.com/ → Workers & Pages → Create
2. 貼上 `cloudflare-worker/worker.js`
3. 設定環境變數：`DISCORD_PUBLIC_KEY`、`N8N_WEBHOOK_URL`
4. 把 Worker URL 填到 Discord Interactions Endpoint URL

### 5. 申請各 API Key

| 服務 | 申請網址 | 用途 |
|---|---|---|
| OpenWeatherMap | https://openweathermap.org/api | 天氣 |
| Google Cloud | https://console.cloud.google.com/ | Routes、Sheets、Gmail |
| Google AI Studio | https://aistudio.google.com/apikey | Gemini AI |

### 6. 設定 Google OAuth

1. Google Cloud Console → API 和服務 → 啟用 Gmail、Sheets、Drive API
2. OAuth 同意畫面 → 加入測試使用者（你的 Gmail）
3. 憑證 → 建立 OAuth 用戶端 ID
4. Redirect URI：`https://n8n.your-domain.com/rest/oauth2-credential/callback`
5. **發布應用程式為 In Production** 避免每 7 天重新驗證

### 7. 在 n8n 匯入 Workflow

每個 `workflows/*.json` 在 n8n 匯入：
1. New Workflow → Import from File
2. 選 JSON 檔
3. 重新選擇每個節點的 Credential

### 8. 建立 Google Sheets

建立試算表「Discord Bot DB」，包含 4 個工作表：

**記帳**
| userId | 日期 | 項目 | 金額 | 分類 |

**待辦**
| id | userId | 內容 | 狀態 | 建立時間 |

**提醒**
| userId | 時間 | 內容 | 已推播 |

**股價警報**
| userId | 代號 | 門檻 | 上次通知時間 |

### 9. 註冊 Slash Commands

執行 `Register Discord Commands` Workflow（手動觸發一次即可）。

### 10. 啟用所有 Workflow

每個 Workflow 右上角切到 Active。

### 11. 測試

在 Discord 任何頻道輸入 `/`，應該看到所有指令。試試 `/股價 2330` 看有沒有回覆。

## 常見問題

詳見 [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
