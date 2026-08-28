// Appends a content hash to asset URLs so a phone or CDN cannot serve a stale
// stylesheet or script after a deploy. Run from build.sh after assembly.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const assets = fs.readdirSync('assets').filter(f => /\.(css|js)$/.test(f)).sort();
const hash = crypto
  .createHash('sha1')
  .update(assets.map(f => fs.readFileSync(path.join('assets', f))).join(''))
  .digest('hex')
  .slice(0, 8);

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const f = path.join(dir, e.name);
    if (e.isDirectory()) walk(f, out);
    else if (e.name.endsWith('.html')) out.push(f);
  }
  return out;
}

const files = [...walk('en'), ...walk('es')];
if (fs.existsSync('index.html')) files.push('index.html');

let touched = 0;
for (const f of files) {
  const before = fs.readFileSync(f, 'utf8');
  const after = before.replace(
    /(["'])(\/assets\/[a-z0-9._-]+\.(?:css|js))(\?v=[a-f0-9]+)?\1/gi,
    (_m, q, p) => `${q}${p}?v=${hash}${q}`
  );
  if (after !== before) { fs.writeFileSync(f, after); touched++; }
}
console.log(`  asset version ${hash} applied to ${touched} files`);
