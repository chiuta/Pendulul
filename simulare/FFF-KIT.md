# De ce `docs/index.html` nu are blocul `fff:kit` (și ce trebuie făcut dacă îl vrei)

Pendulul nu are `index.html` în rădăcina depozitului: pagina publicată de GitHub Pages este `docs/index.html`,
**generată** de `simulare/build.mjs` (esbuild + three), care scrie și `dist/pendulul-3d.html`.
(English: Pendulul has no root `index.html`; the published page is the generated `docs/index.html`.)

## Starea verificată

- `docs/index.html` are blocul `fff:pwa` (înregistrarea service worker-ului), plus `docs/sw.js` și `docs/manifest.webmanifest`.
- `docs/index.html` **nu** are blocul `fff:kit` (anti-clickjacking, PBKDF2, etichetă citibilă de mașină) și nu există `app.json`.
- `simulare/build.mjs` rescrie `docs/index.html` din șablonul propriu și **nu reproduce blocul `fff:pwa`**. La următorul `npm run build`, înregistrarea service worker-ului dispare din pagina publicată, fără ca vreun test să o semnaleze.
- O probă de `fff-kit apply` pe o copie a lui `docs/index.html` a mers (`check ok`, aproximativ +114 KB, cu avertismentul „lipsește #app-version”).

## De ce nu am adăugat blocul acum

Orice modificare directă a lui `docs/index.html` s-ar pierde la următorul `npm run build`, iar `node_modules` (esbuild, three) nu era disponibil la verificare, deci build-ul nu a putut fi rulat și testat. Un bloc adăugat de mână ar da o falsă siguranță.

## Pașii recomandați (decizia autorului)

1. În `simulare/build.mjs`, după scrierea lui `docs/index.html`, apelează `fff-kit apply` și `fff-kit info`, apoi pașii PWA (`pwa/pwa.mjs`), astfel încât blocurile `fff:kit` și `fff:pwa` să fie reproduse la fiecare build.
2. Adaugă `#app-version` și meta `application-version` / `last-updated` în șablon (versiunea din `simulare/package.json`).
3. Adaugă un pas de verificare în `npm run build`: `fff-kit check docs/index.html` (trebuie „check ok”) și `test -f docs/sw.js`.
4. Rulează build-ul, testele, apoi `node tools/sync-catalog.mjs` în hub (cardul Pendulul citește `docs/`).
