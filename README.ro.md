# Pendulul

[English](README.md) · **Română** · [Français](README.fr.md) · [Italiano](README.it.md) · [Español](README.es.md) · [Português](README.pt.md) · [Deutsch](README.de.md) · [Magyar](README.hu.md)

**Versiune:** 1.0.1 · **Ultima actualizare:** 2026-10-22

**Roman SF în nouă volume** de Alexio, în colaborare cu Claude (Anthropic).

O planetă oscilează între trei stele și o gaură neagră. Într-o lume fără industrie, civilizația are doar câteva ferestre, tot mai scurte, în care rachetele cu pulbere pot ajunge pe orbită. Perioada fiecărui pendul scade cu patru ani, iar cititorul numără împreună cu personajele.

Limbile interfeței: **Română**.

## Cum se citește

Volumele se citesc **în ordine, de la 1 la 9**. Fiecare are altă formă.

| Vol. | Titlu | Forma |
| --- | --- | --- |
| 1 | [Arhivista](carte/01-arhivista.md) | roman, capitole scurte |
| 2 | [Patru voci](carte/02-patru-voci.md) | capitole duble, „sus” și „jos” |
| 3 | [Cinci faze](carte/03-cinci-faze.md) | cinci voci și un atlas |
| 4 | [Arhivele](carte/04-arhivele.md) | roman epistolar, în 13 dosare |
| 5 | [Fanarele](carte/05-fanarele.md) | cronică din noduri |
| 6 | [Cele douăzeci de pendule](carte/06-cele-douazeci-de-pendule.md) | o scenă din fiecare pendul |
| 7 | [Cel din toate pendulele](carte/07-cel-din-toate-pendulele.md) | un singur narator |
| 8 | [Cei care nu vorbesc](carte/08-cei-care-nu-vorbesc.md) | două voci neobișnuite |
| 9 | [Cel care ajustează orbita](carte/09-cel-care-ajusteaza-orbita.md) | povestit în ordine inversă |

[Ghidul cititorului](ghid/ghidul-cititorului.md) are câte o secțiune pe volum, fără spoilere. Citește-l doar până la volumul la care ai ajuns; secțiunea „După volumul 9” conține spoilere.

## Ediții

| Format | Fișier |
| --- | --- |
| EPUB (cu copertă) | [`dist/Pendulul.epub`](dist/Pendulul.epub) |
| PDF, format A5, cu semne de carte | [`dist/Pendulul.pdf`](dist/Pendulul.pdf) |
| Simulare 3D + cititor, un singur fișier HTML, funcționează offline | [`dist/pendulul-3d.html`](dist/pendulul-3d.html) |
| Textul întregii cărți, Markdown | [`dist/Pendulul-ed-cititor.md`](dist/Pendulul-ed-cititor.md) |

Dacă GitHub Pages e activat pentru acest depozit, simularea rulează și la adresa paginii proiectului (se servește din `docs/`).

## Simularea 3D

Un singur fișier HTML, fără dependențe de rețea: planeta, cei trei sori, Golul, rachetele Ferestrei, harta pendulelor și cititorul celor nouă volume (cu căutare, cuprins, mărirea textului și reluarea lecturii). Dacă browserul nu poate porni WebGL, cititorul rămâne funcțional.

Se reconstruiește din surse:

```bash
cd simulare
npm install
npm run build        # scrie ../dist/pendulul-3d.html și ../docs/index.html
```

## Aparatul de lume

În [`seria/`](seria/) sunt materialele de lucru: [canonul](seria/canon.md) (cifre și reguli ale lumii), [atlasul](seria/atlas.md), [cronologia și glosarul](seria/cronologie-glosar.md). Subdirectorul [`seria/aparat/`](seria/aparat/) păstrează notele autorului, scoase din ediția cititorului. Conțin spoilere.

## Reconstruirea ediției (EPUB, PDF)

Necesită `pandoc` și Python 3; pentru PDF, și `playwright` (Chromium).

```bash
python3 scripts/build_book.py          # EPUB + PDF în dist/
python3 scripts/build_book.py epub     # doar EPUB
```

## Despre colaborarea cu inteligența artificială

Seria a fost scrisă împreună cu un model de inteligență artificială (Claude, Anthropic). Ideea, lumea, structura, deciziile de canon și selecția finală aparțin autorului; textul a fost redactat, revizuit și verificat împreună, în mai multe runde (consecvența cifrelor, a numelor și a cronologiei între volume). Simularea 3D a fost construită în același fel.

## Licență

- **Texte și cod** (carte, ghid, seria, ediții, simulare, scripturi): [MIT](LICENSE). Poți folosi, copia, modifica și redistribui liber, cu păstrarea mențiunii de drepturi de autor.
- **three.js** (inclus în HTML): MIT, vezi [NOTICE.md](NOTICE.md).

Pentru ediții tipărite, audio, traduceri sau adaptări cu scop comercial, scrie autorului prin profilul de GitHub.

## Istoric / Changelog

### 1.0.1 — 2026-10-22
- Pagina simulării 3D (`docs/index.html`, publicată și de GitHub Pages) are acum un service worker real și un manifest de aplicație web cu pictograme: se poate instala și se deschide offline după prima vizită. Fișierul independent `dist/pendulul-3d.html` rămâne neschimbat ca funcționare.
- Accesibilitate: exact un H1 și un reper main; zero încălcări axe-core la 360 px; tot textul are minimum 12 px; ținte tactile mai mari pentru butoanele mici, glisoare și căsuța de bifat.
- O politică strictă de securitate a conținutului (scripturi doar pe bază de hash, fără rețea) este încorporată în pagină; pagina nu încarcă nimic de la terți (fără CDN).

## Cum citezi

Vezi [`CITATION.cff`](CITATION.cff).
