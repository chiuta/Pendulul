// Modelul numeric al seriei PENDULUL, calibrat pe CANON2 (rev/CANON2.md) și atlas.md.
// Perioada pendulului n: 216 - 4n ani (P1 = 212, P20 = 136, P21 = 132). Plasa are P/4 fire.
// Fazele sunt FIXE: Apropierea 34 de ani, Fereastra 112 - 4n luni, Trecerea 4 luni, Îndepărtarea 39 de ani,
// Adâncul = restul (P20: 60 de ani). Capacitatea rachetelor: (luni - 23) x 10 (P20 = 90, P21 = 50, P22 = 10, P23 = 0).

export const PHASES = [
  { id: 'apropiere', name: 'Apropierea', color: '#6db2ff' },
  { id: 'fereastra', name: 'Fereastra', color: '#ffe08a' },
  { id: 'trecere', name: 'Trecerea', color: '#ff5b48' },
  { id: 'indepartare', name: 'Îndepărtarea', color: '#c18cff' },
  { id: 'adanc', name: 'Adâncul', color: '#5f7fa6' },
];

export const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const sstep = (x) => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };

export const N_MIN = 1;
export const N_MAX = 28; // P28: Fereastra ajunge la 0 luni (perioada ar fi 0 abia la P54)
export const N_NOW = 20;

const cache = new Map();
export function pend(n) {
  n = clamp(Math.round(Number.isFinite(n) ? n : N_NOW), N_MIN, N_MAX);
  if (cache.has(n)) return cache.get(n);
  const P = 216 - 4 * n;
  const Wm = Math.max(0, 112 - 4 * n);
  const W = Wm / 12;
  const T = 1 / 3;
  const A = 34;
  const I = 39;
  const D = Math.max(0.5, P - A - W - T - I);
  const bounds = [0, A, A + W, A + W + T, A + W + T + I, A + W + T + I + D];
  const out = { n, P: bounds[5], periodCanon: P, W, Wm, T, A, I, D, bounds, fires: P / 4 };
  cache.set(n, out);
  return out;
}

export function phaseAt(p, t) {
  const b = p.bounds;
  if (!(t > 0)) return { i: 0, u: 0 };
  for (let i = 0; i < 5; i++) {
    if (t < b[i + 1]) {
      const span = b[i + 1] - b[i];
      return { i, u: span > 0 ? clamp((t - b[i]) / span, 0, 1) : 0 };
    }
  }
  return { i: 4, u: 1 };
}

// Distanța planetei față de gaura neagră, pe axa X (unități de scenă).
export const R_NEAR = 18;
export const R_WIN = 26;
export const R_MID = 300;
export const R_FAR = 700;

export function radialPos(p, t) {
  const { i, u } = phaseAt(p, t);
  const s = (x) => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };
  const pw = (x, k) => Math.pow(clamp(x, 0, 1), k);
  switch (i) {
    case 0: return R_WIN + (R_MID - R_WIN) * (1 - s(pw(u, 0.55)));
    case 1: return R_WIN - 6 * s(u);
    case 2: return 20 - 2 * Math.sin(Math.PI * u);
    case 3: return 20 + (R_MID - 20) * (1 - s(pw(1 - u, 0.55)));
    default: return R_MID + (R_FAR - R_MID) * Math.pow(Math.sin(Math.PI * u), 2);
  }
}

