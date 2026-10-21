import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const docs = path.join(repoRoot, "docs");
const base = "/solarsite2020/";

function walkHtml(dir, files = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) walkHtml(p, files);
    else if (name.endsWith(".html")) files.push(p);
  }
  return files;
}

let missing = 0;
for (const file of walkHtml(docs)) {
  const html = fs.readFileSync(file, "utf8");
  const re = /(?:src|href)="(\/solarsite2020\/[^"]+)"/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    let rel = m[1].slice(base.length - 1).replace(/^\//, "");
    try {
      rel = decodeURIComponent(rel);
    } catch {
      /* keep */
    }
    const dest = path.join(docs, rel.replace(/\//g, path.sep));
    if (!fs.existsSync(dest)) {
      console.log("missing", rel, "in", path.relative(docs, file));
      missing++;
    }
  }
}

const works = fs.readFileSync(path.join(docs, "works", "index.html"), "utf8");
if (!works.includes('href="/solarsite2020/works/2024/"')) {
  console.log("works internal links check failed");
  process.exit(1);
}

console.log(missing === 0 ? "verify ok" : `verify: ${missing} missing assets`);
process.exit(missing > 0 ? 1 : 0);
