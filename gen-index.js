// Generates the site index for each locale by walking the built tree.
// Titles, descriptions and draft state are read from the pages themselves, so
// the index cannot drift from what actually exists. Run from build.sh.
const fs = require('fs');
const path = require('path');

const SITE = process.env.SITE_URL || 'https://example.com';

// Ordered categories. First matching prefix wins, so specific paths precede
// their parents.
const CATS = {
  en: [
    ['journeys',      'Cross-border journeys', 'Start from where you are going.',
      p => /^en\/argentina-new-york\/(investing|entering|operating)/.test(p)],
    ['jurisdictions', 'Jurisdictions', 'What we are admitted to do, and what we are not.',
      p => /^en\/argentina-new-york\/(argentina|united-states)/.test(p)],
    ['corridor',      'Argentina × New York', 'The thesis the firm is built on.',
      p => p.startsWith('en/argentina-new-york/')],
    ['capabilities',  'Capabilities', 'Legal counsel and strategic advisory, held apart.',
      p => p.startsWith('en/capabilities/')],
    ['industries',    'Industries', 'Where the corridor is busiest.',
      p => p.startsWith('en/industries/')],
    ['insights',      'Insights', 'The publication: desks, analysis and taxonomy.',
      p => p.startsWith('en/insights/')],
    ['utility',       'Utility', 'Search and crawl files.',
      p => p.startsWith('en/search/')],
    ['home',          'Home', 'The front page.', p => p === 'en/'],
  ],
  es: [
    ['journeys',      'Recorridos transfronterizos', 'Empiece por dónde va.',
      p => /^es\/argentina-nueva-york\/(invertir|ingresar|operar)/.test(p)],
    ['jurisdictions', 'Jurisdicciones', 'Dónde estamos habilitados, y dónde no.',
      p => /^es\/argentina-nueva-york\/(argentina|estados-unidos)/.test(p)],
    ['corridor',      'Argentina × Nueva York', 'La tesis sobre la que se construye la firma.',
      p => p.startsWith('es/argentina-nueva-york/')],
    ['capabilities',  'Servicios', 'Asesoramiento legal y estratégico, separados.',
      p => p.startsWith('es/servicios/')],
    ['industries',    'Industrias', 'Donde el corredor tiene más tránsito.',
      p => p.startsWith('es/industrias/')],
    ['insights',      'Perspectivas', 'La publicación: secciones, análisis y taxonomía.',
      p => p.startsWith('es/perspectivas/')],
    ['home',          'Portada', 'La página principal.', p => p === 'es/'],
  ],
};

const COPY = {
  en: {
    slug: 'en/site-index/', kicker: 'Site index',
    h1: 'Everything that exists',
    stand: 'Every page currently built, by category. Generated from the site itself at build time, so it cannot drift from what is actually here.',
    counts: (n, d) => `${n} pages built · ${d} carry pre-review content`,
    draft: 'Draft content', complete: 'Complete',
    other: 'Other language', missing: 'Not yet built',
    note: 'Links elsewhere on the site point to roughly a hundred further pages that are architected but not written. Those return 404 until their content exists — every template is finished; the content entry is not.',
    crawl: 'Crawl files',
  },
  es: {
    slug: 'es/indice/', kicker: 'Índice del sitio',
    h1: 'Todo lo que existe',
    stand: 'Todas las páginas construidas hasta ahora, por categoría. Se genera desde el propio sitio al compilar, de modo que no puede desactualizarse.',
    counts: (n, d) => `${n} páginas construidas · ${d} con contenido previo a revisión`,
    draft: 'Contenido en borrador', complete: 'Completa',
    other: 'Otro idioma', missing: 'Aún no construida',
    note: 'Otros enlaces del sitio apuntan a alrededor de cien páginas más que están arquitecturadas pero no escritas. Devuelven 404 hasta que exista su contenido: las plantillas están terminadas; la carga de contenido no.',
    crawl: 'Archivos de rastreo',
  },
};

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const f = path.join(dir, e.name);
    if (e.isDirectory()) walk(f, out);
    else if (e.name === 'index.html') out.push(f.replace(/\\/g, '/'));
  }
  return out;
}

