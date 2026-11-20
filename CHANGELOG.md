# Jurnal de modificări — Pendulul

## 2.2.3 — 2026-11-20

Anterior: v2.2.2.

- fff-kit 1.8.1 în `docs/index.html`, în `docs/prezentare.html` (până acum 1.7.0) și în `dist/pendulul-3d.html` (până acum 1.8.0): când `localStorage`/`sessionStorage` aruncă sau lipsesc (cookie-uri și date de site blocate, WebView fără stocare, `<iframe sandbox>`), kitul pune în loc o stocare în memorie, iar pagina pornește în loc să se oprească; datele nu se păstrează după închiderea paginii. Ghidajul care mărește controalele mici la 44 px măsoară acum și lățimea corpului paginii.
- `docs/prezentare.html`: meta-ul CSP are acum `script-src` cu hash-urile scripturilor inline ale kitului (până acum lipsea, iar `fff-kit check` raporta hash-uri CSP lipsă). Aspectul paginii este neschimbat: 0 pixeli diferiți față de versiunea anterioară, la 1280 și la 360 px.
- `dist/pendulul-3d.html` rămâne la versiunea 2.2.0 (bundle-ul 3D nu a fost reconstruit); s-a actualizat doar kitul. `fff-kit check` raportează în continuare pentru acest fișier cheia de stocare `pendulul.…` fără prefixul `pendulul-3d.` (neschimbat față de înainte).

## 2.2.2 — 2026-11-17

Anterior: v2.2.1.

- Compatibilitate cu browsere mai vechi (Chrome/Edge 55+, Firefox 52+, Safari 10.1+/iOS 10.3+) în `docs/index.html` și `dist/pendulul-3d.html`: sintaxă JavaScript coborâtă la ES2017 și strat de rezervă pentru API-urile care lipsesc în motoarele vechi (fff-kit 1.8.0), hash-uri CSP recalculate. Browserele vechi nu au fost încercate pe dispozitive reale; verificare cu parser ES2017 și într-un motor vechi simulat.

## 2.2.1 — 2026-11-15

Anterior: v2.2.0.

- Nou: texturi fractale hiper-detaliate (fff-texturi 1.1.2) în simularea găzduită (`docs/index.html`) — fundalul și suprafețele mari (panouri, antete, butoane; filele și dialogurile ascunse la încărcare, când se deschid) primesc un material generat local (WebGL2, fără rețea și fără imagini), care se repetă fără cusătură; culorile aplicației rămân ale ei. Se oprește din dialogul „Transparență” sau cu `?notex=1`.
- Versiunea crește în `simulare/build.mjs`, `simulare/pwa/sw.js` (cache-ul PWA se reîmprospătează), `docs/index.html`, `docs/app.json` și `docs/sw.js`. Kitul comun rămâne la 1.2.0; bundle-ul 3D nu a fost reconstruit.

## 2.2.0 — 2026-10-27

Anterior: v2.1.0. Recenzie 2 (2026-10-27).

- Simularea găzduită (`docs/index.html`): link „Pagina cărții: copertă, sinopsis, capitol gratuit” în panoul „Straturi și opțiuni”, către `prezentare.html`. Fișierul autonom `dist/pendulul-3d.html` nu are linkul (relativ, ar fi rupt). `simulare/build.mjs` injectează linkul doar în varianta din `docs/`; CSS-ul `a.btn` adăugat în `simulare/src/template.html`.
- `docs/sw.js`: `prezentare.html` adăugat în cache-ul PWA (disponibilă offline).
- README: șase limbi (fr, it, es, pt, de, hu) aduse la 2.2.0 cu secțiunea „Pagina de prezentare” (traducere automată); EN/RO actualizate.
- Test nou `tests/prezentare-link.test.mjs` (link prezent și funcțional, nicio cerere externă, 0 erori JS/CSP, pagina în cache-ul PWA).
- Nu s-a rebuild-uit bundle-ul 3D (lipsește `three` local); modificările din `docs/index.html` și `dist/pendulul-3d.html` sunt doar de markup/CSS/metadate, deci hash-urile CSP ale scripturilor rămân valide. Scripturile nu s-au schimbat.

Nu s-a implementat: coperți suplimentare (depozitul are o singură copertă, `dist/coperta.jpg`); EPUB/PDF nou (cele existente nu s-au regenerat, textul nu s-a schimbat).

## 2.1.0 — 2026-10-27

Anterior: v1.0.1. Recenzie 2026-10-27.

- Pagină de prezentare `docs/prezentare.html` (un singur fișier, fără JavaScript, fără cereri în rețea): coperta (din `dist/coperta.jpg`), sinopsis (din `README.ro.md`), cele nouă volume cu forma lor, linkuri de descărcare (EPUB, PDF, simulare 3D, text Markdown) și primul capitol gratuit (prologul și capitolele 1–2 din volumul 1, neschimbate). Generată cu `scripts/build_prezentare.py`; poate servi drept model pentru celelalte cărți.
- README (EN și RO): „Stare: stabil”, „Offline: complet”, secțiunea „Pagina de prezentare”.
- Versiunea aliniată la 2.1.0 în `simulare/build.mjs`, `docs/index.html`, `dist/pendulul-3d.html` (doar metadate) și `docs/sw.js` (cache nou pentru PWA). Simularea 3D nu și-a schimbat funcționarea.

Nu s-a implementat: „coperți” la plural (depozitul conține o singură copertă); actualizarea celorlalte șase README-uri lingvistice (fr, it, es, pt, de, hu).

## 1.0.1 — 2026-10-22

Vezi secțiunea „History / Changelog” din `README.md`.
