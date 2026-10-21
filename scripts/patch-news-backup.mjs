/**
 * 將 site/content-overrides/03-news-pan-prefix.html 併入備份最新消息頁，
 * 並更新 pageId、圖片檔名（Pure Meat 區 _2）。
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, "..");

function parseArgs(argv) {
  let source = path.join(repoRoot, "..", "JMdict", "backup", "SolarSite-Weebly");
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === "--source" && argv[i + 1]) source = argv[++i];
  }
  return path.resolve(source);
}

function wrapBody(inner) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>\n${inner}\n</body></html>`;
}

function main() {
  const sourceDir = parseArgs(process.argv);
  const prefixPath = path.join(repoRoot, "site", "content-overrides", "03-news-pan-prefix.html");
  const contentPath = path.join(sourceDir, "pages", "03-news", "content.html");
  const metaPath = path.join(sourceDir, "pages", "03-news", "meta.json");

  if (!fs.existsSync(prefixPath)) {
    console.error("missing prefix", prefixPath);
    process.exit(1);
  }
  if (!fs.existsSync(contentPath)) {
    console.error("missing content", contentPath);
    process.exit(1);
  }

  const prefix = fs.readFileSync(prefixPath, "utf8").trim();
  const old = fs.readFileSync(contentPath, "utf8");
  const m = old.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  if (!m) {
    console.error("no body in content.html");
    process.exit(1);
  }

  let body = m[1];
  if (body.includes("pan-exhibition-title")) {
    console.log("content already patched");
  } else {
    body = body
      .replace(/1850790222_1\.jpg/g, "1850790222_2.jpg")
      .replace(/373376935_1\.jpg/g, "373376935_2.jpg")
      .replace(/905959664_1\.jpg/g, "905959664_2.jpg");
    body = `${prefix}\n${body}`;
    fs.writeFileSync(contentPath, wrapBody(body), "utf8");
    console.log("patched", contentPath);
  }

  const imageUrls = [
    "https://79072506-213136122765237639.preview.editmysite.com/uploads/7/9/0/7/79072506/s-22594238_orig.jpg",
    "https://79072506-213136122765237639.preview.editmysite.com/uploads/7/9/0/7/79072506/s-22594236_orig.jpg",
    "https://79072506-213136122765237639.preview.editmysite.com/uploads/7/9/0/7/79072506/1850790222_2.jpg",
    "https://79072506-213136122765237639.preview.editmysite.com/uploads/7/9/0/7/79072506/373376935_2.jpg",
    "https://79072506-213136122765237639.preview.editmysite.com/uploads/7/9/0/7/79072506/905959664_2.jpg",
  ];

  const meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
  meta.pageId = "174033169919741899";
  meta.capturedAt = new Date().toISOString();
  meta.imageUrls = imageUrls;
  meta.htmlLength = body.length;
  meta.patchNote = "pan-exhibition prefix from editor snapshot + Render pageId sync";
  fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2) + "\n", "utf8");

  const allUrlsPath = path.join(sourceDir, "all_image_urls.json");
  if (fs.existsSync(allUrlsPath)) {
    const all = new Set(JSON.parse(fs.readFileSync(allUrlsPath, "utf8")));
    for (const u of imageUrls) all.add(u);
    fs.writeFileSync(allUrlsPath, JSON.stringify([...all], null, 2) + "\n", "utf8");
  }

  const manifestPath = path.join(sourceDir, "pages_manifest.json");
  if (fs.existsSync(manifestPath)) {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    const page = manifest.pages?.find((p) => p.slug === "03-news");
    if (page) page.pageId = "174033169919741899";
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n", "utf8");
  }

  const siteManifest = path.join(repoRoot, "site", "manifest.json");
  if (fs.existsSync(siteManifest)) {
    const manifest = JSON.parse(fs.readFileSync(siteManifest, "utf8"));
    const page = manifest.pages?.find((p) => p.slug === "03-news");
    if (page) page.pageId = "174033169919741899";
    fs.writeFileSync(siteManifest, JSON.stringify(manifest, null, 2) + "\n", "utf8");
  }
}

main();
