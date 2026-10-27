// Pendulul 2.2.0 — linkul „Pagina cărții” din simularea găzduită (docs/index.html) și cache-ul offline al paginii de prezentare.
// Rulare: node tests/prezentare-link.test.mjs   (Playwright, Chromium; server local pe 127.0.0.1, orice altă rețea blocată)
import {createRequire} from 'module';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const require = createRequire(process.env.PW_ROOT || import.meta.url);
const {chromium} = require('playwright');
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
let pass = 0, fail = 0;
const ok = (c, n, i) => { if (c) { pass++; console.log('  ok   ' + n); } else { fail++; console.log('  FAIL ' + n + (i === undefined ? '' : ' ' + JSON.stringify(i).slice(0, 300))); } };
const MIME = {'.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.webmanifest': 'application/manifest+json', '.png': 'image/png'};
const srv = http.createServer((q, r) => {
  const p = path.join(ROOT, 'docs', decodeURIComponent(q.url.split('?')[0]).replace(/^\/+$/, '/index.html'));
  if (!p.startsWith(path.join(ROOT, 'docs')) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { r.writeHead(404); r.end(); return; }
  r.writeHead(200, {'content-type': MIME[path.extname(p)] || 'application/octet-stream'}); r.end(fs.readFileSync(p));
}).listen(0, '127.0.0.1');
await new Promise(r => srv.on('listening', r));
const base = 'http://127.0.0.1:' + srv.address().port + '/';
const browser = await chromium.launch({executablePath: process.env.CHROMIUM_PATH || process.env.CHROME || undefined, args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader']});
const ctx = await browser.newContext({viewport: {width: 1280, height: 800}, locale: 'ro-RO'});
const ext = []; await ctx.route(/^https?:/, r => { if (r.request().url().startsWith(base)) r.continue(); else { ext.push(r.request().url()); r.abort(); } });
const page = await ctx.newPage(), errs = [];
page.on('pageerror', e => errs.push(e.message));
page.on('console', m => { if (/Content Security Policy|Refused to/i.test(m.text())) errs.push(m.text()); });
await page.goto(base, {waitUntil: 'domcontentloaded', timeout: 90000}); await page.waitForTimeout(2500);
ok(await page.locator('#aboutBook').count() === 1, 'linkul „Pagina cărții” există în docs/index.html');
ok(await page.getAttribute('#aboutBook', 'href') === 'prezentare.html', 'link relativ către prezentare.html');
ok(!/aboutBook/.test(fs.readFileSync(path.join(ROOT, 'dist', 'pendulul-3d.html'), 'utf8')), 'fișierul autonom dist/ nu are link rupt');
await page.evaluate(() => document.getElementById('btnPanel').click()); await page.waitForTimeout(600);
ok(await page.evaluate(() => { const a = document.getElementById('aboutBook'), r = a.getBoundingClientRect(); return r.width > 0 && r.height > 0 && !!a.closest('#panel'); }), 'linkul e în panoul „Straturi și opțiuni” și are dimensiune');
await Promise.all([page.waitForURL(/prezentare\.html$/, {timeout: 60000}), page.evaluate(() => document.getElementById('aboutBook').click())]); await page.waitForLoadState('domcontentloaded'); await page.waitForTimeout(500);
ok(/prezentare\.html$/.test(page.url()) && (await page.title()).length > 0, 'se deschide pagina de prezentare', page.url());
ok(await page.locator('img').count() >= 1, 'pagina de prezentare are coperta');
// service worker: pagina de prezentare e în cache pentru offline
await page.goto(base, {waitUntil: 'domcontentloaded', timeout: 90000}); await page.waitForTimeout(2500);
const cached = await page.evaluate(async () => { try { await navigator.serviceWorker.ready; const ks = await caches.keys(); const out = []; for (const k of ks) { const c = await caches.open(k); out.push(...(await c.keys()).map(r => new URL(r.url).pathname)); } return out; } catch (e) { return String(e); } });
ok(Array.isArray(cached) && cached.includes('/prezentare.html'), 'prezentare.html în cache-ul PWA', cached);
ok(ext.length === 0, 'nicio cerere externă', ext);
ok(errs.length === 0, 'fără erori JS/CSP', errs);
await browser.close(); srv.close();
console.log(`\nprezentare-link: ${pass} reușite, ${fail} eșuate`); process.exit(fail ? 1 : 0);
