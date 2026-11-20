# Cum se reconstruiesc `docs/` și `dist/` (verificat la 20 noiembrie 2026)

Pendulul nu are `index.html` în rădăcina depozitului: pagina publicată de GitHub Pages este `docs/index.html`, **generată** de `simulare/build.mjs`
(esbuild + three), care scrie și ediția autonomă `dist/pendulul-3d.html`.
(English: the published page is the generated `docs/index.html`; `dist/pendulul-3d.html` is the standalone edition. `npm run build` alone does not
reproduce them: the steps below, which live in the hub repository `chiuta.github.io`, are also part of the pipeline.)

## Ce face `npm run build` singur

Cere `FFF_KIT=<hub>/fff-kit` (fără el pică, ca pagina publicată să treacă mereu `fff-kit check`). Scrie `dist/pendulul-3d.html` și `docs/index.html`
din șablonul `simulare/src/template.html`, apoi pe `docs/`: `fff-kit apply` (module `core,store,dialog,view,a11y,share,label,bundle`), PWA
(`pwa/pwa.mjs apply`; `sw.js` și `manifest.webmanifest` se restaurează din `simulare/pwa/`), `fixcsp`, `info`, `check`.
Constantele `VERSION`/`UPDATED` din `build.mjs` și `VERSION` din `pwa/sw.js` trebuie să urmeze `docs/app.json` (se ridică împreună cu versiunea).

## Ce NU face (pașii din hub care au dat starea publicată)

Un `npm run build` singur dă o pagină fără texturile fractale, cu sintaxă peste ES2017 și o ediție autonomă fără kit. Ordinea care reproduce starea publicată
(`HUB` = calea către `chiuta.github.io`; `REPO` = calea către acest depozit, al cărui director se numește `Pendulul`):

```bash
export FFF_KIT="$HUB/fff-kit"
(cd "$REPO/simulare" && npm ci && node build.mjs)

# 1) pagina găzduită: modulele comune (fff-texturi, plic, seif) din hub
node "$HUB/tools/inject-shared.mjs" "$REPO/docs" pendulul

# 2) ediția autonomă: kitul (fără dialog/label/bundle), cu slug-ul pendulul-3d, pe o copie temporară
T=$(mktemp -d) && cp "$REPO/dist/pendulul-3d.html" "$T/index.html"
node "$FFF_KIT/build.mjs" apply "$T" --slug pendulul-3d --modules core,store,view,a11y,share
cp "$T/index.html" "$REPO/dist/pendulul-3d.html"

# 3) sintaxa coborâtă la ES2017 în docs/index.html și dist/pendulul-3d.html (+ hash-urile CSP)
node "$HUB/tools/compat/lower.mjs" --root "$(dirname "$REPO")" --only Pendulul --write

# 4) hash-uri, informații și verificare finală pe pagina găzduită
node "$FFF_KIT/build.mjs" fixcsp "$REPO/docs" && node "$FFF_KIT/build.mjs" info "$REPO/docs" --slug pendulul && node "$FFF_KIT/build.mjs" check "$REPO/docs"
```

După aceștia: `node --test tests/*.test.mjs` în depozit și `node tools/sync-catalog.mjs --check --root <părintele depozitelor>` în hub (cardul Pendulul citește `docs/`).

## Rezultatul verificării

Într-o copie curată a depozitului, secvența de mai sus reproduce `docs/index.html` la nivel de conținut: diferă doar trei linii de metadate derivate (`data-fff-hash`,
`sizeBytes`/`sha256` din blocul `fff-info` și copia de rezervă `orig` a CSP-ului din blocul `fff:pwa`). `docs/sw.js`, `docs/manifest.webmanifest` și pictogramele ies
identice octet cu octet. `dist/pendulul-3d.html` iese identic, cu excepția a trei etichete de versiune (`application-version`, `last-updated`, `#app-version`): un build nou
le scrie `2.2.3` / `2026-11-20`, iar fișierul publicat le păstrează intenționat la `2.2.0` / `2026-10-27` (vezi `CHANGELOG.md`, 2.2.3: bundle-ul 3D al ediției autonome nu
s-a schimbat de la 2.2.0). Dacă bundle-ul rămâne neschimbat, după pasul 3 se restabilesc cele trei etichete la valorile vechi.

## three.js rămâne la 0.160 (decizie de compatibilitate)

`package.json` fixează `three` la `^0.160.0` (pe 0.x, asta înseamnă doar 0.160.x). Începând cu r163, `WebGLRenderer` nu mai acceptă WebGL 1 (note de lansare three.js r163).
Cu 0.160 există încă rezerva WebGL 1, iar proba de pornire a aplicației acceptă `webgl2` sau `webgl` (`simulare/src/main.js`); dacă simularea chiar rulează pe un dispozitiv doar
cu WebGL 1 nu s-a verificat (nu există un astfel de dispozitiv în mediul de test). O trecere la r163 sau mai nou ar elimina oricum acea cale, ceea ce contravine țintei de
compatibilitate cu browsere vechi a aplicațiilor.
Încercarea din 20 noiembrie 2026 cu three 0.187.0, într-o copie separată: se construiește; în Chrome 153 headless (SwiftShader) pornește fără erori noi, capturile cu aceeași scenă
diferă în medie sub 1,5/255 pe canal, iar o secvență de 30 de acțiuni aleatoare, aceeași pe ambele versiuni (butoane, selectoare, tragere, rotiță, redimensionare), nu produce nicio eroare sau avertisment în consolă,
ca la 0.160 (o a doua secvență a depășit timpul pe 0.160 din cauza randării software și nu s-a comparat). Adoptarea ar cere o decizie asupra dispozitivelor doar cu WebGL 1, reconstruirea cu pașii de mai sus și o verificare pe dispozitive reale; nu s-a făcut.
