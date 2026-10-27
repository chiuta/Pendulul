# Jurnal de modificări — Pendulul

## 2.1.0 — 2026-10-27

Anterior: v1.0.1. Recenzie 2026-10-27.

- Pagină de prezentare `docs/prezentare.html` (un singur fișier, fără JavaScript, fără cereri în rețea): coperta (din `dist/coperta.jpg`), sinopsis (din `README.ro.md`), cele nouă volume cu forma lor, linkuri de descărcare (EPUB, PDF, simulare 3D, text Markdown) și primul capitol gratuit (prologul și capitolele 1–2 din volumul 1, neschimbate). Generată cu `scripts/build_prezentare.py`; poate servi drept model pentru celelalte cărți.
- README (EN și RO): „Stare: stabil”, „Offline: complet”, secțiunea „Pagina de prezentare”.
- Versiunea aliniată la 2.1.0 în `simulare/build.mjs`, `docs/index.html`, `dist/pendulul-3d.html` (doar metadate) și `docs/sw.js` (cache nou pentru PWA). Simularea 3D nu și-a schimbat funcționarea.

Nu s-a implementat: „coperți” la plural (depozitul conține o singură copertă); actualizarea celorlalte șase README-uri lingvistice (fr, it, es, pt, de, hu).

## 1.0.1 — 2026-10-22

Vezi secțiunea „History / Changelog” din `README.md`.
