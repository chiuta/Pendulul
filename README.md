# Pendulul

**English** · [Română](README.ro.md) · [Français](README.fr.md) · [Italiano](README.it.md) · [Español](README.es.md) · [Português](README.pt.md) · [Deutsch](README.de.md) · [Magyar](README.hu.md)

**Version:** 1.0.0 · **Last updated:** 2026-10-18

**A science-fiction novel in nine volumes** by Alexio, in collaboration with Claude (Anthropic).

A planet oscillates between three stars and a black hole. In a world without industry, civilization has only a few windows, ever shorter, in which gunpowder rockets can reach orbit. The period of each pendulum shrinks by four years, and the reader counts along with the characters.

Interface languages: **Romanian**.

## How to read it

The volumes are meant to be read **in order, from 1 to 9**. Each one has a different form.

| Vol. | Title | Form |
| --- | --- | --- |
| 1 | [Arhivista](carte/01-arhivista.md) | novel, short chapters |
| 2 | [Patru voci](carte/02-patru-voci.md) | double chapters, "above" and "below" |
| 3 | [Cinci faze](carte/03-cinci-faze.md) | five voices and an atlas |
| 4 | [Arhivele](carte/04-arhivele.md) | epistolary novel, in 13 files |
| 5 | [Fanarele](carte/05-fanarele.md) | chronicle told from nodes |
| 6 | [Cele douăzeci de pendule](carte/06-cele-douazeci-de-pendule.md) | one scene from each pendulum |
| 7 | [Cel din toate pendulele](carte/07-cel-din-toate-pendulele.md) | a single narrator |
| 8 | [Cei care nu vorbesc](carte/08-cei-care-nu-vorbesc.md) | two unusual voices |
| 9 | [Cel care ajustează orbita](carte/09-cel-care-ajusteaza-orbita.md) | told in reverse order |

The [Reader's Guide](ghid/ghidul-cititorului.md) has one section per volume, spoiler-free. Read it only up to the volume you have reached; the section "After volume 9" contains spoilers.

## Editions

| Format | File |
| --- | --- |
| EPUB (with cover) | [`dist/Pendulul.epub`](dist/Pendulul.epub) |
| PDF, A5 format, with bookmarks | [`dist/Pendulul.pdf`](dist/Pendulul.pdf) |
| 3D simulation + reader, a single HTML file, works offline | [`dist/pendulul-3d.html`](dist/pendulul-3d.html) |
| Full text of the whole book, Markdown | [`dist/Pendulul-ed-cititor.md`](dist/Pendulul-ed-cititor.md) |

If GitHub Pages is enabled for this repository, the simulation also runs at the project page address (it is served from `docs/`).

## The 3D simulation

A single HTML file with no network dependencies: the planet, the three suns, the Void, the Window rockets, the map of the pendulums and a reader for the nine volumes (with search, table of contents, text enlargement and reading resume). If the browser cannot start WebGL, the reader remains functional.

It is rebuilt from source:

```bash
cd simulare
npm install
npm run build        # scrie ../dist/pendulul-3d.html și ../docs/index.html
```

## The world apparatus

[`seria/`](seria/) holds the working materials: the [canon](seria/canon.md) (the world's figures and rules), the [atlas](seria/atlas.md), the [chronology and glossary](seria/cronologie-glosar.md). The subdirectory [`seria/aparat/`](seria/aparat/) keeps the author's notes, removed from the reader's edition. They contain spoilers.

## Rebuilding the edition (EPUB, PDF)

Requires `pandoc` and Python 3; for PDF, also `playwright` (Chromium).

```bash
python3 scripts/build_book.py          # EPUB + PDF în dist/
python3 scripts/build_book.py epub     # doar EPUB
```

## About the collaboration with artificial intelligence

The series was written together with an artificial intelligence model (Claude, Anthropic). The idea, the world, the structure, the canon decisions and the final selection belong to the author; the text was drafted, revised and checked together, over several rounds (consistency of figures, names and chronology across volumes). The 3D simulation was built the same way.

## License

- **Texts and code** (book, guide, series, editions, simulation, scripts): [MIT](LICENSE). You may freely use, copy, modify and redistribute, keeping the copyright notice.
- **three.js** (included in the HTML): MIT, see [NOTICE.md](NOTICE.md).

For printed editions, audio, translations or adaptations for commercial purposes, write to the author through the GitHub profile.

## How to cite

See [`CITATION.cff`](CITATION.cff).
