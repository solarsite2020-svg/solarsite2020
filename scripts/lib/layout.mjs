export function renderPage({ config, navItems, pageTitle, bodyHtml, currentSlug }) {
  const base = config.basePath.endsWith("/") ? config.basePath : `${config.basePath}/`;
  const cssHref = `${base}assets/css/site.css`;
  const homeHref = base;
  const contactHref = `${base}contact/`;

  const navLinks = navItems
    .map((item) => {
      const active = item.slug === currentSlug ? ' class="active"' : "";
      return `<a href="${item.href}"${active}>${escapeHtml(item.name)}</a>`;
    })
    .join("\n          ");

  return `<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(pageTitle)} — ${escapeHtml(config.siteTitle)}</title>
  <meta name="description" content="${escapeHtml(config.siteTitleEn)}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="${cssHref}">
</head>
<body>
  <header class="site-header">
    <div class="header-inner">
      <a class="site-title" href="${homeHref}">${escapeHtml(config.siteTitle)}</a>
      <button type="button" class="nav-toggle" aria-expanded="false" aria-controls="site-nav">選單</button>
      <nav id="site-nav" class="site-nav" aria-label="主選單">
        <a href="${homeHref}">首頁</a>
        ${navLinks}
        <a href="${contactHref}">Contact</a>
      </nav>
    </div>
  </header>
  <main class="site-main weebly-content">
    ${bodyHtml}
  </main>
  <footer class="site-footer">
    <p>${escapeHtml(config.contact.addressZh)}</p>
    <p>${escapeHtml(config.contact.addressEn)}</p>
    <p>TEL: ${escapeHtml(config.contact.tel)} &nbsp; FAX: ${escapeHtml(config.contact.fax)}</p>
    <p><a href="mailto:${escapeHtml(config.contact.email)}">${escapeHtml(config.contact.email)}</a></p>
    <p><a href="${escapeHtml(config.facebookUrl)}" target="_blank" rel="noopener">Facebook</a></p>
  </footer>
  <script>
    document.querySelector('.nav-toggle')?.addEventListener('click', function () {
      var nav = document.getElementById('site-nav');
      var open = nav.classList.toggle('open');
      this.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
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