// ---------- Rachete ----------
// Capacitatea ghildei de la câmp: (luni - 23) x 10 (P20 = 90, P21 = 50, P22 = 10, P23 = 0); în Ferestrele lungi, formal, mai mult de 90.
// Prima lansare consemnată e în P7 (Vedran, n-a ajuns); înainte de P7 nu există rachete.
export function rocketCap(n) {
  if (n < 7) return 0;
  const Wm = 112 - 4 * n;
  return Math.max(0, Math.round((Wm - 23) * 10));
}
// Câte rachete pleacă efectiv în simulare. Capacitatea nu se folosește la maxim în epocile timpurii
// (CANON2 C-02): P7-P10 sunt doar încercări izolate (cifre schematice, necanonice). P19: 110 rachete (vol. 5);
// P21: cincizeci încărcate, patruzeci și una pornite, nouă mute (DECIZII3 D3). Celelalte Ferestre, cel mult 90 în animație.
export function rocketPlan(n) {
  const cap = rocketCap(n);
  if (!cap) return 0;
  if (n < 11) return Math.min(cap, [1, 2, 3, 5][n - 7]);
  if (n === 19) return 110;
  if (n === 21) return 41;
  return Math.min(cap, 90);
}
// Câte ajung pe orbită: nimic înainte de P11 (primul obiect pe orbită), apoi crește pe epoci.
export function rocketSuccess(n) {
  if (n < 11) return 0;
  if (n <= 13) return 0.1;
  if (n <= 15) return 0.25;
  if (n <= 19) return 0.45;
  return 0.6;
}
// Salvele: prima (un rând de zece) la ~5 luni după deschiderea Ferestrei, ultima cu cel puțin o lună înaintea Trecerii.
export function salvoPlan(n) {
  const L = rocketPlan(n);
  if (!L) return [];
  const Wm = 112 - 4 * n;
  const u1 = Math.min(5 / Wm, 0.9);
  const u2 = Math.max(u1, (Wm - 1) / Wm);
  const rows = Math.ceil(L / 10);
  const out = [];
  for (let k = 0; k < rows; k++) out.push({ u: rows === 1 ? u1 : u1 + ((u2 - u1) * k) / (rows - 1), n: Math.min(10, L - 10 * k) });
  return out;
}
// Câmpul de lansare pe pendule (CANON2 C-35).
export function launchField(n) {
  if (n <= 10) return 'Câmpul Alb';
  if (n <= 15) return 'Gura Cenușie';
  if (n <= 19) return 'Gura Văii';
  if (n === 20) return 'Platoul Rampelor';
  return 'Valea Oaselor';
}

export function epochOf(n) {
  if (n <= 3) return 'Epoca Fricii';
  if (n <= 7) return 'Epoca Calendarului';
  if (n <= 11) return 'Epoca Lanternelor';
  if (n <= 15) return 'Schisma';
  if (n <= 19) return 'Epoca Fanarelor';
  if (n === 20) return 'Acum';
  return 'Viitor';
}
export const EPOCH_COLORS = ['#7a6a9a', '#7a8fbf', '#d3a36a', '#c26a6a', '#6fbf9a', '#ffbd5a', '#8e97ab'];
export function epochIndex(n) { return n <= 3 ? 0 : n <= 7 ? 1 : n <= 11 ? 2 : n <= 15 ? 3 : n <= 19 ? 4 : n === 20 ? 5 : 6; }

// Ferestre în care mai încap rachete. Fereastra pendulului curent nu mai contează după ce s-a închis (faza >= Trecerea).
export function windowsLeft(n, phaseIdx = 0) {
  let c = 0;
  for (let k = n; k <= N_MAX; k++) {
    if (k === n && phaseIdx >= 2) continue;
    if (rocketCap(k) > 0) c++;
  }
  return c;
}
export const LAST_ROCKET_PEND = (() => { let l = 0; for (let k = N_MIN; k <= N_MAX; k++) if (rocketCap(k) > 0) l = k; return l; })();

// ---------- Plasa ----------
// Numărul firelor = perioada / 4. În P20, întrebările rup firul în avans: 34 -> 33 (DE CE, Kessa) -> 32 (a doua întrebare).
// În Fereastra P21 oglinzile arată din nou 33 (firul e ținut în pumn), apoi P22 are 32.
export const MAX_QUESTIONS = 2;
export function firesOf(n, asked = 0) {
  const base = pend(n).fires;
  return n === N_NOW ? base - clamp(asked, 0, MAX_QUESTIONS) : base;
}

// ---------- Fanarele ----------
// Registrul numără șapte: Unu, Cinci, Șase, Șapte, Opt, Nouă, Zece. Unu s-a aprins în P16, Șapte a fost ridicat în P18;
// Șase (patru coșuri) a fost tăiat și pierdut în Cimitir după P19, deci în P20 sunt șase vii.
export const FANARE = [
  { nm: 'Unu', from: 16, to: 99, ring: 'Cercul Cenușiu' },
  { nm: 'Cinci', from: 17, to: 99, ring: 'Cercul Mijlociu' },
  { nm: 'Șase', from: 18, to: 19, ring: 'Cercul Mijlociu' },
  { nm: 'Șapte', from: 18, to: 99, ring: 'Cercul Înalt' },
  { nm: 'Opt', from: 19, to: 99, ring: 'Cercul Înalt' },
  { nm: 'Nouă', from: 19, to: 99, ring: 'Cercul Înalt' },
  { nm: 'Zece', from: 19, to: 99, ring: 'Cercul Înalt' },
];
export function fanareAlive(n) { return FANARE.filter((f) => n >= f.from && n <= f.to).length; }

export const ORBIT_R = 1.06; // Fanarele, în raze planetare (~360 km, perioadă ~90 de minute)
export const CIM_R = 1.25; // Cimitirul, retrograd
export const PLASA_R = 9; // Plasa, pe axa orbitei, fixă față de stele

