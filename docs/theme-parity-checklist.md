# Weebly 預覽 vs 靜態站一致性檢查

檢查時間：2026-10-21（本機建置後）

## 比對方式

| 分頁 | URL | 說明 |
|------|-----|------|
| 本機（與 GitHub Pages 路徑一致） | `http://127.0.0.1:8787/solarsite2020/` | `node scripts/serve-preview.mjs` |
| GitHub Pages（遠端，需 push 後更新） | `https://solarsite2020-svg.github.io/solarsite2020/` | 檢查時仍為**舊版**自製 header／長串年份導覽 |
| Weebly 編輯器預覽 | `#editor-frame` → `preview.editmysite.com/.../editor/main.php?preview_token=...` | 直接開啟為編輯器 shell（白屏），需在編輯器 iframe 內比對；跨域無法由腳本讀 DOM |

**勿使用** `file:///.../docs/index.html`（`/solarsite2020/` 資源會 404）。

## 檢查項目

| 項目 | 本機建置結果 | 備註 |
|------|----------------|------|
| 背景色／字色 | 通過 | 黑底、淺色字；Weebly `main.css` + `sites.css` + `weebly-overrides.css` |
| Logo 與 FB/YT 圖示 | 通過 | 圖示可載入；`width:46` 等已補 `px` |
| 導覽項目數與順序 | 通過 | 5 項主選單 + works 下拉（2024→2009）；Contact 僅 footer |
| 首頁聯絡與版權重複 | 通過 | `html-transform` 去除重複 `<font>`／mailto 片段；layout footer 僅 Contact |
| 內容區寬度與對齊 | 接近 | `max-width: 1100px` 居中；與編輯器 iframe 內站點需人工目視微調 |

### 首頁專項（2026-10-21 更新）

| 項目 | 結果 | 備註 |
|------|------|------|
| 白底 header、左 logo 右選單 | 通過 | `site/home.json` + 全站白 `#header-wrap` |
| 舞者全幅背景 | 通過 | Weebly 主題 `background-images/2017304911.jpg`（見 `site/home.json`） |
| Hero 大 logo | 通過 | `.home-hero-logo`；內文重複 logo 元素已 CSS 隱藏 |

### 最新消息 `/news/`（2026-10-21）

| 項目 | 結果 | 備註 |
|------|------|------|
| 潘大謙個展區塊 | 通過 | `patch-news-backup.mjs` + `content-overrides/03-news-pan-prefix.html` |
| 內頁白底與三欄圖 | 通過 | `page-inner` 白底；`wsite-multicol-table` |
| pageId 同步 | 通過 | `174033169919741899`（`settings/general-and-navigation.json`） |

### 歷年創作 `/works/`（2026-10-21）

| 項目 | 結果 | 備註 |
|------|------|------|
| 起始畫面背景 | 通過 | `background-images/812874803.jpg`（`site/works-landing.json`，Weebly `Render::page`） |
| 暗化疊層 | 通過 | `heroDarken: 0.3` 對齊編輯器 |
| 年度連結列表 | 通過 | 備份去重後單一段落 |

## 主題資產

- 目錄：`site/assets/weebly/` → build 複製至 `docs/assets/weebly/`
- 清單：`theme-manifest.json`（theme id `722557302383787297`，color `v8`）
- 未載入 `main_style2.css`（偏編輯器 UI，非公開站）

## 上線

push `docs/` 與 `site/` 變更後，GitHub Pages 應與本機 `serve-preview` 一致。
