import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, "..");
const docsDir = path.join(repoRoot, "docs");
const config = JSON.parse(fs.readFileSync(path.join(repoRoot, "site", "config.json"), "utf8"));
const mount = config.basePath.startsWith("/") ? config.basePath : `/${config.basePath}`;
const port = Number(process.env.PREVIEW_PORT) || 8787;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".pdf": "application/pdf",
  ".doc": "application/msword",
};

function send(res, code, body, type) {
  res.writeHead(code, { "Content-Type": type || "text/plain; charset=utf-8" });
  res.end(body);
}

const server = http.createServer((req, res) => {
  let urlPath = decodeURIComponent(req.url.split("?")[0]);
  if (!urlPath.startsWith(mount)) {
    if (urlPath === "/" || urlPath === "") {
      res.writeHead(302, { Location: `${mount}/` });
      res.end();
      return;
    }
    send(res, 404, "Not found");
    return;
  }

  let rel = urlPath.slice(mount.length).replace(/^\//, "") || "index.html";
  if (rel.endsWith("/")) rel += "index.html";

  const filePath = path.normalize(path.join(docsDir, rel));
  if (!filePath.startsWith(docsDir)) {
    send(res, 403, "Forbidden");
    return;
  }

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    send(res, 404, `Missing: ${rel}`);
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  fs.readFile(filePath, (err, data) => {
    if (err) {
      send(res, 500, String(err));
      return;
    }
    send(res, 200, data, MIME[ext] || "application/octet-stream");
  });
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Preview: http://127.0.0.1:${port}${mount}/`);
  console.log(`Serving: ${docsDir}`);
});
