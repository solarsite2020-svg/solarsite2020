# 索拉舞蹈空間舞團 — 靜態官網

索拉舞蹈空間舞團官方網站，以靜態 HTML + Tailwind CSS 發佈於 GitHub Pages。

- **線上網址**：<https://solarsite2020-svg.github.io/solarsite2020/>

## 維護原則

- **內容與版面**：直接編輯 [`docs/`](docs/) 底下各頁 `index.html`（每頁含完整 header、內文、footer）。更新選單時請同步各頁 header，可參考 [`site/nav.json`](site/nav.json)。
- **不再**從 Weebly 備份重建整站；本 repo **不提供**內容轉換、去重或 HTML 組版腳本。
- **樣式**：調整 Tailwind class 或 [`src/styles/site.css`](src/styles/site.css) 後，執行 `npm run build:css` 產出 [`docs/assets/css/site.css`](docs/assets/css/site.css)。

## 本機開發

```bash
npm install
npm run build:css    # 編譯 CSS
npm run watch:css    # 監聽樣式變更（可選）
npm run preview      # 本機預覽 docs（http://localhost:8787/solarsite2020/）
```

## GitHub Pages

1. 將 `docs/` 推送到 `main`。
2. Repository **Settings → Pages** → **Deploy from a branch**。
3. Branch：`main`，Folder：**`/docs`**。

## 目錄說明

| 路徑 | 說明 |
|------|------|
| `docs/` | 發佈用靜態站（24 頁 HTML、圖片、`assets/css/site.css`） |
| `src/styles/site.css` | Tailwind 來源樣式 |
| `site/config.json` | 站名、聯絡資訊（供參考） |
| `site/nav.json` | 導覽結構 |

## 限制與備註

- Contact 表單僅保留說明，請使用 `mailto:solar.site@msa.hinet.net` 聯絡。
- 歷年創作子頁若含 `[data-slideshow]`，會載入 [`docs/assets/js/slideshow.js`](docs/assets/js/slideshow.js)（唯一站內 JS，用於圖片輪播）。