export const STAR_DEFS = [
  { name: 'Galbena', R: 10, L: 1.0, col: [1.0, 0.8, 0.45], orbitR: 55, x: 250, period: 9, ph: 0.0 },
  { name: 'Roșia', R: 16, L: 0.7, col: [1.0, 0.36, 0.22], orbitR: 90, x: 275, period: 23, ph: 2.1 },
  { name: 'Palida', R: 4, L: 0.12, col: [0.72, 0.8, 1.0], orbitR: 130, x: 238, period: 5, ph: 4.2 },
];

// ---------- Locurile (atlas.md, cu corecțiile CANON2 C-34: Platoul Rampelor e lângă Vădrea) ----------
// in: în ce straturi apare. st: starea pe cele cinci foi ale Volumului 3 (I Apropierea ... V Adâncul).
// c: apă (ocean), usc (uscat), mt (munte), gh (gheață).
const S = (...a) => a.map(([c, t]) => ({ c, t }));
export const PLACES = [
  { id: 'vadrea', name: 'Vădrea', lat: 38, lon: 1.5, in: { places: 1 } },
  { id: 'rampe', name: 'Platoul Rampelor', lat: 38, lon: 2, in: { places: 1, hemi: 1, atlas: 1 },
    st: S(['usc', 'uscat'], ['usc', 'uscat'], ['usc', 'uscat'], ['usc', 'uscat'], ['gh', 'pustiu alb']) },
  { id: 'piscul', name: 'Piscul Tăcut', lat: 38.12, lon: 1.5, in: { places: 1, atlas: 1 },
    st: S(['mt', 'munte'], ['mt', 'munte'], ['mt', 'munte'], ['mt', 'munte'], ['gh', 'munte cu ghețar']) },
  { id: 'ahlen', name: 'Pasul Ahlen', lat: 52, lon: -21, in: { places: 1, atlas: 1 },
    st: S(['mt', 'trecătoare de piatră'], ['mt', 'trecătoare de piatră'], ['mt', 'trecătoare de piatră'], ['mt', 'trecătoare de piatră'], ['gh', 'cuvânt scris cu gheață']) },
  { id: 'cenusar', name: 'Cenușarul', lat: 58, lon: 10, in: { places: 1 } },
  { id: 'treiamurg', name: 'Treiamurg', lat: 83, lon: 0, in: { places: 1 } },
  { id: 'amurg', name: 'Ultimul Amurg', lat: -84, lon: 0, in: { places: 1 } },
  { id: 'golful', name: 'Golful Cenușiu', lat: -29, lon: 62, in: { places: 1, hemi: 1, atlas: 1 },
    st: S(['apa', 'ocean'], ['apa', 'ocean'], ['mt', 'poartă de stâncă'], ['mt', 'poartă de stâncă'], ['gh', 'fiord înghețat']) },
  { id: 'marea', name: 'Marea Largă', lat: 0, lon: 80, in: { hemi: 1, atlas: 1 },
    st: S(['apa', 'ocean'], ['apa', 'ocean'], ['mt', 'fundul se rupe'], ['mt', 'lagună între creste'], ['gh', 'gheață de o jumătate de kilometru']) },
  { id: 'dovan', name: 'Strâmtoarea Dovan', lat: 12, lon: 48, in: { hemi: 1, atlas: 1 },
    st: S(['apa', 'apă curentă'], ['usc', 'vad'], ['mt', 'defileu'], ['mt', 'defileu'], ['gh', 'crăpătură înghețată']) },
  { id: 'pelon', name: 'Insula Pelon', lat: 5, lon: 80, in: { hemi: 1, atlas: 1 },
    st: S(['usc', 'ostrov'], ['usc', 'ostrov'], ['mt', 'vârf'], ['mt', 'vârf'], ['gh', 'calotă de gheață']) },
  { id: 'oase', name: 'Valea Oaselor', lat: 38, lon: 2, in: { hemi: 1, atlas: 1 },
    st: S(['apa', 'fund de mare'], ['usc', 'albie uscată'], ['mt', 'falie'], ['usc', 'vale de cenușă'], ['gh', 'cimitir sub zăpadă']) },
  { id: 'desert', name: 'Deșertul Uitat', lat: 0, lon: -125, in: { hemi: 1 } },
];
export const ATLAS_COLORS = { apa: '#4aa3ff', usc: '#d9c8a0', mt: '#ff9a5a', gh: '#e8f2ff' };
export const FOI = ['I Apropierea', 'II Fereastra', 'III Trecerea', 'IV Îndepărtarea', 'V Adâncul'];

