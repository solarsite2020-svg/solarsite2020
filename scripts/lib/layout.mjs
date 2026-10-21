import { renderWeeblyNav } from "./nav.mjs";
import { uploadPublicUrl } from "./home.mjs";
const THEME_CSS = [
  "open-sans-font.css",
  "main.css",
  "sites.css",
  "social-icons.css",
  "slideshow.css",
];

export function renderPage({ config, nav, home, worksLanding, pageTitle, bodyHtml, currentSlug }) {
  const base = config.basePath.endsWith("/") ? config.basePath : `${config.basePath}/`;
  const themeBase = `${base}assets/weebly/`;
  const overridesHref = `${base}assets/css/weebly-overrides.css`;
  const homeHref = base;

  const { menuHtml, footerLinks } = renderWeeblyNav(nav, config.basePath, currentSlug);
  const isHome = currentSlug === "01-home-frontpage";
  const landing =
    worksLanding?.slug === currentSlug && worksLanding?.heroBackground ? worksLanding : null;
  const isWorksLanding = !!landing;

  const headerLogoFile = home?.headerLogo;
  const headerLogoUrl = headerLogoFile ? uploadPublicUrl(config, headerLogoFile) : null;
  const logoAlt = escapeHtml(config.siteTitleEn || config.siteTitle);

  const logoBlock = headerLogoUrl
    ? `<a href="${homeHref}" class="site-logo-link"><img class="site-header-logo" src="${headerLogoUrl}" alt="${logoAlt}"></a>`
    : `<a class="site-title-link" href="${homeHref}">${escapeHtml(config.siteTitle)}</a>`;

  const bodyClass = isHome
    ? "page-home"
    : isWorksLanding
      ? "page-inner page-works-landing"
      : "page-inner";
  const htmlClass = isHome ? "" : "wsite-theme-dark";

  let mainWrapClass = "";
  let mainWrapStyle = "";
  if (isHome && home?.heroBackground) {
    const heroUrl = uploadPublicUrl(config, home.heroBackground);
    mainWrapClass = "home-hero";
    mainWrapStyle = ` style="--home-hero-bg: url('${heroUrl}')"`;
  } else if (isWorksLanding) {
    const heroUrl = uploadPublicUrl(config, landing.heroBackground);
    const darken = landing.heroDarken ?? 0.3;
    mainWrapClass = "works-hero";
    mainWrapStyle =
      ` style="--works-hero-bg: url('${heroUrl}');--works-hero-darken: ${darken};` +
      `background-image: url('${heroUrl}');"`;
  }

  const themeLinks = THEME_CSS
    .map((f) => `<link rel="stylesheet" href="${themeBase}${f}">`)
    .join("\n  ");

  const footerBlock = isHome
    ? ""
    : `<div id="footer">
      ${footerLinks}
    </div>`;

  return `<!DOCTYPE html>
<html lang="zh-Hant"${isHome ? ' class="page-home-html"' : htmlClass ? ` class="${htmlClass}"` : ""}>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(pageTitle)} — ${escapeHtml(config.siteTitle)}</title>
  <meta name="description" content="${escapeHtml(config.siteTitleEn)}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;600&display=swap" rel="stylesheet">
  ${themeLinks}
  <link rel="stylesheet" href="${overridesHref}">
</head>
<body class="${bodyClass}">
  <div id="wrapper">
    <div id="header-wrap">
      <div class="header-inner">
        <div id="logo">
          ${logoBlock}
        </div>
        <button type="button" class="nav-toggle" aria-expanded="false" aria-controls="navigation">選單</button>
        <div id="navigation" class="collapsed" aria-label="主選單">
          <ul class="wsite-menu-default">
            ${menuHtml}
          </ul>
        </div>
      </div>
    </div>
    <div id="main-wrap" class="${mainWrapClass}"${mainWrapStyle}>
      <div id="wsite-content" class="wsite-elements weebly-content">
        ${bodyHtml}
      </div>
    </div>
    ${footerBlock}
  </div>
  <script>
    (function () {
      var btn = document.querySelector('.nav-toggle');
      var nav = document.getElementById('navigation');
      if (!btn || !nav) return;
      btn.addEventListener('click', function () {
        var open = nav.classList.toggle('open');
        nav.classList.toggle('collapsed', !open);
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    })();
  </script>
</body>
</html>`;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
