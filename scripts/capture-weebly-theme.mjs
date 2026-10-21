import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(repoRoot, "site", "assets", "weebly");
const buildtime = "1792517296";

const SOURCES = [
  { file: "main_style2.css", url: `https://cdn11.editmysite.com/css/old/main_style2.css?buildtime=${buildtime}` },
  { file: "main.css", url: `https://cdn11.editmysite.com/css/main.css?buildtime=${buildtime}` },
  { file: "sites.css", url: `https://cdn11.editmysite.com/css/sites.css?buildtime=${buildtime}` },
  { file: "social-icons.css", url: `https://cdn11.editmysite.com/css/social-icons.css?buildtime=${buildtime}` },
  { file: "slideshow.css", url: `https://cdn11.editmysite.com/css/old/slideshow/slideshow.css?buildtime=${buildtime}` },
  { file: "open-sans-font.css", url: "https://cdn11.editmysite.com/fonts/Open_Sans/font.css?2" },
];

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  const manifest = {
    capturedAt: new Date().toISOString(),
    themeId: "722557302383787297",
    themeColor: "v8",
    source: "Weebly editor iframe network (cdn11.editmysite.com)",
    files: [],
  };

  for (const { file, url } of SOURCES) {
    const r = await fetch(url);
    const text = await r.text();
    fs.writeFileSync(path.join(outDir, file), text, "utf8");
    manifest.files.push({ file, url, status: r.status, bytes: text.length });
    console.log("saved", file, r.status, text.length);
  }

  fs.writeFileSync(path.join(outDir, "theme-manifest.json"), JSON.stringify(manifest, null, 2), "utf8");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