// Cele cinci cosmologii din Volumul 8 (Sărătura, Crestele, Umbrele, Cărbunele, Fanarele).
export const CULTURES = [
  { name: 'Sărătura', north: 'fața (partea din care se ridică apa)', color: '#55c2ff', consts: ['Năvodul', 'Peștele cu Trei Ochi', 'Plutitorul'] },
  { name: 'Crestele', north: 'Pragul', color: '#ffc46b', consts: ['Scara de Piatră', 'Cei Șapte Pași', 'Ciobanul Pietrei'] },
  { name: 'Umbrele', north: 'umbra', color: '#b79bff', consts: ['Berbecul Orb', 'Iapa Care Se Întoarce', 'Câinele cu Două Cozi'] },
  { name: 'Cărbunele', north: 'căldura (spre inimă, spre piele)', color: '#ff7a5c', consts: ['Ciocanul', 'Cele Patru Lovituri', 'Cele Trei'] },
  { name: 'Fanarele', north: 'Nodul, adică Plasa', color: '#9bf0c8', consts: ['Nodul', 'Cuiul', 'Firele', 'Inelul'] },
];

// Vol. 9: 1° de fază = P20 / 360 ani (~0,378 ani, 105 km). Un circuit al pendulului 20 are 360°, al pendulului 21 are 349°.
export const DEG_YEARS = 136 / 360;

export const VOLUMES = [
  { n: 1, title: 'Arhivista', map: 'Harta pe latitudini', view: 'planeta', layers: ['bands', 'places'],
    text: 'Centura luminată (30° S – 45° N), centura de umbră (45°–72° N și 30°–72° S) și calotele polare cu trei amurguri, desenate pe planetă.' },
  { n: 2, title: 'Patru voci', map: 'Emisfera mareei', view: 'maree', layers: ['hemi', 'places'],
    text: 'O emisferă adună oceanul spre Golul, cealaltă rămâne ocru și uscată; între ele, Țărmul Mișcător. Oceanul și deșertul își schimbă locul în aproximativ patru decenii.' },
  { n: 3, title: 'Cinci faze', map: 'Atlas în cinci foi', view: 'planeta', layers: ['atlas'],
    text: 'Aceleași opt locuri, pe cinci foi, câte una pe fază: ocean în Apropiere și Fereastră, munte în Trecere și Îndepărtare, gheață în Adânc. Mută timpul prin faze.' },
  { n: 4, title: 'Arhivele', map: 'Harta subterană a Adâncului', view: 'corte', layers: ['cut'],
    text: 'Secțiune prin scoarță, la scară liniară (doar scoarța e desenată, nu planeta): Scara Mare cu 1.212 trepte, cele patru galerii cu cetățile lor, Peretele de Cărbune la 1.400 m și peșterile care bat, în serii de patru, apoi de trei.' },
  { n: 5, title: 'Fanarele', map: 'Harta orbitală', view: 'orbita', layers: ['orbital'],
    text: 'Fanarele la 1,06 R (șapte în registru, șase vii în P20), Cimitirul retrograd la 1,25 R și Plasa la 9 R, fixă față de stele, cu P/4 fire. Întreabă Plasa și un fir se rupe.' },
  { n: 6, title: 'Cele douăzeci de pendule', map: 'Harta timpului', view: 'sistem', layers: ['timemap', 'path'],
    text: 'Perioada se strânge cu patru ani la fiecare pendul, iar Fereastra cu patru luni. Harta arată toate pendulele, epocile lor și faza curentă.' },
  { n: 7, title: 'Cel din toate pendulele', map: 'Harta umbrelor', view: 'umbre', layers: ['shadows'],
    text: 'Cine e acoperit de care stea și când: conurile de umbră ale planetei (câte unul pentru fiecare stea) și eclipsele dintre stele. În Trecere, Golul acoperă toate stelele.' },
  { n: 8, title: 'Cei care nu vorbesc', map: 'O lume cu nord rătăcitor', view: 'cer', layers: ['sky'],
    text: 'Cinci culturi, cinci cosmologii. Fiecare își alege alt nord și alte constelații, dar toate lasă același gol, în direcția Golului.' },
  { n: 9, title: 'Cel care ajustează orbita', map: 'Lumea care nu se închide', view: 'sistem', layers: ['path', 'orbital', 'ribbon'], inverse: true,
    text: 'Cronologie inversă: de la pendulul 20 la 1, iar perioada crește cu patru ani la fiecare pas. Panglica de fază nu se închide: la P21 lipsesc 11° (patru ani, un fir).' },
];
