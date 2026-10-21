# Pendulul

[English](README.md) · [Română](README.ro.md) · [Français](README.fr.md) · [Italiano](README.it.md) · [Español](README.es.md) · [Português](README.pt.md) · [Deutsch](README.de.md) · **Magyar**

**Verzió:** 1.0.0 · **Utolsó frissítés:** 2026-10-18

**Sci-fi regény kilenc kötetben** – Alexio műve, Claude (Anthropic) közreműködésével.

Egy bolygó három csillag és egy fekete lyuk között leng. Egy ipar nélküli világban a civilizációnak csak néhány, egyre rövidebb ablaka van, amikor a puskaporos rakéták elérhetik a pályát. Minden inga periódusa négy évvel rövidebb, és az olvasó együtt számol a szereplőkkel.

A felület nyelvei: **román**.

## Hogyan olvassuk

A köteteket **sorrendben, 1-től 9-ig** kell olvasni. Mindegyiknek más a formája.

| Kötet | Cím | Forma |
| --- | --- | --- |
| 1 | [Arhivista](carte/01-arhivista.md) | regény, rövid fejezetek |
| 2 | [Patru voci](carte/02-patru-voci.md) | kettős fejezetek, „fent” és „lent” |
| 3 | [Cinci faze](carte/03-cinci-faze.md) | öt hang és egy atlasz |
| 4 | [Arhivele](carte/04-arhivele.md) | levélregény, 13 aktában |
| 5 | [Fanarele](carte/05-fanarele.md) | csomópontokból elmesélt krónika |
| 6 | [Cele douăzeci de pendule](carte/06-cele-douazeci-de-pendule.md) | egy jelenet minden ingából |
| 7 | [Cel din toate pendulele](carte/07-cel-din-toate-pendulele.md) | egyetlen elbeszélő |
| 8 | [Cei care nu vorbesc](carte/08-cei-care-nu-vorbesc.md) | két szokatlan hang |
| 9 | [Cel care ajustează orbita](carte/09-cel-care-ajusteaza-orbita.md) | fordított sorrendben elmesélve |

Az [Olvasói útmutató](ghid/ghidul-cititorului.md) kötetenként egy szakaszt tartalmaz, spoilerek nélkül. Csak addig a kötetig olvasd, ameddig eljutottál; a „A 9. kötet után” szakasz spoilereket tartalmaz.

## Kiadások

| Formátum | Fájl |
| --- | --- |
| EPUB (borítóval) | [`dist/Pendulul.epub`](dist/Pendulul.epub) |
| PDF, A5 formátum, könyvjelzőkkel | [`dist/Pendulul.pdf`](dist/Pendulul.pdf) |
| 3D-szimuláció + olvasó, egyetlen HTML-fájl, offline is működik | [`dist/pendulul-3d.html`](dist/pendulul-3d.html) |
| A teljes könyv szövege, Markdown | [`dist/Pendulul-ed-cititor.md`](dist/Pendulul-ed-cititor.md) |

Ha a GitHub Pages be van kapcsolva ehhez a tárolóhoz, a szimuláció a projektoldal címén is fut (a `docs/` könyvtárból szolgálják ki).

## A 3D-szimuláció

Egyetlen HTML-fájl, hálózati függőségek nélkül: a bolygó, a három nap, az Űr, az Ablak rakétái, az ingák térképe és a kilenc kötet olvasója (kereséssel, tartalomjegyzékkel, szövegnagyítással és az olvasás folytatásával). Ha a böngésző nem tudja elindítani a WebGL-t, az olvasó továbbra is működik.

Forrásból újraépíthető:

```bash
cd simulare
npm install
npm run build        # scrie ../dist/pendulul-3d.html și ../docs/index.html
```

## A világ apparátusa

A [`seria/`](seria/) könyvtárban találhatók a munkaanyagok: a [kánon](seria/canon.md) (a világ számadatai és szabályai), az [atlasz](seria/atlas.md), a [kronológia és szójegyzék](seria/cronologie-glosar.md). A [`seria/aparat/`](seria/aparat/) alkönyvtár a szerző jegyzeteit őrzi, amelyeket kivettek az olvasói kiadásból. Spoilereket tartalmaznak.

## A kiadás újraépítése (EPUB, PDF)

`pandoc` és Python 3 szükséges; a PDF-hez emellett `playwright` (Chromium).

```bash
python3 scripts/build_book.py          # EPUB + PDF în dist/
python3 scripts/build_book.py epub     # doar EPUB
```

## A mesterséges intelligenciával való együttműködésről

A sorozat egy mesterséges intelligencia modellel (Claude, Anthropic) közösen készült. Az ötlet, a világ, a szerkezet, a kánonnal kapcsolatos döntések és a végső válogatás a szerzőé; a szöveget több fordulóban közösen fogalmaztuk, átdolgoztuk és ellenőriztük (a számadatok, nevek és a kronológia következetessége a kötetek között). A 3D-szimuláció is ugyanígy készült.

## Licenc

- **Szövegek és kód** (könyv, útmutató, sorozat, kiadások, szimuláció, szkriptek): [MIT](LICENSE). Szabadon felhasználhatod, másolhatod, módosíthatod és terjesztheted, a szerzői jogi közlemény megtartásával.
- **three.js** (a HTML-be beépítve): MIT, lásd: [NOTICE.md](NOTICE.md).

Nyomtatott kiadásokhoz, hangoskönyvhöz, fordításokhoz vagy kereskedelmi célú adaptációkhoz írj a szerzőnek a GitHub-profilján keresztül.

## Hivatkozás

Lásd: [`CITATION.cff`](CITATION.cff).