function meta(file) {
  const s = fs.readFileSync(file, 'utf8');
  const t = s.match(/<title>([^<]*)<\/title>/);
  const d = s.match(/name="description" content="([^"]*)"/);
  const alt = s.match(/hreflang="(en|es)" href="[^"]*"/g) || [];
  return {
    title: (t ? t[1] : '').replace(/\s*—\s*Calamity Comity.*$/, '').replace(/^Calamity Comity\s*—\s*/, ''),
    desc: d ? d[1] : '',
    draft: /data-state="draft"/.test(s),
    bilingual: alt.length >= 2,
  };
}

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function build(loc) {
  const c = COPY[loc];
  const pages = walk(loc)
    .map(f => ({ url: '/' + f.replace(/index\.html$/, ''), file: f, ...meta(f) }))
    .filter(p => !p.url.includes('/site-index/') && !p.url.includes('/indice/'));

  const groups = new Map();
  for (const [key, label, blurb, test] of CATS[loc]) groups.set(key, { label, blurb, items: [] });
  for (const p of pages) {
    const hit = CATS[loc].find(([, , , t]) => t(p.url.replace(/^\//, '')));
    if (hit) groups.get(hit[0]).items.push(p);
  }

  const draftCount = pages.filter(p => p.draft).length;
  const order = ['home', 'corridor', 'jurisdictions', 'journeys', 'capabilities', 'industries', 'insights', 'utility'];

  let body = '';
  for (const key of order) {
    const g = groups.get(key);
    if (!g || !g.items.length) continue;
    g.items.sort((a, b) => a.url.localeCompare(b.url));
    body += `
<section class="cap-section">
  <div class="shell">
    <div class="section-head">
      <h2>${esc(g.label)}</h2>
      <span class="cadence">${g.items.length}</span>
    </div>
    <p class="lede" style="margin-bottom:24px;max-width:60ch">${esc(g.blurb)}</p>
    <ul class="caplist">
${g.items.map(p => `      <li><a href="${p.url}">
        <span class="cap-name">${esc(p.title)}</span>
        <span>
          <span class="cap-desc">${esc(p.desc)}</span>
          <span class="idx-meta">
            <span class="idx-url">${p.url}</span>
            <span class="${p.draft ? 'idx-draft' : 'idx-ok'}">${p.draft ? c.draft : c.complete}</span>
            ${p.bilingual ? `<span>EN · ES</span>` : `<span class="idx-draft">${loc.toUpperCase()} only</span>`}
          </span>
        </span>
      </a></li>`).join('\n')}
    </ul>
  </div>
</section>`;
  }

  body += `
<section class="cap-section">
  <div class="shell">
    <div class="section-head"><h2>${esc(c.crawl)}</h2></div>
    <ul class="caplist">
      <li><a href="/sitemap.xml"><span class="cap-name">sitemap.xml</span><span class="cap-desc">/sitemap.xml</span></a></li>
      <li><a href="/sitemap-en.xml"><span class="cap-name">sitemap-en.xml</span><span class="cap-desc">/sitemap-en.xml</span></a></li>
      <li><a href="/sitemap-es.xml"><span class="cap-name">sitemap-es.xml</span><span class="cap-desc">/sitemap-es.xml</span></a></li>
      <li><a href="/robots.txt"><span class="cap-name">robots.txt</span><span class="cap-desc">/robots.txt</span></a></li>
    </ul>
    <div class="note" style="margin-top:40px"><p>${esc(c.note)}</p></div>
  </div>
</section>`;

  const other = loc === 'en' ? COPY.es : COPY.en;
  const html = `<!doctype html>
<html lang="${loc}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(c.h1)} — Calamity Comity</title>
<meta name="description" content="${esc(c.stand)}">
<meta name="robots" content="noindex, follow">
<link rel="canonical" href="${SITE}/${c.slug}">
<link rel="alternate" hreflang="${loc}" href="${SITE}/${c.slug}">
<link rel="alternate" hreflang="${loc === 'en' ? 'es' : 'en'}" href="${SITE}/${other.slug}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:ital,wght@0,400;0,500;0,600;1,400&family=Bodoni+Moda:ital,opsz,wght@0,6..96,400;0,6..96,500;0,6..96,600;1,6..96,400&family=IBM+Plex+Mono:wght@400;500&display=swap">
<link rel="stylesheet" href="/assets/styles.css">
<link rel="stylesheet" href="/assets/capabilities.css">
<link rel="stylesheet" href="/assets/insights.css">
<style>
.idx-meta { display: flex; flex-wrap: wrap; gap: 4px 16px; margin-top: 8px;
  font-family: var(--mono); font-size: .6rem; letter-spacing: .1em; text-transform: uppercase; }
.idx-url { color: var(--mute); }
.idx-ok { color: var(--ok); }
.idx-draft { color: var(--warn); }
.caplist a { align-items: start; }
</style>
</head>
<body>
${fs.readFileSync(`partials/masthead-${loc}.html`, 'utf8')}
<main id="main">
<section class="cap-head">
  <div class="shell">
    <p class="cap-kicker"><span class="kind">${esc(c.kicker)}</span></p>
    <h1>${esc(c.h1)}</h1>
    <p class="cap-stand">${esc(c.stand)}</p>
    <p class="micro" style="margin-top:24px">${esc(c.counts(pages.length, draftCount))}</p>
  </div>
</section>
${body}
</main>
${fs.readFileSync(`partials/footer-${loc}.html`, 'utf8')}
<script src="/assets/main.js" defer></script>
</body>
</html>
`;

  fs.mkdirSync(c.slug, { recursive: true });
  fs.writeFileSync(path.join(c.slug, 'index.html'), html);
  console.log(`  ${(c.slug + 'index.html').padEnd(58)} ${pages.length} pages, ${draftCount} draft`);
}

build('en');
build('es');
