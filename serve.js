// Minimal static server for local review. Mirrors how the site is served in
// production: directory requests resolve to index.html, trailing slashes kept.
//   node serve.js        → http://localhost:4173
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PORT = process.env.PORT || 4173;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
};

http.createServer((req, res) => {
  let urlPath = decodeURIComponent(req.url.split('?')[0]);

  // Directory → index.html, matching Vercel's trailingSlash: true
  let filePath = path.join(ROOT, urlPath);
  if (urlPath.endsWith('/')) filePath = path.join(filePath, 'index.html');

  // Never serve the undisclosed roster or review previews locally either.
  if (/[\\/]_dark[\\/]|[\\/]_preview[\\/]/.test(filePath)) {
    res.writeHead(403).end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, st) => {
    if (!err && st.isDirectory()) filePath = path.join(filePath, 'index.html');

    fs.readFile(filePath, (err2, buf) => {
      if (err2) {
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(
          `<pre style="font:14px ui-monospace,monospace;padding:2rem;line-height:1.7">` +
          `404 &mdash; ${urlPath}\n\nThis is one of the 107 pages the audit flagged as not yet built.\n` +
          `Templates exist; content does not.\n\n` +
          `<a href="/en/">/en/</a>    <a href="/es/">/es/</a></pre>`
        );
        return;
      }
      res.writeHead(200, {
        'Content-Type': TYPES[path.extname(filePath)] || 'application/octet-stream',
        'X-Robots-Tag': 'noindex, nofollow',
      });
      res.end(buf);
    });
  });
}).listen(PORT, () => {
  console.log(`Comity serving on http://localhost:${PORT}`);
  console.log(`  English  http://localhost:${PORT}/en/`);
  console.log(`  Español  http://localhost:${PORT}/es/`);
});
