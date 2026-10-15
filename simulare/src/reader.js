// Cititorul: textele complete ale volumelor, în aplicație.
import TEXTS, { loadTexts } from './texts.js';

const $ = (id) => document.getElementById(id);
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const inline = (s) => esc(s)
  .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
  .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<i>$2</i>')
  .replace(/`([^`]+)`/g, '<code>$1</code>');

function parse(md) {
  const lines = md.replace(/\r/g, '').split('\n');
  const out = [];
  const toc = [];
  let para = [];
  let list = null;
  let tbl = null;
  let hid = 0;
  let appLv = 0; // nivelul titlului de aparat al autorului în curs (0 = nu suntem în aparat)
  const APP = /fapte noi introduse|fire deschise|fi[șş]a volumului|note(le)? (de )?autor/i;
  const push = (h) => out.push(appLv ? `<div class="rdapp">${h}</div>` : h);
  const flush = () => {
    if (para.length) { push(`<p>${para.map(inline).join('<br>')}</p>`); para = []; }
    if (list) { push(`<${list.t}>${list.items.map((x) => `<li>${inline(x)}</li>`).join('')}</${list.t}>`); list = null; }
    if (tbl) {
      const rows = tbl.filter((r) => !/^[\s|:-]+$/.test(r)).map((r) => r.replace(/^\||\|$/g, '').split('|').map((c) => c.trim()));
      push('<div class="rdtbl"><table>' + rows.map((r, i) => `<tr>${r.map((c) => `<${i ? 'td' : 'th'}>${inline(c)}</${i ? 'td' : 'th'}>`).join('')}</tr>`).join('') + '</table></div>');
      tbl = null;
    }
  };
  for (const raw of lines) {
    const line = raw.replace(/\s+$/, '');
    let m;
    if (!line.trim()) { flush(); continue; }
    if (line.trim().startsWith('|')) { if (!tbl) { flush(); tbl = []; } tbl.push(line.trim()); continue; }
    if (tbl) flush();
    if ((m = /^(#{1,6})\s+(.*)$/.exec(line))) {
      flush();
      const lv = m[1].length;
      if (appLv && lv <= appLv) appLv = 0;
      if (!appLv && APP.test(m[2])) appLv = lv;
      const id = 'h' + (hid++);
      push(`<h${Math.min(lv + 1, 6)} id="${id}" class="l${lv}">${inline(m[2])}</h${Math.min(lv + 1, 6)}>`);
      if (lv <= 3) toc.push({ id, lv, app: !!appLv, text: m[2].replace(/[*`]/g, '') });
      continue;
    }
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) { flush(); push('<hr>'); continue; }
    if ((m = /^\s*[-*]\s+(.*)$/.exec(line))) { if (!list || list.t !== 'ul') { flush(); list = { t: 'ul', items: [] }; } list.items.push(m[1]); continue; }
    if ((m = /^\s*\d+\.\s+(.*)$/.exec(line))) { if (!list || list.t !== 'ol') { flush(); list = { t: 'ol', items: [] }; } list.items.push(m[1]); continue; }
    if (list) flush();
    para.push(line);
  }
  flush();
  return { html: out.join('\n'), toc };
}

let api = null;
const cache = new Map();
let cur = 0;
let opener = null; // elementul care a deschis cititorul, ca să-i redăm focusul la închidere

