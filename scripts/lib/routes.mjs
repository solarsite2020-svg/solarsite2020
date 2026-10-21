/**
 * slug ↔ site path ↔ pageId routing for static export.
 */

const SLUG_TO_SEGMENT = {
  "01-home-frontpage": "",
  "02-2016-shuwei-huacheng": "works/2016-shuwei-huacheng",
  "03-news": "news",
  "04-about": "about",
  "05-partners": "partners",
  "06-works": "works",
  "07-works-2024": "works/2024",
  "08-works-2023": "works/2023",
  "09-works-2022": "works/2022",
  "10-works-2021": "works/2021",
  "11-works-2020": "works/2020",
  "12-works-2019": "works/2019",
  "13-works-2018": "works/2018",
  "14-works-2017": "works/2017",
  "15-works-2016": "works/2016",
  "16-works-2015": "works/2015",
  "17-works-2014": "works/2014",
  "18-works-2013": "works/2013",
  "19-works-2012": "works/2012",
  "20-works-2011": "works/2011",
  "21-works-2010": "works/2010",
  "22-works-2009": "works/2009",
  "23-reviews": "reviews",
  "24-contact": "contact",
};

export function slugToSegment(slug) {
  const seg = SLUG_TO_SEGMENT[slug];
  if (seg === undefined) throw new Error(`Unknown slug: ${slug}`);
  return seg;
}

/** Relative path from docs root, e.g. `news/index.html` or `index.html` */
export function slugToOutFile(slug) {
  const seg = slugToSegment(slug);
  return seg === "" ? "index.html" : `${seg}/index.html`;
}

/** URL path with trailing slash (except home) */
export function slugToUrlPath(slug, basePath) {
  const base = basePath.endsWith("/") ? basePath : `${basePath}/`;
  const seg = slugToSegment(slug);
  if (seg === "") return base;
  return `${base}${seg}/`;
}

export function buildPageIdMap(manifestPages, extraPages = []) {
  const byId = new Map();
  for (const p of manifestPages) {
    if (p.pageId) byId.set(String(p.pageId), p.slug);
  }
  for (const p of extraPages) {
    if (p.pageId && p.slug) byId.set(String(p.pageId), p.slug);
  }
  return byId;
}

export function getNavItems(manifestPages, basePath) {
  const base = basePath.endsWith("/") ? basePath : `${basePath}/`;
  return manifestPages
    .filter((p) => !p.hiddenInNav && p.slug !== "01-home-frontpage")
    .map((p) => ({
      name: p.name,
      slug: p.slug,
      href: slugToUrlPath(p.slug, base),
    }));
}

export function allManifestSlugs(manifestPages) {
  return manifestPages.map((p) => p.slug);
}
