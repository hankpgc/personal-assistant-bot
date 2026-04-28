# API Reference

## 用到的所有 API

### 免費且不限量
| API | 用途 | 備註 |
|---|---|---|
| Yahoo Finance | 股價 | 無需 API Key |
| Google News RSS | 新聞 | 無需 API Key |
| ExchangeRate API | 匯率 | 無需 API Key（每月 1500 次） |

### 免費註冊 + 有額度
| API | 額度 | 申請 |
|---|---|---|
| OpenWeatherMap | 60 次/分、100 萬次/月 | https://openweathermap.org/api |
| Google Routes | 每月 10,000 次免費 | Google Cloud Console |
| Google Gemini | 1,500 次/天 | https://aistudio.google.com/apikey |
| Gmail API | 10 億 quota units/天 | Google Cloud Console |
| Google Sheets | 300 次/分 | Google Cloud Console |

## 主要 API 範例

### Yahoo Finance
```
GET https://query1.finance.yahoo.com/v8/finance/chart/2330.TW
```

回傳 `chart.result[0].meta`：
- `regularMarketPrice`：當前股價
- `chartPreviousClose`：昨日收盤
- `symbol`：代號

台股代號自動處理：
- 純數字（2330）→ 加 `.TW`（上市）
- 數字含英文（00937B）→ 加 `.TWO`（上櫃）
- 英文開頭（NVDA）→ 直接使用（美股）

### OpenWeatherMap
```
GET https://api.openweathermap.org/data/2.5/weather?q=Taipei&appid={KEY}&units=metric&lang=zh_tw
```

中文城市對照表：台北→Taipei、新竹→Hsinchu、東京→Tokyo...

### Google Routes API
```
POST https://routes.googleapis.com/directions/v2:computeRoutes
Headers:
  X-Goog-Api-Key: {KEY}
  X-Goog-FieldMask: routes.distanceMeters,routes.duration,routes.legs.localizedValues
Body:
  {
    "origin": { "address": "台北車站" },
    "destination": { "address": "我家地址" },
    "travelMode": "DRIVE",
    "languageCode": "zh-TW"
  }
```

### ExchangeRate API
```
GET https://open.er-api.com/v6/latest/TWD
```

回傳 `rates`：所有幣別對 TWD 的匯率對照表。

### Google News RSS
```
https://news.google.com/rss/search?q={關鍵字}&hl=zh-TW&gl=TW&ceid=TW:zh-Hant
```

### Google Gemini
```
POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={KEY}
Body:
  {
    "contents": [{
      "parts": [{ "text": "你的 prompt" }]
    }]
  }
```

### Discord Follow-up Message
```
PATCH https://discord.com/api/v10/webhooks/{application_id}/{interaction_token}/messages/@original
Body:
  {
    "embeds": [...]
  }
```

不需要 Bot Token，`interaction_token` 本身就是授權。

### bwipjs Barcode 生成
```
https://bwipjs-api.metafloor.com/?bcid=code128&text={ID}&scale=2&height=10&backgroundcolor=ffffff&barcolor=000000&paddingwidth=20&paddingheight=10
```

用於待辦列表的 Barcode 顯示版本。

## Discord Embed 顏色對照

| 顏色 | 十進位 | 用途 |
|---|---|---|
| 綠色 | 3066993 | 成功、上漲 |
| 紅色 | 15158332 | 失敗、下跌 |
| 藍色 | 3447003 | 資訊 |
| 黃色 | 16776960 | 警告 |
| 紫色 | 10181046 | AI 相關 |
