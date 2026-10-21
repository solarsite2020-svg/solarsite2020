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
  const { basePath, pageIdToSlug, uploadsWebPrefix, filesWebPrefix, isContactPage, isHomePage } =
    ctx;
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

  out = fixDimensionlessWidths(out);
  out = dedupeRedundantFontBlocks(out);
  out = dedupeStrayMailtoAfterParagraph(out);
  out = dedupeSimilarParagraphs(out);
  out = dedupeDuplicateContentTitles(out);
  out = dedupeOrphanDuplicateRuns(out);
  out = removeStrayEmptyAnchors(out);

  if (isHomePage) {
    out = trimHomeLeadingBreaks(out);
  }

  return out.trim();
}

function trimHomeLeadingBreaks(html) {
  return html.replace(
    /(<div class="element paragraph[^"]*"[^>]*>)\s*<font size="2">((?:<br\s*\/?>\s*){2,})/i,
    "$1<font size=\"2\">"
  );
}

/** e.g. style="width:46" → width:46px */
function fixDimensionlessWidths(html) {
  return html.replace(
    /(width|height|min-width|max-width|min-height|max-height):\s*(\d+)(?=[;"'\s])/gi,
    (_, prop, num) => `${prop}:${num}px`
  );
}

function stripTags(s) {
  return s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

function textSimilar(a, b) {
  if (!a || !b) return false;
  const na = a.replace(/\s/g, "");
  const nb = b.replace(/\s/g, "");
  if (na === nb) return true;
  if (na.length > 8 && (na.includes(nb) || nb.includes(na))) return true;
  return false;
}

/** Remove bare <font> blocks that duplicate the preceding paragraph text */
function dedupeRedundantFontBlocks(html) {
  const re =
    /(<div class="element paragraph[^"]*"[^>]*>[\s\S]*?<\/div>)\s*(<font[^>]*>[\s\S]*?<\/font>)/gi;
  return html.replace(re, (full, para, font) => {
    const pt = stripTags(para);
    const ft = stripTags(font);
    return textSimilar(pt, ft) ? para : full;
  });
}

function dedupeStrayMailtoAfterParagraph(html) {
  return html.replace(
    /(<div class="element paragraph[^"]*"[^>]*>[\s\S]*?<\/div>)\s*<a href="(mailto:[^"]+)"><font[^>]*>[\s\S]*?<\/font><\/a>/gi,
    (full, para, mailto) => (para.includes(mailto) ? para : full)
  );
}

function dedupeSimilarParagraphs(html) {
  const re =
    /(<div class="element paragraph[^"]*"[^>]*>[\s\S]*?<\/div>)(\s*<div class="element paragraph[^"]*"[^>]*>[\s\S]*?<\/div>)/gi;
  return html.replace(re, (full, first, second) => {
    return textSimilar(stripTags(first), stripTags(second)) ? first : full;
  });
}

function dedupeDuplicateContentTitles(html) {
  let out = html.replace(
    /(<h2 class="element wsite-content-title[^"]*"[^>]*>[\s\S]*?<\/h2>)\s*(<strong>[\s\S]*?<\/strong>)/gi,
    (full, h2, strong) => (textSimilar(stripTags(h2), stripTags(strong)) ? h2 : full)
  );
  out = out.replace(
    /(<h2 class="element wsite-content-title[^"]*"[^>]*>[\s\S]*?<\/h2>)\s*(<font[^>]*>[\s\S]*?<\/font>)/gi,
    (full, h2, font) => (textSimilar(stripTags(h2), stripTags(font)) ? h2 : full)
  );
  return out;
}

const MULTICOL_ELEMENT_RE =
  /<div class="element"[^>]*>[\s\S]*?<div class="wsite-multicol">[\s\S]*?<\/table>\s*<\/div>\s*<\/div>\s*<\/div>/gi;

/** Weebly export often repeats block HTML as bare siblings (e.g. about page). */
function dedupeOrphanDuplicateRuns(html) {
  const chunks = [];
  let last = 0;
  let m;
  MULTICOL_ELEMENT_RE.lastIndex = 0;
  while ((m = MULTICOL_ELEMENT_RE.exec(html)) !== null) {
    chunks.push(dedupeOrphanDuplicateRunsUnsafe(html.slice(last, m.index)));
    chunks.push(m[0]);
    last = MULTICOL_ELEMENT_RE.lastIndex;
  }
  chunks.push(dedupeOrphanDuplicateRunsUnsafe(html.slice(last)));
  return chunks.join("");
}

function dedupeOrphanDuplicateRunsUnsafe(html) {
  const blockRe =
    /<h2 class="element wsite-content-title[\s\S]*?<\/h2>|<div class="element (?:paragraph|wsite-spacer)[^>]*>[\s\S]*?<\/div>/gi;
  const pieces = [];
  let last = 0;
  let m;
  while ((m = blockRe.exec(html)) !== null) {
    if (m.index > last) {
      pieces.push({ kind: "orphan", text: html.slice(last, m.index) });
    }
    pieces.push({ kind: "block", text: m[0] });
    last = blockRe.lastIndex;
  }
  if (last < html.length) {
    pieces.push({ kind: "orphan", text: html.slice(last) });
  }

  const kept = [];
  for (const p of pieces) {
    if (p.kind === "orphan") {
      const hasMedia = /<(?:img|iframe)\b/i.test(p.text);
      const plain = stripTags(p.text).replace(/\s+/g, " ").trim();
      if (!plain && !hasMedia) continue;
      const prev = kept[kept.length - 1];
      if (
        !hasMedia &&
        prev &&
        plain &&
        textSimilar(stripTags(prev.text), plain)
      ) {
        continue;
      }
      kept.push(p);
      continue;
    }
    const prev = kept[kept.length - 1];
    if (prev?.kind === "block" && textSimilar(stripTags(prev.text), stripTags(p.text))) {
      continue;
    }
    kept.push(p);
  }
  return kept.map((p) => p.text).join("");
}

function removeStrayEmptyAnchors(html) {
  let out = html.replace(/<a>\s*<\/a>/gi, "");
  out = out.replace(/<a>\s*(?=<div class="element")/gi, "");
  out = out.replace(/<a>\s*(?=<h2 class="element wsite-content-title)/gi, "");
  return out;
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
