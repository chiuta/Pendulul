# Jurnal de modificări — Pendulul

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
