# 如何發布到 GitHub

## Step 1：在 GitHub 建立 Repo

1. 前往 https://github.com/new
2. Repository name：`personal-assistant-bot`
3. Description：`Discord Bot + n8n Personal Assistant - 13 Slash Commands, Self-hosted, Free`
4. 選 **Public**
5. **不要勾** "Add a README file"（我們已經有了）
6. **不要勾** "Add .gitignore"（我們已經有了）
7. License：可以勾 MIT 或不勾（我們已經有 LICENSE 檔）
8. 點 **Create repository**

## Step 2：在筆電 Push 上去

把這個資料夾整個複製到你筆電，然後在該目錄開 PowerShell：

```powershell
cd C:\path\to\personal-assistant-bot

# 初始化 git
git init
git add .
git commit -m "Initial commit"

# 連接到 GitHub
git branch -M main
git remote add origin https://github.com/你的GitHub帳號/personal-assistant-bot.git
git push -u origin main
```

## Step 3：補上實際內容

幾個還需要補的東西：

### 1. 從 n8n 匯出 Workflow JSON

每個 Workflow 在 n8n 右上角選單 → Download，放到 `workflows/` 對應檔名。

### 2. 截圖

按 `screenshots/README.md` 的清單拍截圖放進去。

最重要的是 `demo.gif`（一個短 GIF 展示幾個指令）。

可以用以下工具錄製：
- **Windows + G**：Xbox Game Bar 內建錄影
- **OBS Studio**：免費專業錄影
- **ScreenToGif**：免費 GIF 錄製工具
- 線上轉 GIF：https://ezgif.com/

### 3. 更新 README 的個人資訊

在 README 最下方的 Author 欄位改成你的：
```markdown
## Author

KUEICHI · GitHub: [@your-username](https://github.com/your-username)
```

### 4. 域名替換

把 README 和文件中的 `your-domain.com` 替換成 `kueichi.dev`（或保留通用名稱讓別人能複製）。

## Step 4：寫好 Repo About

GitHub Repo 頁面右側有 About 區塊，點齒輪編輯：

- **Description**：`Discord + n8n personal assistant. 13 Slash Commands, self-hosted, free.`
- **Website**：`https://kueichi.dev`（或留空）
- **Topics**：`discord-bot` `n8n` `automation` `cloudflare-workers` `cloudflare-tunnel` `personal-assistant` `self-hosted` `docker`

Topics 很重要，能讓你的專案被搜尋到。

## Step 5：面試展示時的呈現

### 履歷上的連結
```
個人專案：https://github.com/你的帳號/personal-assistant-bot
```

### 給面試官的快速摘要

「這是一個 Discord 個人助理 Bot，整合 13 個功能。系統設計上用 Cloudflare Worker 處理 Discord 簽名驗證，透過 Cloudflare Tunnel 把家裡的 n8n 暴露成公網服務。整個專案完全免費、24/7 運作。Repo 裡有完整架構文件和部署手冊，README 有 Demo 動畫可以看。」

### 回答常見面試問題

**「為什麼不用現成的工具？」**
> 想要單一入口完成所有日常查詢，市面工具都太分散且有訂閱費。

**「最大的挑戰是什麼？」**
> Discord 強制 Ed25519 簽名驗證，n8n.cloud 環境無法做加密運算。最終用 Cloudflare Worker 邊緣節點原生的 Web Crypto API 解決。

**「為什麼自架而不是用雲端？」**
> 提醒功能需要每分鐘輪詢，雲端版有 execution 次數限制會超量。自架版無限制。

**「如何擴展？」**
> 新增功能只需在 Router 加個 Switch Route + 設計 Feature Workflow，不用改架構。

## 進階：加上 Stars 召喚機制

### README 開頭加上 Badge

可以用 https://shields.io/ 生成這些徽章：

```markdown
![GitHub stars](https://img.shields.io/github/stars/你的帳號/personal-assistant-bot)
![License](https://img.shields.io/github/license/你的帳號/personal-assistant-bot)
![n8n](https://img.shields.io/badge/n8n-self--hosted-orange)
![Discord](https://img.shields.io/badge/Discord-Bot-5865F2)
```

### 到 Reddit / HackerNews / 巴哈分享

如果想讓更多人看到，可以發到：
- r/n8n
- r/selfhosted
- r/Discord_Bots
- 巴哈姆特創作大廳
- iThome IT 邦幫忙

注意：分享時用「我做了一個...」的口吻，不要太自我推銷。
