import { build } from 'esbuild';
import fs from 'node:fs';
import crypto from 'node:crypto';
const VERSION = '2.2.0', UPDATED = '2026-10-27';

// Textele volumelor, din ../carte/*.md; ghidul din ../ghid/
const P = '..';
const read = (f) => (fs.existsSync(`${P}/${f}`) ? fs.readFileSync(`${P}/${f}`, 'utf8') : null);
const volFile = (n) => { const d = `${P}/carte`; const f = fs.readdirSync(d).find((x) => x.startsWith(`0${n}-`)); return f ? `carte/${f}` : null; };
const defs = [
  { n: 1, title: 'Arhivista' }, { n: 2, title: 'Patru voci' }, { n: 3, title: 'Cinci faze' },
  { n: 4, title: 'Arhivele' }, { n: 5, title: 'Fanarele' }, { n: 6, title: 'Cele douăzeci de pendule' },
  { n: 7, title: 'Cel din toate pendulele' }, { n: 8, title: 'Cei care nu vorbesc' }, { n: 9, title: 'Cel care ajustează orbita' },
];
const texts = [];
for (const d of defs) {
  const f = volFile(d.n);
  const md = f ? read(f) : null;
  if (md) texts.push({ n: d.n, title: d.title, md });
}
const ghid = read('ghid/ghidul-cititorului.md');
if (ghid) texts.push({ n: 0, title: 'Ghidul cititorului', md: ghid });
import zlib from 'node:zlib';
const pack = zlib.gzipSync(Buffer.from(JSON.stringify(texts), 'utf8'), { level: 9 }).toString('base64');
fs.writeFileSync('src/texts.js', `const TEXTS = [];
export default TEXTS;
const PACK = '${pack}';
export async function loadTexts() {
  if (TEXTS.length) return TEXTS;
  const bin = Uint8Array.from(atob(PACK), (c) => c.charCodeAt(0));
  const stream = new Blob([bin]).stream().pipeThrough(new DecompressionStream('gzip'));
  const txt = await new Response(stream).text();
  TEXTS.push(...JSON.parse(txt));
  return TEXTS;
}
`);
console.log('volume în cititor:', texts.map((t) => `${t.n}(${Math.round(t.md.length / 1000)}k)`).join(' '));

const out = await build({
  entryPoints: ['src/main.js'], bundle: true, minify: true, format: 'iife', target: 'es2020', write: false, legalComments: 'eof',
});
let js = out.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
const tpl = fs.readFileSync('src/template.html', 'utf8');
const fragment = tpl.replace('/*__BUNDLE__*/', () => js);

const m = /^([\s\S]*?<\/style>)([\s\S]*)$/.exec(fragment);
const headPart = m ? m[1].replace(/<meta name="claude:[^>]*>\n?/, '') : '';
const bodyPart = m ? m[2] : fragment;
const FAV = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='12' fill='%2304060b'/%3E%3Ccircle cx='32' cy='14' r='7' fill='%23e8c25a'/%3E%3Cline x1='32' y1='20' x2='32' y2='44' stroke='%23ece7da' stroke-width='2'/%3E%3Ccircle cx='32' cy='48' r='6' fill='%23c8553d'/%3E%3C/svg%3E";
const full0 = '<!doctype html>\n<html lang="ro">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n<meta name="description" content="Pendulul: simulare 3D a unei planete care oscilează între trei stele și o gaură neagră, cu textele complete ale seriei de 9 volume. Funcționează offline, într-un singur fișier.">\n<meta name="theme-color" content="#04060b">\n<meta name="application-version" content="' + VERSION + '">\n<meta name="last-updated" content="' + UPDATED + '">\n<!--CSP-->\n<meta name="author" content="Alexio">\n<meta property="og:title" content="Pendulul 3D">\n<meta property="og:description" content="Simulare 3D și cititor pentru seria SF Pendulul (9 volume).">\n<meta property="og:type" content="website">\n<link rel="icon" href="' + FAV + '">\n' + headPart + '\n</head>\n<body>\n<noscript>Pendulul 3D are nevoie de JavaScript. Textele seriei sunt disponibile în ediția EPUB/PDF.</noscript>\n<!-- Pendulul — © Alexio, 2026. Text și cod: MIT. Include three.js (MIT, © 2010-2023 three.js authors); nota completă la sfârșitul scriptului și în NOTICE. -->\n' + bodyPart + '\n' + fs.readFileSync('src/donate.html', 'utf8') + '</body>\n</html>\n';
// CSP: scripturile inline doar pe bază de hash; fără rețea, fără cod terț (three.js e inclus în pachet)
const hashes = [...full0.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map((m) => `'sha256-${crypto.createHash('sha256').update(m[1]).digest('base64')}'`);
const CSP = `default-src 'none'; script-src ${hashes.join(' ')}; style-src 'unsafe-inline'; img-src data: blob:; connect-src 'self'; base-uri 'none'; form-action 'none'`;
const full = full0.replace('<!--CSP-->', `<meta http-equiv="Content-Security-Policy" content="${CSP}">`);
fs.mkdirSync('../dist', { recursive: true }); fs.mkdirSync('../docs', { recursive: true });
fs.writeFileSync('../dist/pendulul-3d.html', full);
// Varianta găzduită (docs/) are în plus un link către pagina de prezentare (docs/prezentare.html); fișierul autonom din dist/ nu îl are (link relativ ar fi rupt).
const LINK = '<div><a class="btn" id="aboutBook" href="prezentare.html">Pagina cărții: copertă, sinopsis, capitol gratuit</a></div>';
const MARK = '<button class="btn mini" id="panelClose" aria-label="Închide">Închide</button></div>';
if (!full.includes(MARK)) throw new Error('marcajul panoului lipsește');
fs.writeFileSync('../docs/index.html', full.replace(MARK, MARK + LINK));
console.log('bundle KB', (js.length / 1024).toFixed(0), 'full KB', (full.length / 1024).toFixed(0));
