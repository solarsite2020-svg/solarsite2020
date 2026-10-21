# 索拉舞蹈空間舞團 — 靜態官網

由 Weebly 編輯器備份轉出的靜態站，發佈於 GitHub Pages。

- **線上網址（專案站）**：<https://solarsite2020-svg.github.io/solarsite2020/>
- **原始備份**：`D:\Project\JMdict\backup\SolarSite-Weebly`（本機路徑，不納入此 repo）

## 建置

需 Node.js 18+。

```bash
node scripts/build.mjs --source "D:/Project/JMdict/backup/SolarSite-Weebly"
```

或設定環境變數 `WEEBLY_BACKUP` 指向備份目錄。

輸出目錄為 `docs/`（含 HTML、媒體、`build-report.json`）。

## GitHub Pages

1. 將 `docs/` 推送到 `main`。
2. Repository **Settings → Pages** → Build and deployment → **Deploy from a branch**。
3. Branch：`main`，Folder：**`/docs`**。

## 目錄說明

| 路徑 | 說明 |
|------|------|
| `site/config.json` | 站名、basePath、聯絡資訊 |
| `site/manifest.json` | 24 頁 slug 與導覽 |
| `site/assets/css/site.css` | 版型樣式（建置時複製到 `docs/`） |
| `scripts/build.mjs` | 建置腳本 |

## 限制

- Contact 表單僅保留說明，請使用頁尾 `mailto` 聯絡。
- `投稿評論.pdf` 若備份中缺檔，評論頁內連結會標示為無法下載。
