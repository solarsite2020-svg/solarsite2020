import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  allManifestSlugs,
  buildPageIdMap,
  slugToOutFile,
} from "./lib/routes.mjs";
import { collectMediaRefs, decodeHtmlEntities, transformContent } from "./lib/html-transform.mjs";
import { renderPage } from "./lib/layout.mjs";
import { readSiteNav } from "./lib/nav.mjs";
import { readSiteHome } from "./lib/home.mjs";
import { readWorksLanding } from "./lib/works-landing.mjs";
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

function findUploadUrl(sourceDir, fileName) {
  const urlsPath = path.join(sourceDir, "all_image_urls.json");
  if (!fs.existsSync(urlsPath)) return null;
  const urls = JSON.parse(fs.readFileSync(urlsPath, "utf8"));
  const lower = fileName.toLowerCase();
  return urls.find((u) => u.toLowerCase().includes(`/${lower}`) || u.toLowerCase().endsWith(lower));
}

function copyBundledSiteUpload(repoRoot, assetDir, relativePath, uploadsDestDir) {
  const bundled = path.join(repoRoot, "site", "assets", assetDir, relativePath);
  if (!fs.existsSync(bundled)) return false;
  const destPath = path.join(uploadsDestDir, relativePath);
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.copyFileSync(bundled, destPath);
  return true;
}

async function ensureUploadFile({
  fileName,
  sourceDir,
  mediaDir,
  mediaIndex,
  uploadsDestDir,
  downloaded,
  overrideUrl,
  repoRoot,
}) {
  const destPath = path.join(uploadsDestDir, fileName);
  if (fs.existsSync(destPath)) return true;

  if (repoRoot && copyBundledSiteUpload(repoRoot, "home", fileName, uploadsDestDir)) {
    downloaded.push({ fileName, url: "bundled:site/assets/home/" + fileName });
    return true;
  }
  if (repoRoot && copyBundledSiteUpload(repoRoot, "works", fileName, uploadsDestDir)) {
    downloaded.push({ fileName, url: "bundled:site/assets/works/" + fileName });
    return true;
  }

  const resolved = resolveMediaFile(fileName, mediaIndex);
  if (resolved) {
    copyMediaFile(mediaDir, resolved, destPath);
    return true;
  }

  const url = overrideUrl || findUploadUrl(sourceDir, fileName);
  if (!url) return false;

  try {
    const res = await fetch(url);
    if (!res.ok) return false;
    const buf = Buffer.from(await res.arrayBuffer());
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.writeFileSync(destPath, buf);
    downloaded.push({ fileName, url });
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const sourceDir = parseArgs(process.argv);
  const config = JSON.parse(fs.readFileSync(path.join(repoRoot, "site", "config.json"), "utf8"));
  const manifest = JSON.parse(fs.readFileSync(path.join(repoRoot, "site", "manifest.json"), "utf8"));
  const pages = manifest.pages;
  const home = readSiteHome(repoRoot);
  const worksLanding = readWorksLanding(repoRoot);

  const basePath = config.basePath;
  const base = basePath.endsWith("/") ? basePath : `${basePath}/`;
  const uploadsWebPrefix = `${base}${config.uploadsPrefix}`;
  const filesWebPrefix = `${base}files/`;

  const pageIdToSlug = buildPageIdMap(pages, loadExtraPageIds(sourceDir));
  const nav = readSiteNav(repoRoot);

  const docsDir = path.join(repoRoot, "docs");
  rimrafExceptNojekyll(docsDir);
  if (!fs.existsSync(path.join(docsDir, ".nojekyll"))) {
    fs.writeFileSync(path.join(docsDir, ".nojekyll"), "");
  }

  const cssDir = path.join(docsDir, "assets", "css");
  fs.mkdirSync(cssDir, { recursive: true });
  fs.copyFileSync(
    path.join(repoRoot, "site", "assets", "css", "weebly-overrides.css"),
    path.join(cssDir, "weebly-overrides.css")
  );

  const weeblySrc = path.join(repoRoot, "site", "assets", "weebly");
  const weeblyDest = path.join(docsDir, "assets", "weebly");
  if (fs.existsSync(weeblySrc)) {
    fs.mkdirSync(weeblyDest, { recursive: true });
    for (const name of fs.readdirSync(weeblySrc)) {
      const src = path.join(weeblySrc, name);
      if (fs.statSync(src).isFile()) {
        fs.copyFileSync(src, path.join(weeblyDest, name));
      }
    }
  }

  const mediaDir = path.join(sourceDir, "media_all");
  const mediaIndex = indexMediaDir(mediaDir);
  const uploadsDestDir = path.join(docsDir, ...config.uploadsPrefix.split("/").filter(Boolean));
  const filesDestDir = path.join(docsDir, "files");

  const allUploads = new Set();
  const allFiles = new Set();
  const missingLinks = [];
  const built = [];
  const downloadedUploads = [];

  if (home?.headerLogo) allUploads.add(home.headerLogo);
  if (home?.heroLogo) allUploads.add(home.heroLogo);
  if (home?.heroBackground) allUploads.add(home.heroBackground);
  if (worksLanding?.heroBackground) allUploads.add(worksLanding.heroBackground);

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
      isHomePage: slug === "01-home-frontpage",
      contactEmail: config.contact.email,
    });

    const refs = collectMediaRefs(rawHtml);
    refs.uploads.forEach((u) => allUploads.add(u));
    refs.files.forEach((f) => allFiles.add(f));

    const fullHtml = renderPage({
      config,
      nav,
      home,
      worksLanding,
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

  const heroOverrideUrls = new Map();
  if (home?.heroBackground && home?.heroBackgroundSourceUrl) {
    heroOverrideUrls.set(home.heroBackground, home.heroBackgroundSourceUrl);
  }
  if (home?.headerLogo && home?.headerLogoSourceUrl) {
    heroOverrideUrls.set(home.headerLogo, home.headerLogoSourceUrl);
  }
  if (home?.heroLogo && home?.heroLogoSourceUrl) {
    heroOverrideUrls.set(home.heroLogo, home.heroLogoSourceUrl);
  }
  if (worksLanding?.heroBackground && worksLanding?.heroBackgroundSourceUrl) {
    heroOverrideUrls.set(worksLanding.heroBackground, worksLanding.heroBackgroundSourceUrl);
  }

  const missingMedia = [];
  let copiedUploads = 0;
  for (const name of allUploads) {
    const ok = await ensureUploadFile({
      fileName: name,
      sourceDir,
      mediaDir,
      mediaIndex,
      uploadsDestDir,
      downloaded: downloadedUploads,
      overrideUrl: heroOverrideUrls.get(name),
      repoRoot,
    });
    if (ok) {
      copiedUploads++;
      continue;
    }
    if (!name.includes("投稿評論.pdf")) missingMedia.push(name);
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
    downloadedUploads,
  };

  fs.writeFileSync(path.join(docsDir, "build-report.json"), JSON.stringify(report, null, 2), "utf8");

  const paritySrc = path.join(repoRoot, "site", "theme-parity-checklist.md");
  if (fs.existsSync(paritySrc)) {
    fs.copyFileSync(paritySrc, path.join(docsDir, "theme-parity-checklist.md"));
  }

  console.log(JSON.stringify(report, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
