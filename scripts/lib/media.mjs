import fs from "node:fs";
import path from "node:path";

export function indexMediaDir(mediaDir) {
  const names = fs.existsSync(mediaDir) ? fs.readdirSync(mediaDir) : [];
  const byLower = new Map();
  for (const n of names) {
    byLower.set(n.toLowerCase(), n);
  }
  return { names, byLower };
}

export function resolveMediaFile(requestedName, index) {
  let decoded = requestedName;
  if (decoded.includes("/")) decoded = decoded.split("/").pop();
  decoded = decoded.replace(/柆/g, "拉");
  if (index.byLower.has(decoded.toLowerCase())) {
    return index.byLower.get(decoded.toLowerCase());
  }
  const noQuery = decoded.split("?")[0];
  if (index.byLower.has(noQuery.toLowerCase())) {
    return index.byLower.get(noQuery.toLowerCase());
  }
  const base = noQuery.replace(/_(\d+)(\.[^.]+)$/, "$2");
  if (base !== noQuery && index.byLower.has(base.toLowerCase())) {
    return index.byLower.get(base.toLowerCase());
  }
  const withoutSuffix = noQuery.replace(/_1(\.[^.]+)$/, "$1");
  if (withoutSuffix !== noQuery && index.byLower.has(withoutSuffix.toLowerCase())) {
    return index.byLower.get(withoutSuffix.toLowerCase());
  }
  for (const n of index.names) {
    if (n.toLowerCase() === noQuery.toLowerCase()) return n;
  }
  return null;
}

export function copyMediaFile(sourceDir, sourceName, destPath) {
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.copyFileSync(path.join(sourceDir, sourceName), destPath);
}
