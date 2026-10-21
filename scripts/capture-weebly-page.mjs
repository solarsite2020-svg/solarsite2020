/**
 * 將瀏覽器執行 browser-export-all 單頁結果（JSON）寫入備份。
 * 用法：node scripts/capture-weebly-page.mjs --source <backupDir> --input export.json --slug 03-news
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, "..");

function parseArgs(argv) {
  let source = path.join(repoRoot, "..", "JMdict", "backup", "SolarSite-Weebly");
  let input = null;
  let slug = null;
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === "--source" && argv[i + 1]) source = argv[++i];
    else if (argv[i] === "--input" && argv[i + 1]) input = argv[++i];
    else if (argv[i] === "--slug" && argv[i + 1]) slug = argv[++i];
  }
  return { sourceDir: path.resolve(source), input, slug };
}

function wrapHtml(inner) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>\n${inner}\n</body></html>`;
}

function main() {
  const { sourceDir, input, slug } = parseArgs(process.argv);
  if (!input || !slug) {
    console.error("需要 --input export.json --slug 03-news");
    process.exit(1);
  }
  const raw = JSON.parse(fs.readFileSync(path.resolve(input), "utf8"));
  const pages = raw.pages || raw.exported || (Array.isArray(raw) ? raw : [raw]);
  const page = pages.find((p) => p.slug === slug);
  if (!page?.html) {
    console.error("找不到 slug 或 html", slug);
    process.exit(1);
  }

  const pageDir = path.join(sourceDir, "pages", slug);
  fs.mkdirSync(pageDir, { recursive: true });
  fs.writeFileSync(path.join(pageDir, "content.html"), wrapHtml(page.html), "utf8");
  fs.writeFileSync(
    path.join(pageDir, "meta.json"),
    JSON.stringify(
      {
        pageName: page.title,
        slug,
        pageId: page.pageId,
        hiddenInNav: page.hiddenInNav ?? true,
        capturedAt: raw.exportedAt || new Date().toISOString(),
        imageUrls: page.imageUrls || [],
        htmlLength: page.html.length,
      },
      null,
      2
    ) + "\n",
    "utf8"
  );
  console.log("wrote", slug, page.html.length, "chars");
}

main();
