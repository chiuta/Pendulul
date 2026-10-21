# Pendulul

[English](README.md) · [Română](README.ro.md) · [Français](README.fr.md) · **Italiano** · [Español](README.es.md) · [Português](README.pt.md) · [Deutsch](README.de.md) · [Magyar](README.hu.md)

**Versione:** 1.0.0 · **Ultimo aggiornamento:** 2026-10-18

**Romanzo di fantascienza in nove volumi** di Alexio, in collaborazione con Claude (Anthropic).

Un pianeta oscilla tra tre stelle e un buco nero. In un mondo senza industria, la civiltà ha solo poche finestre, sempre più brevi, in cui i razzi a polvere possono raggiungere l'orbita. Il periodo di ogni pendolo si accorcia di quattro anni, e il lettore conta insieme ai personaggi.

Lingue dell'interfaccia: **rumeno**.

## Come leggerlo

I volumi si leggono **in ordine, dall'1 al 9**. Ognuno ha una forma diversa.

| Vol. | Titolo | Forma |
| --- | --- | --- |
| 1 | [Arhivista](carte/01-arhivista.md) | romanzo, capitoli brevi |
| 2 | [Patru voci](carte/02-patru-voci.md) | capitoli doppi, «sopra» e «sotto» |
| 3 | [Cinci faze](carte/03-cinci-faze.md) | cinque voci e un atlante |
| 4 | [Arhivele](carte/04-arhivele.md) | romanzo epistolare, in 13 fascicoli |
| 5 | [Fanarele](carte/05-fanarele.md) | cronaca raccontata dai nodi |
| 6 | [Cele douăzeci de pendule](carte/06-cele-douazeci-de-pendule.md) | una scena da ciascun pendolo |
| 7 | [Cel din toate pendulele](carte/07-cel-din-toate-pendulele.md) | un unico narratore |
| 8 | [Cei care nu vorbesc](carte/08-cei-care-nu-vorbesc.md) | due voci insolite |
| 9 | [Cel care ajustează orbita](carte/09-cel-care-ajusteaza-orbita.md) | raccontato in ordine inversa |

La [Guida del lettore](ghid/ghidul-cititorului.md) ha una sezione per volume, senza spoiler. Leggila solo fino al volume a cui sei arrivato; la sezione «Dopo il volume 9» contiene spoiler.

## Edizioni

| Formato | File |
| --- | --- |
| EPUB (con copertina) | [`dist/Pendulul.epub`](dist/Pendulul.epub) |
| PDF, formato A5, con segnalibri | [`dist/Pendulul.pdf`](dist/Pendulul.pdf) |
| Simulazione 3D + lettore, un unico file HTML, funziona offline | [`dist/pendulul-3d.html`](dist/pendulul-3d.html) |
| Testo dell'intero libro, Markdown | [`dist/Pendulul-ed-cititor.md`](dist/Pendulul-ed-cititor.md) |

Se GitHub Pages è attivo per questo repository, la simulazione funziona anche all'indirizzo della pagina del progetto (viene servita da `docs/`).

## La simulazione 3D

Un unico file HTML, senza dipendenze di rete: il pianeta, i tre soli, il Vuoto, i razzi della Finestra, la mappa dei pendoli e il lettore dei nove volumi (con ricerca, indice, ingrandimento del testo e ripresa della lettura). Se il browser non riesce ad avviare WebGL, il lettore resta funzionante.

Si ricostruisce dai sorgenti:

```bash
cd simulare
npm install
npm run build        # scrie ../dist/pendulul-3d.html și ../docs/index.html
```

## L'apparato del mondo

In [`seria/`](seria/) si trovano i materiali di lavoro: il [canone](seria/canon.md) (cifre e regole del mondo), l'[atlante](seria/atlas.md), la [cronologia e il glossario](seria/cronologie-glosar.md). La sottocartella [`seria/aparat/`](seria/aparat/) conserva le note dell'autore, tolte dall'edizione per il lettore. Contengono spoiler.

## Ricostruzione dell'edizione (EPUB, PDF)

Richiede `pandoc` e Python 3; per il PDF anche `playwright` (Chromium).

```bash
python3 scripts/build_book.py          # EPUB + PDF în dist/
python3 scripts/build_book.py epub     # doar EPUB
```

## Sulla collaborazione con l'intelligenza artificiale

La serie è stata scritta insieme a un modello di intelligenza artificiale (Claude, Anthropic). L'idea, il mondo, la struttura, le decisioni di canone e la selezione finale appartengono all'autore; il testo è stato redatto, rivisto e verificato insieme, in più passaggi (coerenza di cifre, nomi e cronologia tra i volumi). La simulazione 3D è stata costruita allo stesso modo.

## Licenza

- **Testi e codice** (libro, guida, serie, edizioni, simulazione, script): [MIT](LICENSE). Puoi usare, copiare, modificare e ridistribuire liberamente, mantenendo l'avviso di copyright.
- **three.js** (incluso nell'HTML): MIT, vedi [NOTICE.md](NOTICE.md).

Per edizioni stampate, audio, traduzioni o adattamenti a scopo commerciale, scrivi all'autore tramite il profilo GitHub.

## Come citare

Vedi [`CITATION.cff`](CITATION.cff).
