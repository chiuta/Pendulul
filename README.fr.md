# Pendulul

[English](README.md) · [Română](README.ro.md) · **Français** · [Italiano](README.it.md) · [Español](README.es.md) · [Português](README.pt.md) · [Deutsch](README.de.md) · [Magyar](README.hu.md)

**Version :** 2.2.0 · **Dernière mise à jour :** 2026-10-27

**Roman de science-fiction en neuf volumes** d'Alexio, en collaboration avec Claude (Anthropic).

Une planète oscille entre trois étoiles et un trou noir. Dans un monde sans industrie, la civilisation ne dispose que de quelques fenêtres, de plus en plus courtes, durant lesquelles des fusées à poudre peuvent atteindre l'orbite. La période de chaque pendule diminue de quatre ans, et le lecteur compte avec les personnages.

Langues de l'interface : **roumain**.

## Comment le lire

Les volumes se lisent **dans l'ordre, de 1 à 9**. Chacun a une forme différente.

| Vol. | Titre | Forme |
| --- | --- | --- |
| 1 | [Arhivista](carte/01-arhivista.md) | roman, chapitres courts |
| 2 | [Patru voci](carte/02-patru-voci.md) | chapitres doubles, « en haut » et « en bas » |
| 3 | [Cinci faze](carte/03-cinci-faze.md) | cinq voix et un atlas |
| 4 | [Arhivele](carte/04-arhivele.md) | roman épistolaire, en 13 dossiers |
| 5 | [Fanarele](carte/05-fanarele.md) | chronique racontée à partir de nœuds |
| 6 | [Cele douăzeci de pendule](carte/06-cele-douazeci-de-pendule.md) | une scène de chaque pendule |
| 7 | [Cel din toate pendulele](carte/07-cel-din-toate-pendulele.md) | un seul narrateur |
| 8 | [Cei care nu vorbesc](carte/08-cei-care-nu-vorbesc.md) | deux voix inhabituelles |
| 9 | [Cel care ajustează orbita](carte/09-cel-care-ajusteaza-orbita.md) | raconté en ordre inverse |

Le [Guide du lecteur](ghid/ghidul-cititorului.md) comporte une section par volume, sans divulgâcher. Ne le lisez que jusqu'au volume où vous êtes arrivé ; la section « Après le volume 9 » contient des spoilers.

## Page de présentation

[`docs/prezentare.html`](docs/prezentare.html) est une page de présentation en un seul fichier (en roumain) : couverture, synopsis, les neuf volumes, liens de téléchargement et un premier chapitre gratuit (prologue et chapitres 1–2 du volume 1, inchangés). Sans requête réseau ni JavaScript. Depuis la 2.2.0, la simulation hébergée (`docs/index.html`) y renvoie depuis le panneau « Straturi și opțiuni » (« Pagina cărții »). (Traduction automatique, non vérifiée par un locuteur natif.)

## Éditions

| Format | Fichier |
| --- | --- |
| EPUB (avec couverture) | [`dist/Pendulul.epub`](dist/Pendulul.epub) |
| PDF, format A5, avec signets | [`dist/Pendulul.pdf`](dist/Pendulul.pdf) |
| Simulation 3D + lecteur, un seul fichier HTML, fonctionne hors ligne | [`dist/pendulul-3d.html`](dist/pendulul-3d.html) |
| Texte intégral du livre, Markdown | [`dist/Pendulul-ed-cititor.md`](dist/Pendulul-ed-cititor.md) |

Si GitHub Pages est activé pour ce dépôt, la simulation fonctionne aussi à l'adresse de la page du projet (elle est servie depuis `docs/`).

## La simulation 3D

Un seul fichier HTML, sans dépendance réseau : la planète, les trois soleils, le Vide, les fusées de la Fenêtre, la carte des pendules et le lecteur des neuf volumes (avec recherche, table des matières, agrandissement du texte et reprise de la lecture). Si le navigateur ne peut pas démarrer WebGL, le lecteur reste fonctionnel.

Elle se reconstruit à partir des sources :

```bash
cd simulare
npm install
npm run build        # scrie ../dist/pendulul-3d.html și ../docs/index.html
```

## L'appareil du monde

Dans [`seria/`](seria/) se trouvent les matériaux de travail : le [canon](seria/canon.md) (chiffres et règles du monde), l'[atlas](seria/atlas.md), la [chronologie et le glossaire](seria/cronologie-glosar.md). Le sous-répertoire [`seria/aparat/`](seria/aparat/) conserve les notes de l'auteur, retirées de l'édition du lecteur. Elles contiennent des spoilers.

## Reconstruction de l'édition (EPUB, PDF)

Nécessite `pandoc` et Python 3 ; pour le PDF, aussi `playwright` (Chromium).

```bash
python3 scripts/build_book.py          # EPUB + PDF în dist/
python3 scripts/build_book.py epub     # doar EPUB
```

## À propos de la collaboration avec l'intelligence artificielle

La série a été écrite avec un modèle d'intelligence artificielle (Claude, Anthropic). L'idée, le monde, la structure, les décisions de canon et la sélection finale appartiennent à l'auteur ; le texte a été rédigé, révisé et vérifié ensemble, en plusieurs passes (cohérence des chiffres, des noms et de la chronologie entre les volumes). La simulation 3D a été construite de la même manière.

## Licence

- **Textes et code** (livre, guide, série, éditions, simulation, scripts) : [MIT](LICENSE). Vous pouvez librement utiliser, copier, modifier et redistribuer, en conservant la mention de droit d'auteur.
- **three.js** (inclus dans le HTML) : MIT, voir [NOTICE.md](NOTICE.md).

Pour des éditions imprimées, audio, des traductions ou des adaptations à but commercial, écrivez à l'auteur via son profil GitHub.

## Historique / Changelog

### 1.0.1 — 2026-10-22
- La page de la simulation 3D (`docs/index.html`, aussi publiée par GitHub Pages) dispose maintenant d'un vrai service worker et d'un manifeste d'application web avec icônes : elle est installable et s'ouvre hors ligne après la première visite. Le fichier autonome `dist/pendulul-3d.html` ne change pas de fonctionnement.
- Accessibilité : exactement un H1 et un repère main ; aucune violation axe-core à 360 px ; tout le texte à 12 px minimum ; zones tactiles plus grandes pour les petits boutons, les curseurs et la case à cocher.
- Une politique de sécurité du contenu stricte (scripts uniquement par empreinte, aucun réseau) est intégrée à la page ; la page ne charge rien auprès de tiers (aucun CDN).

## Comment citer

Voir [`CITATION.cff`](CITATION.cff).