function get(i) {
  if (!cache.has(i)) cache.set(i, parse(TEXTS[i].md));
  return cache.get(i);
}
const store = {
  get(k, d) { try { const v = localStorage.getItem('pendulul.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('pendulul.' + k, JSON.stringify(v)); } catch (e) { /* fără stocare */ } },
};

function pendFromText(t) {
  const m = /Pendulul(?:urile)?\s+(\d{1,2})/i.exec(t);
  return m ? +m[1] : 0;
}

const vkey = (i) => (TEXTS[i] ? TEXTS[i].n : i);
function savePos() {
  const sc = $('rdScroll');
  if (!sc || $('reader').hidden) return;
  const h = sc.scrollHeight;
  if (h > 0) store.set('rp' + vkey(cur), +(sc.scrollTop / h).toFixed(5));
}
function open(vi = cur, anchor, ord) {
  if (!TEXTS.length) return;
  if (!Number.isFinite(+vi)) vi = cur;
  if ($('reader').hidden) opener = document.activeElement;
  else savePos();
  cur = Math.max(0, Math.min(TEXTS.length - 1, vi));
  const t = TEXTS[cur];
  const { html, toc } = get(cur);
  $('rdTabs').querySelectorAll('button').forEach((b) => b.classList.toggle('on', +b.dataset.i === cur));
  $('rdTitle').textContent = t.n ? `Volumul ${t.n} · ${t.title}` : t.title;
  $('rdBody').innerHTML = html;
  applyApp();
  $('rdToc').innerHTML = toc.map((e) => `<a href="#${e.id}" data-id="${e.id}" class="t${e.lv}${e.app ? ' rdapp' : ''}">${esc(e.text)}</a>`).join('');
  $('rdMap').hidden = !t.n || !api.hasMap(t.n);
  $('reader').hidden = false;
  document.body.classList.add('reading');
  const sc = $('rdScroll');
  sc.scrollTop = 0;
  decorate();
  const posOf = (el) => el.getBoundingClientRect().top - sc.getBoundingClientRect().top + sc.scrollTop;
  const saved = +store.get('rp' + vkey(cur), 0);
  const target = Number.isFinite(ord) ? $('rdBody').querySelectorAll('p,li')[ord] : null;
  if (target) {
    sc.scrollTop = Math.max(0, posOf(target) - 80);
    target.classList.add('rdflash');
    setTimeout(() => target.classList.remove('rdflash'), 2600);
  } else if (anchor) { const el = document.getElementById(anchor); if (el) sc.scrollTop = Math.max(0, posOf(el) - 12); }
  else if (saved > 0 && saved < 1) sc.scrollTop = saved * sc.scrollHeight;
  progress();
  try { sc.focus({ preventScroll: true }); } catch (e) { /* fără focus */ }
}
function decorate() {
  // buton „Vezi în simulare” la titlurile care numesc un pendul
  $('rdBody').querySelectorAll('h2,h3,h4').forEach((h) => {
    const n = pendFromText(h.textContent);
    if (n >= 1 && n <= 28 && !h.querySelector('.rdgo')) {
      const b = document.createElement('button');
      b.className = 'rdgo'; b.type = 'button'; b.textContent = `Vezi P${n} în simulare`;
      b.addEventListener('click', () => { close(); api.gotoPend(n, 0); });
      h.appendChild(b);
    }
  });
}
function progress() {
  const sc = $('rdScroll');
  const max = sc.scrollHeight - sc.clientHeight;
  $('rdBar').style.width = (max > 0 ? Math.min(100, (sc.scrollTop / max) * 100) : 0) + '%';
}
function close() {
  if ($('reader').hidden) return;
  savePos();
  store.set('last', cur);
  $('reader').hidden = true;
  $('reader').classList.remove('tocopen');
  $('rdHits').hidden = true;
  document.body.classList.remove('reading');
  const back = opener && document.contains(opener) && !opener.hidden ? opener : $('btnRead');
  opener = null;
  try { if (back) back.focus(); } catch (e) { /* fără focus */ }
}

let searchTimer = 0;
let showApp = !!store.get('showApp', false);
function applyApp() {
  $('rdBody').classList.toggle('showapp', showApp);
  $('rdToc').classList.toggle('showapp', showApp);
  const b = $('rdApp'); if (b) { b.setAttribute('aria-pressed', showApp ? 'true' : 'false'); b.textContent = showApp ? 'Ascunde notele autorului' : 'Arată notele autorului'; }
}
const norm = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
let index = null; // indexul paragrafelor, construit o singură dată
function buildIndex() {
  index = [];
  TEXTS.forEach((t, i) => {
    const tmp = document.createElement('div'); tmp.innerHTML = get(i).html;
    let head = '', hid = '';
    let ord = 0;
    tmp.querySelectorAll('h2,h3,h4,h5,h6,p,li').forEach((el) => {
      if (/^H\d$/.test(el.tagName)) { head = el.textContent; hid = el.id; return; }
      const txt = el.textContent;
      index.push({ i, ord: ord++, id: hid, head, txt, nrm: norm(txt), app: !!el.closest('.rdapp') });
    });
  });
}
function search(q) {
  const box = $('rdHits');
  q = q.trim();
  if (q.length < 3) { box.hidden = true; box.innerHTML = ''; box._hits = []; return; }
  if (!index) buildIndex();
  const nq = norm(q);
  const hits = [];
  for (const e of index) {
    if (hits.length >= 60) break;
    if (e.app && !showApp) continue;
    const k = e.nrm.indexOf(nq);
    if (k < 0) continue;
    hits.push({ i: e.i, ord: e.ord, id: e.id, head: e.head, s: e.txt.slice(Math.max(0, k - 50), k + q.length + 70), k: Math.min(50, k), len: q.length });
  }
  box.hidden = false;
  box.innerHTML = hits.length
    ? hits.map((h, x) => `<button data-x="${x}"><span>${TEXTS[h.i].n ? 'Vol. ' + TEXTS[h.i].n : 'Ghid'} · ${esc(h.head.slice(0, 60))}</span>${esc(h.s.slice(0, h.k))}<mark>${esc(h.s.slice(h.k, h.k + h.len))}</mark>${esc(h.s.slice(h.k + h.len))}</button>`).join('')
    : '<em>Niciun rezultat.</em>';
  box._hits = hits;
}

export function initReader(a) {
  api = a;
  const b0 = $('btnRead'); if (b0) b0.hidden = true;
  loadTexts().then(() => { if (b0) b0.hidden = false; setup(); }).catch(() => { /* fără cititor */ });
}
function setup() {
  if (!TEXTS.length) { const b = $('btnRead'); if (b) b.hidden = true; return; }
  $('rdTabs').innerHTML = TEXTS.map((t, i) => `<button type="button" data-i="${i}" title="${esc(t.title)}" aria-label="${t.n ? 'Volumul ' + t.n + ' · ' : ''}${esc(t.title)}">${t.n || 'Ghid'}</button>`).join('');
  $('rdTabs').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) open(+b.dataset.i); });
  $('btnRead').addEventListener('click', () => { const l = +store.get('last', 0); open(Number.isInteger(l) && l >= 0 && l < TEXTS.length ? l : 0); });
  $('rdClose').addEventListener('click', close);
  $('rdApp').hidden = !TEXTS.some((t) => /^#{1,6}\s+.*(fapte noi introduse|fire deschise|fi[șş]a volumului)/im.test(t.md));
  $('rdApp').addEventListener('click', () => { showApp = !showApp; store.set('showApp', showApp); applyApp(); progress(); });
  $('rdMap').addEventListener('click', () => { const n = TEXTS[cur].n; close(); api.selectVolume(n); });
  $('rdToc').addEventListener('click', (e) => {
    const l = e.target.closest('a'); if (!l) return; e.preventDefault();
    const el = document.getElementById(l.dataset.id);
    const sc = $('rdScroll');
    if (el) sc.scrollTo({ top: Math.max(0, el.getBoundingClientRect().top - sc.getBoundingClientRect().top + sc.scrollTop - 12), behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    $('reader').classList.remove('tocopen');
  });
  $('rdTocBtn').addEventListener('click', () => $('reader').classList.toggle('tocopen'));
  let saveTimer = 0;
  $('rdScroll').addEventListener('scroll', () => { progress(); clearTimeout(saveTimer); saveTimer = setTimeout(savePos, 500); }, { passive: true });
  window.addEventListener('pagehide', savePos);
  document.addEventListener('visibilitychange', () => { if (document.hidden) savePos(); });
  let fs = store.get('fs', 19);
  const applyFs = () => { $('rdBody').style.fontSize = fs + 'px'; store.set('fs', fs); };
  applyFs();
  $('rdSmall').addEventListener('click', () => { fs = Math.max(14, fs - 1); applyFs(); });
  $('rdBig').addEventListener('click', () => { fs = Math.min(30, fs + 1); applyFs(); });
  $('rdSearch').addEventListener('input', (e) => { clearTimeout(searchTimer); const v = e.target.value; searchTimer = setTimeout(() => search(v), 180); });
  const goHit = (x) => {
    const h = ($('rdHits')._hits || [])[x]; if (!h) return;
    $('rdHits').hidden = true;
    open(h.i, h.id, h.ord);
  };
  $('rdHits').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) goHit(+b.dataset.x); });
  $('rdSearch').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); clearTimeout(searchTimer); search(e.target.value); goHit(0); }
    else if (e.key === 'ArrowDown') { const b = $('rdHits').querySelector('button'); if (b) { e.preventDefault(); b.focus(); } }
  });
  $('rdHits').addEventListener('keydown', (e) => {
    const b = document.activeElement;
    if (e.key === 'ArrowDown' && b && b.nextElementSibling) { e.preventDefault(); b.nextElementSibling.focus(); }
    else if (e.key === 'ArrowUp' && b) { e.preventDefault(); (b.previousElementSibling || $('rdSearch')).focus(); }
  });
  document.addEventListener('keydown', (e) => {
    if ($('reader').hidden) return;
    if (e.key === 'Escape') {
      e.stopPropagation(); e.preventDefault();
      if (!$('rdHits').hidden) { $('rdHits').hidden = true; $('rdSearch').focus(); }
      else if ($('reader').classList.contains('tocopen')) $('reader').classList.remove('tocopen');
      else close();
    } else if (e.key === 'Tab') { // capcană de focus: cititorul e modal
      const f = [...$('reader').querySelectorAll('button, input, a[href], [tabindex="0"]')].filter((x) => !x.disabled && !x.hidden && x.offsetParent !== null);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && (document.activeElement === first || !$('reader').contains(document.activeElement))) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }, true);
  window.__reader = { open, close, TEXTS };
}
export function openReader(n) {
  const i = TEXTS.findIndex((t) => t.n === n);
  open(i < 0 ? 0 : i);
}
