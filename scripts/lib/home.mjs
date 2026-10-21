import fs from "node:fs";
import path from "node:path";

export function readSiteHome(repoRoot) {
  const p = path.join(repoRoot, "site", "home.json");
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

export function uploadPublicUrl(config, fileName) {
  const base = config.basePath.endsWith("/") ? config.basePath : `${config.basePath}/`;
  return `${base}${config.uploadsPrefix}${fileName}`;
}
