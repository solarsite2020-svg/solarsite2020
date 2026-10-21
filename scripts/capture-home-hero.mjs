/**
 * 從 Weebly 預覽 CDN 下載首頁主題背景（background-images/*）。
 * 若編輯器換圖，請在 Chrome Network 找 background-images/*.jpg 後更新 site/home.json。
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, "..");
const homePath = path.join(repoRoot, "site", "home.json");

async function main() {
  const home = JSON.parse(fs.readFileSync(homePath, "utf8"));
  const items = [
    ["heroBackground", "heroBackgroundSourceUrl"],
    ["headerLogo", "headerLogoSourceUrl"],
    ["heroLogo", "heroLogoSourceUrl"],
  ];

  for (const [relKey, urlKey] of items) {
    const rel = home[relKey];
    const url = home[urlKey];
    if (!rel || !url) continue;

    const dest = path.join(repoRoot, "site", "assets", "home", rel);
    fs.mkdirSync(path.dirname(dest), { recursive: true });

    const res = await fetch(url);
    if (!res.ok) {
      console.error("下載失敗", relKey, res.status, url);
      process.exit(1);
    }
    const buf = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(dest, buf);
    console.log("saved", dest, buf.length, "bytes");
  }

  home.heroCapturedAt = new Date().toISOString();
  fs.writeFileSync(homePath, JSON.stringify(home, null, 2) + "\n", "utf8");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
