import { slugToUrlPath } from "./routes.mjs";

const UPLOADS_RE = /^\/uploads\/7\/9\/0\/7\/79072506\//;
const PLACEHOLDER_RE = /<!([A-Z_!]+)!>/g;

function normalizeUploadPath(filePart) {
  if (filePart.startsWith("editor/")) return filePart.slice("editor/".length);
  if (filePart.startsWith("edited/")) return filePart.slice("edited/".length);
  return filePart;
}

export function decodeHtmlEntities(str) {
  return str
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"');
}

export function extractBodyInner(html) {
  const m = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  return m ? m[1] : html;
}

export function transformContent(html, ctx) {
  const { basePath, pageIdToSlug, uploadsWebPrefix, filesWebPrefix, isContactPage } = ctx;
  let out = extractBodyInner(html);

  out = out.replace(PLACEHOLDER_RE, "");
  out = out.replace(/<weebly[^>]*>[\s\S]*?<\/weebly>/gi, "");
  out = out.replace(/\scontentEditable="true"/gi, "");
  out = out.replace(/\scontenteditable="true"/gi, "");

  if (isContactPage) {
    out = out.replace(/<div class="element" id="750559235931158021">[\s\S]*?(?=<h2 class="element wsite-content-title)/i, "");
    out = out.replace(/<div class="wsite-form-[\s\S]*?<\/div>\s*<\/div>/gi, "");
    out = `<p class="contact-notice">此聯絡表單為原 Weebly 版面備份，GitHub Pages 無法代為送出。請直接寄信至 <a href="mailto:${ctx.contactEmail}">${ctx.contactEmail}</a>。</p>\n${out}`;
  }

  out = out.replace(/href="http:\/\/weebly-link\/(\d+)"/gi, (_, id) => {
    const slug = pageIdToSlug.get(id);
    if (!slug) return `href="#" data-missing-page-id="${id}"`;
    return `href="${slugToUrlPath(slug, basePath)}"`;
  });

  out = out.replace(/href="http:\/\/weebly-file\/7\/9\/0\/7\/79072506\/([^"]+)"/gi, (_, raw) => {
    const decoded = decodeHtmlEntities(decodeURIComponent(raw));
    let safe = decoded.split("/").pop();
    safe = safe.replace(/柆/g, "拉");
    if (safe.includes("投稿評論.pdf")) {
      return `href="#" class="missing-file" title="原檔已無法從 Weebly 下載"`;
    }
    return `href="${filesWebPrefix}${safe}" download`;
  });

  out = out.replace(
    /(src|href)="(\/uploads\/7\/9\/0\/7\/79072506\/[^"]+)"/gi,
    (_, attr, path) => {
      const clean = path.split("?")[0];
      const filePart = normalizeUploadPath(decodeHtmlEntities(clean.replace(UPLOADS_RE, "")));
      return `${attr}="${uploadsWebPrefix}${filePart}"`;
    }
  );

  out = out.replace(
    /href="(\/uploads\/7\/9\/0\/7\/79072506\/[^"]+)"/gi,
    (_, path) => {
      const clean = path.split("?")[0];
      const filePart = clean.replace(UPLOADS_RE, "");
      return `href="${uploadsWebPrefix}${normalizeUploadPath(decodeHtmlEntities(filePart))}"`;
    }
  );

  return out.trim();
}

/** Collect upload filenames and file downloads referenced in HTML */
export function collectMediaRefs(html) {
  const uploads = new Set();
  const files = new Set();

  const uploadRe = /\/uploads\/7\/9\/0\/7\/79072506\/([^"?\s]+)/gi;
  let m;
  while ((m = uploadRe.exec(html)) !== null) {
    uploads.add(normalizeUploadPath(decodeHtmlEntities(m[1].split("?")[0])));
  }

  const fileRe = /weebly-file\/7\/9\/0\/7\/79072506\/([^"]+)/gi;
  while ((m = fileRe.exec(html)) !== null) {
    let name = decodeHtmlEntities(decodeURIComponent(m[1])).split("/").pop();
    name = name.replace(/柆/g, "拉");
    if (!name.includes("投稿評論.pdf")) files.add(name);
  }

  return { uploads, files };
}
