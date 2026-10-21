import fs from "node:fs";
import path from "node:path";

export function readWorksLanding(repoRoot) {
  const p = path.join(repoRoot, "site", "works-landing.json");
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, "utf8"));
}
