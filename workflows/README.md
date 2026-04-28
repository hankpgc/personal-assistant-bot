# n8n Workflows

這個目錄包含所有 n8n 工作流的匯出 JSON。

## 如何匯出（從你自己的 n8n）

1. 打開 n8n
2. 進入要匯出的 Workflow
3. 右上角選單 → Download
4. 把 JSON 檔放到這個目錄

## Workflow 清單

| 檔案 | 用途 | 觸發方式 |
|---|---|---|
| `01-discord-router.json` | 主分發 Workflow | Discord Webhook |
| `02-stock.json` | 股價查詢 | Slash Command |
| `03-weather.json` | 天氣查詢 | Slash Command |
| `04-distance.json` | 距離查詢 | Slash Command |
| `05-exchange-rate.json` | 匯率查詢 | Slash Command |
| `06-news.json` | 新聞摘要 | Slash Command |
| `07-accounting.json` | 記帳 + 支出統計 | Slash Command |
| `08-todo.json` | 待辦事項 | Slash Command |
| `09-reminder.json` | 設定提醒 | Slash Command |
| `10-gmail.json` | 信件摘要 + 寄信 | Slash Command |
| `11-reminder-checker.json` | 提醒到期檢查 | Schedule（每分鐘） |
| `12-gmail-notifier.json` | 新信通知 | Gmail Trigger |
| `13-register-commands.json` | 註冊 Slash Commands | Manual |

## 如何匯入

1. 在 n8n 點 New Workflow
2. 右上角選單 → Import from File
3. 選擇對應的 JSON
4. 重新設定每個節點的 Credential

## 注意事項

匯出的 JSON **不包含 Credential**，需要在新環境重新建立並選擇。

涉及的 Credential 類型：
- Google Sheets OAuth2 API
- Gmail OAuth2 API
- Header Auth（Discord Bot Token）

## 更新指引

當你改了 Workflow 想更新到 repo：
1. 重新從 n8n 匯出 JSON
2. 覆蓋對應的檔案
3. git commit + push
