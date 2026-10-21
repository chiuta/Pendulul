# Pendulul

[English](README.md) · [Română](README.ro.md) · [Français](README.fr.md) · [Italiano](README.it.md) · [Español](README.es.md) · [Português](README.pt.md) · **Deutsch** · [Magyar](README.hu.md)

**Version:** 1.0.0 · **Zuletzt aktualisiert:** 2026-10-18

**Science-Fiction-Roman in neun Bänden** von Alexio, in Zusammenarbeit mit Claude (Anthropic).

Ein Planet pendelt zwischen drei Sternen und einem Schwarzen Loch. In einer Welt ohne Industrie hat die Zivilisation nur wenige, immer kürzere Fenster, in denen Pulverraketen den Orbit erreichen können. Die Periode jedes Pendels verkürzt sich um vier Jahre, und der Leser zählt gemeinsam mit den Figuren.

Oberflächensprachen: **Rumänisch**.

## Wie man liest

Die Bände werden **der Reihe nach, von 1 bis 9** gelesen. Jeder hat eine andere Form.

| Bd. | Titel | Form |
| --- | --- | --- |
| 1 | [Arhivista](carte/01-arhivista.md) | Roman, kurze Kapitel |
| 2 | [Patru voci](carte/02-patru-voci.md) | Doppelkapitel, „oben“ und „unten“ |
| 3 | [Cinci faze](carte/03-cinci-faze.md) | fünf Stimmen und ein Atlas |
| 4 | [Arhivele](carte/04-arhivele.md) | Briefroman, in 13 Akten |
| 5 | [Fanarele](carte/05-fanarele.md) | Chronik, aus Knoten erzählt |
| 6 | [Cele douăzeci de pendule](carte/06-cele-douazeci-de-pendule.md) | eine Szene aus jedem Pendel |
| 7 | [Cel din toate pendulele](carte/07-cel-din-toate-pendulele.md) | ein einziger Erzähler |
| 8 | [Cei care nu vorbesc](carte/08-cei-care-nu-vorbesc.md) | zwei ungewöhnliche Stimmen |
| 9 | [Cel care ajustează orbita](carte/09-cel-care-ajusteaza-orbita.md) | in umgekehrter Reihenfolge erzählt |

Der [Leserführer](ghid/ghidul-cititorului.md) hat einen Abschnitt pro Band, ohne Spoiler. Lies ihn nur bis zu dem Band, bei dem du angekommen bist; der Abschnitt „Nach Band 9“ enthält Spoiler.

## Ausgaben

| Format | Datei |
| --- | --- |
| EPUB (mit Umschlag) | [`dist/Pendulul.epub`](dist/Pendulul.epub) |
| PDF, A5-Format, mit Lesezeichen | [`dist/Pendulul.pdf`](dist/Pendulul.pdf) |
| 3D-Simulation + Reader, eine einzige HTML-Datei, funktioniert offline | [`dist/pendulul-3d.html`](dist/pendulul-3d.html) |
| Text des gesamten Buches, Markdown | [`dist/Pendulul-ed-cititor.md`](dist/Pendulul-ed-cititor.md) |

Wenn GitHub Pages für dieses Repository aktiviert ist, läuft die Simulation auch unter der Adresse der Projektseite (sie wird aus `docs/` ausgeliefert).

## Die 3D-Simulation

Eine einzige HTML-Datei ohne Netzwerkabhängigkeiten: der Planet, die drei Sonnen, die Leere, die Raketen des Fensters, die Karte der Pendel und der Reader für die neun Bände (mit Suche, Inhaltsverzeichnis, Textvergrößerung und Fortsetzen der Lektüre). Kann der Browser WebGL nicht starten, bleibt der Reader funktionsfähig.

Sie wird aus dem Quelltext neu gebaut:

```bash
cd simulare
npm install
npm run build        # scrie ../dist/pendulul-3d.html și ../docs/index.html
```

## Der Weltapparat

In [`seria/`](seria/) liegen die Arbeitsmaterialien: der [Kanon](seria/canon.md) (Zahlen und Regeln der Welt), der [Atlas](seria/atlas.md), die [Chronologie und das Glossar](seria/cronologie-glosar.md). Das Unterverzeichnis [`seria/aparat/`](seria/aparat/) bewahrt die Notizen des Autors auf, die aus der Leserausgabe entfernt wurden. Sie enthalten Spoiler.

## Die Ausgabe neu bauen (EPUB, PDF)

Benötigt `pandoc` und Python 3; für das PDF zusätzlich `playwright` (Chromium).

```bash
python3 scripts/build_book.py          # EPUB + PDF în dist/
python3 scripts/build_book.py epub     # doar EPUB
```

## Zur Zusammenarbeit mit künstlicher Intelligenz

Die Reihe wurde gemeinsam mit einem KI-Modell (Claude, Anthropic) geschrieben. Idee, Welt, Struktur, Kanon-Entscheidungen und die endgültige Auswahl stammen vom Autor; der Text wurde in mehreren Durchgängen gemeinsam verfasst, überarbeitet und geprüft (Konsistenz von Zahlen, Namen und Chronologie über die Bände hinweg). Die 3D-Simulation wurde auf dieselbe Weise gebaut.

## Lizenz

- **Texte und Code** (Buch, Leitfaden, Reihe, Ausgaben, Simulation, Skripte): [MIT](LICENSE). Du darfst sie frei nutzen, kopieren, verändern und weiterverbreiten, sofern der Urheberrechtsvermerk erhalten bleibt.
- **three.js** (im HTML enthalten): MIT, siehe [NOTICE.md](NOTICE.md).

Für gedruckte Ausgaben, Hörfassungen, Übersetzungen oder Adaptionen zu kommerziellen Zwecken schreibe dem Autor über das GitHub-Profil.

## Zitieren

Siehe [`CITATION.cff`](CITATION.cff).
