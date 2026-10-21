import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  allManifestSlugs,
  buildPageIdMap,
  getNavItems,
  slugToOutFile,
} from "./lib/routes.mjs";
import { collectMediaRefs, decodeHtmlEntities, transformContent } from "./lib/html-transform.mjs";
import { renderPage } from "./lib/layout.mjs";
import { copyMediaFile, indexMediaDir, resolveMediaFile } from "./lib/media.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, "..");

function parseArgs(argv) {
  let source = process.env.WEEBLY_BACKUP;
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === "--source" && argv[i + 1]) {
      source = argv[++i];
    }
  }
  if (!source) {
    source = path.join(repoRoot, "..", "JMdict", "backup", "SolarSite-Weebly");
  }
  return path.resolve(source);
}

function rimrafExceptNojekyll(docsDir) {
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
    return;
  }
  for (const name of fs.readdirSync(docsDir)) {
    if (name === ".nojekyll") continue;
    fs.rmSync(path.join(docsDir, name), { recursive: true, force: true });
  }
}

function loadExtraPageIds(sourceDir) {
  const rawPath = path.join(sourceDir, "raw-export.json");
  if (!fs.existsSync(rawPath)) return [];
  try {
    const raw = JSON.parse(fs.readFileSync(rawPath, "utf8"));
    return (raw.pages || []).map((p) => ({ slug: p.slug, pageId: p.pageId }));
  } catch {
    return [];
  }
}

function main() {
  const sourceDir = parseArgs(process.argv);
  const config = JSON.parse(fs.readFileSync(path.join(repoRoot, "site", "config.json"), "utf8"));
  const manifest = JSON.parse(fs.readFileSync(path.join(repoRoot, "site", "manifest.json"), "utf8"));
  const pages = manifest.pages;

  const basePath = config.basePath;
  const base = basePath.endsWith("/") ? basePath : `${basePath}/`;
  const uploadsWebPrefix = `${base}${config.uploadsPrefix}`;
  const filesWebPrefix = `${base}files/`;

  const pageIdToSlug = buildPageIdMap(pages, loadExtraPageIds(sourceDir));
  const navItems = getNavItems(pages, basePath);

  const docsDir = path.join(repoRoot, "docs");
  rimrafExceptNojekyll(docsDir);
  if (!fs.existsSync(path.join(docsDir, ".nojekyll"))) {
    fs.writeFileSync(path.join(docsDir, ".nojekyll"), "");
  }

  const cssSrc = path.join(repoRoot, "site", "assets", "css", "site.css");
  const cssDest = path.join(docsDir, "assets", "css", "site.css");
  fs.mkdirSync(path.dirname(cssDest), { recursive: true });
  fs.copyFileSync(cssSrc, cssDest);

  const mediaDir = path.join(sourceDir, "media_all");
  const mediaIndex = indexMediaDir(mediaDir);
  const uploadsDestDir = path.join(docsDir, ...config.uploadsPrefix.split("/").filter(Boolean));
  const filesDestDir = path.join(docsDir, "files");

  const allUploads = new Set();
  const allFiles = new Set();
  const missingLinks = [];
  const built = [];

  for (const slug of allManifestSlugs(pages)) {
    const pageMeta = pages.find((p) => p.slug === slug);
    const contentPath = path.join(sourceDir, "pages", slug, "content.html");
    if (!fs.existsSync(contentPath)) {
      console.warn("skip missing", slug);
      continue;
    }
    const rawHtml = fs.readFileSync(contentPath, "utf8");
    const bodyHtml = transformContent(rawHtml, {
      basePath,
      pageIdToSlug,
      uploadsWebPrefix,
      filesWebPrefix,
      isContactPage: slug === "24-contact",
      contactEmail: config.contact.email,
    });

    const refs = collectMediaRefs(rawHtml);
    refs.uploads.forEach((u) => allUploads.add(u));
    refs.files.forEach((f) => allFiles.add(f));

    const fullHtml = renderPage({
      config,
      navItems,
      pageTitle: pageMeta?.name || slug,
      bodyHtml,
      currentSlug: slug,
    });

    const outRel = slugToOutFile(slug);
    const outPath = path.join(docsDir, outRel);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, fullHtml, "utf8");
    built.push(outRel);
  }

  if (fs.existsSync(path.join(sourceDir, "all_image_urls.json"))) {
    const urls = JSON.parse(fs.readFileSync(path.join(sourceDir, "all_image_urls.json"), "utf8"));
    for (const url of urls) {
      const m = url.match(/\/uploads\/7\/9\/0\/7\/79072506\/([^?]+)/);
      if (m) {
        let part = decodeHtmlEntities(m[1]);
        if (part.startsWith("editor/")) part = part.slice("editor/".length);
        if (part.startsWith("edited/")) part = part.slice("edited/".length);
        allUploads.add(part);
      }
    }
  }

  const missingMedia = [];
  let copiedUploads = 0;
  for (const name of allUploads) {
    const resolved = resolveMediaFile(name, mediaIndex);
    if (!resolved) {
      if (!name.includes("投稿評論.pdf")) missingMedia.push(name);
      continue;
    }
    copyMediaFile(mediaDir, resolved, path.join(uploadsDestDir, name));
    copiedUploads++;
  }

  for (const n of mediaIndex.names) {
    if (/\.(doc|pdf)$/i.test(n)) allFiles.add(n);
  }

  let copiedFiles = 0;
  for (const name of allFiles) {
    const resolved = resolveMediaFile(name, mediaIndex);
    if (!resolved) {
      missingMedia.push(`file:${name}`);
      continue;
    }
    copyMediaFile(mediaDir, resolved, path.join(filesDestDir, name));
    copiedFiles++;
  }

  const report = {
    sourceDir,
    pagesBuilt: built.length,
    built,
    uploadsCopied: copiedUploads,
    filesCopied: copiedFiles,
    missingMedia,
    missingPageIdLinks: missingLinks,
  };

  fs.writeFileSync(path.join(docsDir, "build-report.json"), JSON.stringify(report, null, 2), "utf8");
  console.log(JSON.stringify(report, null, 2));
}

main();
