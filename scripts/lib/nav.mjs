import fs from "node:fs";
import path from "node:path";

import { slugToUrlPath } from "./routes.mjs";

export function readSiteNav(repoRoot) {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, "site", "nav.json"), "utf8"));
}

export function isNavActive(item, currentSlug) {
  if (item.slug === currentSlug) return true;
  return (item.children || []).some((c) => c.slug === currentSlug);
}

export function renderWeeblyNav(nav, basePath, currentSlug) {
  const items = nav.items
    .map((item) => {
      const active = isNavActive(item, currentSlug);
      const href = slugToUrlPath(item.slug, basePath);
      if (item.children?.length) {
        const sub = item.children
          .map((c) => {
            const subActive = c.slug === currentSlug ? " wsite-nav-current" : "";
            return `<li class="wsite-menu-subitem-wrap"><a href="${slugToUrlPath(c.slug, basePath)}" class="wsite-menu-subitem${subActive}">${escapeHtml(c.label)}</a></li>`;
          })
          .join("");
        return `<li class="wsite-menu-item-wrap has-submenu${active ? " wsite-nav-current" : ""}">
          <a href="${href}" class="wsite-menu-item">${escapeHtml(item.label)}</a>
          <ul class="wsite-menu-subitem-wrap wsite-menu-subitem">${sub}</ul>
        </li>`;
      }
      return `<li class="wsite-menu-item-wrap${active ? " wsite-nav-current" : ""}"><a href="${href}" class="wsite-menu-item">${escapeHtml(item.label)}</a></li>`;
    })
    .join("\n");

  const footer = (nav.footer || [])
    .map(
      (f) =>
        `<a class="footer-nav-link" href="${slugToUrlPath(f.slug, basePath)}">${escapeHtml(f.label)}</a>`
    )
    .join(" · ");

  return { menuHtml: items, footerLinks: footer };
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
