import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { initReader, openReader } from './reader.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import {
  PHASES, pend, phaseAt, radialPos, rocketCap, rocketPlan, rocketSuccess, salvoPlan, launchField, epochOf, epochIndex, EPOCH_COLORS,
  windowsLeft, LAST_ROCKET_PEND, firesOf, MAX_QUESTIONS, FANARE, ORBIT_R, CIM_R, PLASA_R, DEG_YEARS,
  clamp, lerp, sstep, N_MIN, N_MAX, N_NOW, R_NEAR, STAR_DEFS, PLACES, ATLAS_COLORS, FOI,
  CULTURES, VOLUMES,
} from './canon.js';
import {
  OBJ_VS, PLANET_FS, CLOUD_FS, ATMO_FS, STAR_FS, DISK_VS, DISK_FS, RING_FS, LENS_VS, LENS_FS,
  CUT_FS, PART_VS, PART_FS,
} from './shaders.js';

const $ = (id) => document.getElementById(id);
const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const fmt = (x, d = 1) => x.toFixed(d).replace('.', ',');

function rng(seed) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}


// ---------- Fără WebGL: cititorul de volume rămâne utilizabil ----------
let readerStarted = false;
function startReaderOnly(err) {
  try { console.error('Scena 3D nu a pornit:', err); } catch (e) { /* fără consolă */ }
  document.body.classList.add('nogl');
  const msg = $('noglMsg');
  if (msg) msg.hidden = false;
  const c = $('gl'); if (c) c.hidden = true;
  const list = $('noglVols');
  if (list) {
    list.innerHTML = '';
    VOLUMES.forEach((v) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'btn';
      b.textContent = `Vol. ${v.n} · ${v.title}`;
      b.addEventListener('click', () => openReader(v.n));
      list.appendChild(b);
    });
  }
  if (!readerStarted) {
    readerStarted = true;
    try { initReader({ gotoPend: () => {}, selectVolume: () => {}, hasMap: () => false }); } catch (e) { /* cititorul nu a putut porni */ }
  }
}

function bootScene() {

// ---------- Randare ----------
const canvas = $('gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
renderer.setClearColor(0x000000, 1);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, 1, 0.05, 6000);
camera.position.set(4, 2, 6);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.07;
controls.minDistance = 1.5;
controls.maxDistance = 3000;
controls.zoomSpeed = 0.9;
controls.rotateSpeed = 0.7;

const rt = new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, samples: 4 });
const composer = new EffectComposer(renderer, rt);
composer.addPass(new RenderPass(scene, camera));
const lensPass = new ShaderPass({
  uniforms: { tDiffuse: { value: null }, uC: { value: new THREE.Vector2(0.5, 0.5) }, uR: { value: 0.05 }, uAspect: { value: 1 }, uOn: { value: 0 } },
  vertexShader: LENS_VS,
  fragmentShader: LENS_FS,
});
const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.8, 0.4, 1.0);
composer.addPass(bloom);
composer.addPass(lensPass);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
composer.addPass(new OutputPass());

// ---------- Stare ----------
const LAYER_DEFS = [
  { id: 'places', label: 'Locuri pe planetă', on: true },
  { id: 'orbital', label: 'Fanare, Cimitir, Plasa (V5)', on: true },
  { id: 'bands', label: 'Latitudini (V1)', on: false },
  { id: 'hemi', label: 'Emisfera mareei (V2)', on: false },
  { id: 'atlas', label: 'Atlas în cinci foi (V3)', on: false },
  { id: 'cut', label: 'Secțiune subterană (V4)', on: false },
  { id: 'timemap', label: 'Harta timpului (V6)', on: false },
  { id: 'ribbon', label: 'Panglica de fază (V9)', on: false },
  { id: 'shadows', label: 'Umbre și eclipse (V7)', on: false },
  { id: 'sky', label: 'Constelații și nord (V8)', on: false },
  { id: 'path', label: 'Traiectoria pendulului', on: true },
  { id: 'lens', label: 'Lentilă gravitațională', on: true },
];

const S = {
  n: 20, t: 31, playing: true, speedExp: 0.6, autoSlow: true, inverse: false,
  absT: 0, view: 'planeta', follow: true, vdef: null, tween: null,
  layers: {}, vol: 0, asked: 0, culture: 0, launched: 0, arrived: 0, failed: 0, salvo: 0, spawnQ: 0, spawnAcc: 0, shortLight: 0,
  speedNow: 4, shake: 0, askFlash: 0, beatT: 0, beatQ: -1, phase: 0, Rrel: 1, tideSign: 1, spawnDelay: 0,
};
const REDUCE = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
const safe = (x, d = 0) => (Number.isFinite(x) ? x : d);
LAYER_DEFS.forEach((l) => { S.layers[l.id] = l.on; });
if (REDUCE) S.playing = false;

// ---------- Cer ----------
const skyRoot = new THREE.Group();
scene.add(skyRoot);
{
  const r = rng(7);
  const N = 7000;
  const pos = new Float32Array(N * 3);
  const col = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    let x, y, z;
    if (r() < 0.45) { // bandă densă, ca o galaxie
      const a = r() * Math.PI * 2;
      const g = (r() + r() + r() - 1.5) * 0.28;
      x = Math.cos(a); z = Math.sin(a); y = g;
      const bx = x, by = y * 0.94 + z * 0.34, bz = z * 0.94 - y * 0.34;
      x = bx; y = by; z = bz;
    } else {
      const u = r() * 2 - 1, a = r() * Math.PI * 2, s = Math.sqrt(1 - u * u);
      x = s * Math.cos(a); y = u; z = s * Math.sin(a);
    }
    const l = Math.hypot(x, y, z);
    pos[i * 3] = x / l * 4000; pos[i * 3 + 1] = y / l * 4000; pos[i * 3 + 2] = z / l * 4000;
    const t = r();
    const b = 0.25 + Math.pow(r(), 3) * 1.2;
    col[i * 3] = (0.75 + 0.25 * (1 - t)) * b;
    col[i * 3 + 1] = (0.8 + 0.1 * t) * b;
    col[i * 3 + 2] = (0.9 + 0.1 * t) * b;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const m = new THREE.PointsMaterial({ size: 1.7, sizeAttenuation: false, vertexColors: true, depthWrite: false, transparent: true, opacity: 0.95 });
  const pts = new THREE.Points(g, m);
  pts.renderOrder = -10;
  pts.frustumCulled = false;
  skyRoot.add(pts);
}

// Constelații pe culturi (Volumul 8)
const consGroups = [];
const consLabels = [];
{
  const r = rng(99);
  CULTURES.forEach((cu, ci) => {
    const grp = new THREE.Group();
    const lineV = [];
    const dotV = [];
    cu.consts.forEach((nm, k) => {
      // centrele stau în fața vederii „cer” (Volumul 8), ca să se vadă fără să cauți: un evantai de ~40°, cu golul la dreapta
      const f0 = V3(-0.92, -0.15, 0.34).normalize();
      const rt = V3().crossVectors(f0, V3(0, 1, 0)).normalize();
      const up0 = V3().crossVectors(rt, f0).normalize();
      const az = (-34 + (k * 46) / Math.max(1, cu.consts.length - 1)) * Math.PI / 180;
      const el = ((k % 2 ? 1 : -1) * 6 + (r() - 0.5) * 8) * Math.PI / 180;
      const c = f0.clone().multiplyScalar(Math.cos(az) * Math.cos(el)).addScaledVector(rt, Math.sin(az) * Math.cos(el)).addScaledVector(up0, Math.sin(el)).normalize();
      const pts = [];
      const up = Math.abs(c.y) > 0.9 ? V3(1, 0, 0) : V3(0, 1, 0);
      const a = V3().crossVectors(c, up).normalize();
      const b = V3().crossVectors(c, a).normalize();
      const cnt = 6 + Math.floor(r() * 3);
      for (let i = 0; i < cnt; i++) {
        const ang = (i / cnt) * 2.4 + r() * 0.5;
        const rad = 0.09 + r() * 0.1;
        pts.push(c.clone().addScaledVector(a, Math.cos(ang) * rad * (1 + i * 0.12)).addScaledVector(b, Math.sin(ang) * rad * (1 + i * 0.12)).normalize().multiplyScalar(3900));
      }
      for (let i = 0; i < pts.length; i++) {
        dotV.push(pts[i].x, pts[i].y, pts[i].z);
        if (i > 0) lineV.push(pts[i - 1].x, pts[i - 1].y, pts[i - 1].z, pts[i].x, pts[i].y, pts[i].z);
      }
      consLabels.push({ ci, text: nm, dir: c.clone().multiplyScalar(3900) });
    });
    const lg = new THREE.BufferGeometry();
    lg.setAttribute('position', new THREE.Float32BufferAttribute(lineV, 3));
    const lines = new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: new THREE.Color(cu.color), transparent: true, opacity: 0.6, depthWrite: false }));
    const dg = new THREE.BufferGeometry();
    dg.setAttribute('position', new THREE.Float32BufferAttribute(dotV, 3));
    const dots = new THREE.Points(dg, new THREE.PointsMaterial({ color: new THREE.Color(cu.color), size: 5, sizeAttenuation: false, depthWrite: false }));
    lines.frustumCulled = false; dots.frustumCulled = false;
    grp.add(lines, dots);
    grp.visible = false;
    skyRoot.add(grp);
    consGroups.push(grp);
  });
}

// Volumul 8: patru stele comune tuturor celor cinci ceruri și un gol între ele, în direcția Golului.
const GAP_RING = 40;
const gapGroup = new THREE.Group();
gapGroup.visible = false;
const gapStars = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(new Float32Array(12), 3)),
  new THREE.PointsMaterial({ color: 0xfff1cf, size: 7, sizeAttenuation: false, depthWrite: false }));
const gapLoop = new THREE.LineLoop(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(new Float32Array(GAP_RING * 3), 3)),
  new THREE.LineBasicMaterial({ color: 0xfff1cf, transparent: true, opacity: 0.45, depthWrite: false }));
gapStars.frustumCulled = false; gapLoop.frustumCulled = false;
gapGroup.add(gapStars, gapLoop);
skyRoot.add(gapGroup);
const gapDir = V3(-1, 0, 0);
function updateGap(from) {
  gapDir.copy(from).negate();
  if (gapDir.lengthSq() < 1e-6) gapDir.set(-1, 0, 0);
  gapDir.normalize();
  const up = Math.abs(gapDir.y) > 0.9 ? V3(1, 0, 0) : V3(0, 1, 0);
  const a = V3().crossVectors(gapDir, up).normalize();
  const b = V3().crossVectors(gapDir, a).normalize();
  const sp = gapStars.geometry.attributes.position;
  const R = 3900, off = 0.11;
  [[1, 1], [-1, 1], [-1, -1], [1, -1]].forEach(([x, y], k) => {
    const p = gapDir.clone().addScaledVector(a, x * off).addScaledVector(b, y * off).normalize().multiplyScalar(R);
    sp.setXYZ(k, p.x, p.y, p.z);
  });
  sp.needsUpdate = true;
  const lp = gapLoop.geometry.attributes.position;
  for (let i = 0; i < GAP_RING; i++) {
    const t = (i / GAP_RING) * Math.PI * 2;
    const p = gapDir.clone().addScaledVector(a, Math.cos(t) * 0.07).addScaledVector(b, Math.sin(t) * 0.07).normalize().multiplyScalar(R);
    lp.setXYZ(i, p.x, p.y, p.z);
  }
  lp.needsUpdate = true;
}

// ---------- Texturi mici ----------
function glowTexture(inner = 'rgba(255,255,255,1)', mid = 'rgba(255,255,255,0.25)') {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, inner); gr.addColorStop(0.25, mid); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
function ringTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  g.strokeStyle = 'rgba(255,255,255,0.95)'; g.lineWidth = 5;
  g.beginPath(); g.arc(64, 64, 46, 0, Math.PI * 2); g.stroke();
  g.lineWidth = 3; g.beginPath(); g.moveTo(64, 4); g.lineTo(64, 22); g.moveTo(64, 106); g.lineTo(64, 124); g.moveTo(4, 64); g.lineTo(22, 64); g.moveTo(106, 64); g.lineTo(124, 64); g.stroke();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const GLOW = glowTexture();
function glowSprite(color, scale, opacity = 1) {
  const m = new THREE.SpriteMaterial({ map: GLOW, color, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity });
  const s = new THREE.Sprite(m);
  s.scale.setScalar(scale);
  return s;
}

// ---------- Gaura neagră (Golul) ----------
const BH_RS = 2;
const bh = new THREE.Group();
scene.add(bh);
const bhShadow = new THREE.Mesh(new THREE.SphereGeometry(BH_RS, 48, 32), new THREE.MeshBasicMaterial({ color: 0x000000 }));
bh.add(bhShadow);
const diskMat = new THREE.ShaderMaterial({
  uniforms: { uTime: { value: 0 }, uInner: { value: 3 }, uOuter: { value: 9 } },
  vertexShader: DISK_VS, fragmentShader: DISK_FS,
  transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
});
const diskTilt = new THREE.Group();
diskTilt.rotation.set(0.22, 0, 0.12);
const disk = new THREE.Mesh(new THREE.RingGeometry(3, 9, 160, 6), diskMat);
disk.rotation.x = -Math.PI / 2;
diskTilt.add(disk);
bh.add(diskTilt);
const photonRing = new THREE.Mesh(new THREE.RingGeometry(2.02, 2.34, 96, 1), new THREE.ShaderMaterial({
  vertexShader: DISK_VS, fragmentShader: RING_FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
}));
bh.add(photonRing);
const bhGlow = glowSprite(0xffa860, 26, 0.16);
bh.add(bhGlow);

// ---------- Stelele ----------
const stars = STAR_DEFS.map((d) => {
  const mat = new THREE.ShaderMaterial({
    uniforms: { uCol: { value: new THREE.Color(d.col[0], d.col[1], d.col[2]) }, uTime: { value: 0 } },
    vertexShader: OBJ_VS, fragmentShader: STAR_FS,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(d.R, 48, 32), mat);
  const glow = glowSprite(new THREE.Color(d.col[0], d.col[1], d.col[2]), d.R * 9, 0.75);
  const group = new THREE.Group();
  group.add(mesh, glow);
  scene.add(group);
  return { ...d, mesh, group, glow, pos: V3(), mat };
});

// ---------- Traiectoria ----------
const pathGroup = new THREE.Group();
scene.add(pathGroup);
{
  const g = new THREE.BufferGeometry().setFromPoints([V3(R_NEAR - 6, 0, 0), V3(720, 0, 0)]);
  const l = new THREE.Line(g, new THREE.LineDashedMaterial({ color: 0x8fa3d0, dashSize: 6, gapSize: 5, transparent: true, opacity: 0.55 }));
  l.computeLineDistances();
  pathGroup.add(l);
  const tick = [];
  for (let x = 100; x <= 700; x += 100) tick.push(x, -3, 0, x, 3, 0);
  const tg = new THREE.BufferGeometry();
  tg.setAttribute('position', new THREE.Float32BufferAttribute(tick, 3));
  pathGroup.add(new THREE.LineSegments(tg, new THREE.LineBasicMaterial({ color: 0x8fa3d0, transparent: true, opacity: 0.5 })));
  // orbitele stelelor, ca inele în jurul axei
  STAR_DEFS.forEach((d) => {
    const pts = [];
    for (let i = 0; i <= 96; i++) { const a = (i / 96) * Math.PI * 2; pts.push(V3(d.x, d.orbitR * Math.cos(a), d.orbitR * Math.sin(a))); }
    const og = new THREE.BufferGeometry().setFromPoints(pts);
    pathGroup.add(new THREE.Line(og, new THREE.LineBasicMaterial({ color: new THREE.Color(d.col[0], d.col[1], d.col[2]), transparent: true, opacity: 0.22 })));
  });
}
const planetMarker = new THREE.Sprite(new THREE.SpriteMaterial({ map: ringTexture(), color: 0x9fd0ff, transparent: true, depthWrite: false, depthTest: false }));
planetMarker.renderOrder = 20;
scene.add(planetMarker);

// ---------- Planeta ----------
const planetRoot = new THREE.Group();
scene.add(planetRoot);
const tideGroup = new THREE.Group();
planetRoot.add(tideGroup);
const tilt = new THREE.Group();
tilt.rotation.z = 0.41;
tideGroup.add(tilt);
const pivot = new THREE.Group();
tilt.add(pivot);

const lightDirs = [V3(1, 0, 0), V3(1, 0, 0), V3(1, 0, 0)];
const lightCols = [new THREE.Color(), new THREE.Color(), new THREE.Color()];
const shared = {
  uLDir: { value: lightDirs }, uLCol: { value: lightCols }, uCut: { value: 0 },
  uCutN: { value: V3(0, 0, 1) }, uCutC: { value: V3() }, uTime: { value: 0 },
};
const planetMat = new THREE.ShaderMaterial({
  uniforms: {
    ...shared, uSea: { value: 0.52 }, uMount: { value: 0.5 }, uIce: { value: 0 }, uTide: { value: 0 },
    uLava: { value: 0 }, uBands: { value: 0 }, uHemi: { value: 0 }, uTemp: { value: 288 }, uTideObj: { value: V3(-1, 0, 0) },
  },
  vertexShader: OBJ_VS, fragmentShader: PLANET_FS, side: THREE.DoubleSide,
});
const surface = new THREE.Mesh(new THREE.SphereGeometry(1, 160, 112), planetMat);
pivot.add(surface);
const cloudMat = new THREE.ShaderMaterial({
  uniforms: { ...shared, uCover: { value: 0.35 } },
  vertexShader: OBJ_VS, fragmentShader: CLOUD_FS, transparent: true, depthWrite: false,
});
const clouds = new THREE.Mesh(new THREE.SphereGeometry(1.014, 96, 64), cloudMat);
pivot.add(clouds);
const atmoMat = new THREE.ShaderMaterial({
  uniforms: { ...shared, uThick: { value: 0.9 } },
  vertexShader: OBJ_VS, fragmentShader: ATMO_FS, transparent: true, depthWrite: false, side: THREE.BackSide, blending: THREE.AdditiveBlending,
});
const atmo = new THREE.Mesh(new THREE.SphereGeometry(1.07, 96, 64), atmoMat);
tideGroup.add(atmo);

// Secțiune subterană (Volumul 4)
const cutGroup = new THREE.Group();
cutGroup.visible = false;
tideGroup.add(cutGroup);
const beatPool = [];
const caves = [];
{
  const disc = new THREE.Mesh(new THREE.CircleGeometry(1, 128), new THREE.ShaderMaterial({ uniforms: { uTime: shared.uTime }, vertexShader: OBJ_VS, fragmentShader: CUT_FS, side: THREE.DoubleSide }));
  cutGroup.add(disc);
  const arc = (rIn, rOut, a0, a1, color, z = 0.004) => {
    const m = new THREE.Mesh(new THREE.RingGeometry(rIn, rOut, 64, 1, a0, a1 - a0), new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide }));
    m.position.z = z;
    cutGroup.add(m);
  };
  const dot = (r, a, size, color) => {
    const m = new THREE.Mesh(new THREE.CircleGeometry(size, 24), new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide }));
    m.position.set(Math.cos(a) * r, Math.sin(a) * r, 0.006);
    cutGroup.add(m);
    return m;
  };
  const deg = (d) => d * Math.PI / 180;
  // Scara Mare: zigzag de la suprafață la prima galerie
  const stairs = [];
  const aS = deg(100);
  for (let i = 0; i < 24; i++) {
    const r0 = 1 - i * 0.00188, r1 = 1 - (i + 1) * 0.00188; // de la suprafață până la Galeria Întâi (r = 0,955)
    const da = (i % 2 ? 1 : -1) * 0.006;
    stairs.push(Math.cos(aS + da) * r0, Math.sin(aS + da) * r0, 0.005, Math.cos(aS - da) * r1, Math.sin(aS - da) * r1, 0.005);
  }
  const sg = new THREE.BufferGeometry();
  sg.setAttribute('position', new THREE.Float32BufferAttribute(stairs, 3));
  cutGroup.add(new THREE.LineSegments(sg, new THREE.LineBasicMaterial({ color: 0xffe9b0 })));
  const radii = [0.955, 0.925, 0.895, 0.865];
  const cols = [0xffd36b, 0xff7a4a, 0xbfd0ff, 0xff3b2e];
  const spans = [[deg(60), deg(250)], [deg(70), deg(300)], [deg(80), deg(280)], [deg(95), deg(215)]];
  radii.forEach((r, i) => {
    arc(r - 0.004, r + 0.004, spans[i][0], spans[i][1], cols[i]);
    dot(r, spans[i][1], 0.016, cols[i]); // cetatea de la capăt
    dot(r, spans[i][0], 0.012, cols[i]);
  });
  arc(0.865 - 0.011, 0.865 + 0.011, deg(150), deg(185), 0xff2a1a, 0.006); // Peretele de cărbune
  // cele patru peșteri care bat, în Galeria a Doua (Cetatea Roșie); a patra, Peștera Tăcută, tace după anul 22 din P20
  [deg(85), deg(140), deg(200), deg(255)].forEach((a, i) => {
    const m = dot(0.925, a, 0.016, 0x111111);
    caves.push({ a, r: 0.925, i });
    m.renderOrder = 2;
  });
  for (let i = 0; i < 12; i++) {
    const m = new THREE.Mesh(new THREE.RingGeometry(0.88, 1, 48), new THREE.MeshBasicMaterial({ color: 0xffd9a0, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
    m.visible = false;
    cutGroup.add(m);
    beatPool.push({ m, age: 9, dur: 1.6 });
  }
}

// Umbre (Volumul 7)
const shadowGroup = new THREE.Group();
shadowGroup.visible = false;
planetRoot.add(shadowGroup);
// Fiecare con e umbra planetei în raza unei stele: pornește de la planetă (raza R) și se îngustează spre vârf, după
// geometria reală (lungimea umbrei = R·d/(Rstea − R)); capătul desenat e tăiat și estompat. Culoarea e a stelei.
const shadowCones = STAR_DEFS.map((d) => {
  const g = new THREE.CylinderGeometry(1, 1, 1, 48, 1, true);
  g.translate(0, 0.5, 0); // baza la y = 0 (planetă), capătul la y = 1
  const pos = g.attributes.position;
  const cols = new Float32Array(pos.count * 3);
  const orig = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    const f = 1 - pos.getY(i) * 0.97; // 1 la bază, ~0 la capăt
    cols[i * 3] = cols[i * 3 + 1] = cols[i * 3 + 2] = f * f;
    orig[i * 2] = pos.getX(i); orig[i * 2 + 1] = pos.getZ(i);
  }
  g.setAttribute('color', new THREE.BufferAttribute(cols, 3));
  const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: new THREE.Color(d.col[0], d.col[1], d.col[2]), vertexColors: true, transparent: true, opacity: 0.12, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
  m.userData.orig = orig;
  m.userData.taper = -1;
  shadowGroup.add(m);
  return m;
});

// ---------- Locuri pe planetă ----------
const placeObjs = PLACES.map((p) => {
  const lat = p.lat * Math.PI / 180, lon = p.lon * Math.PI / 180;
  const dir = V3(Math.cos(lat) * Math.sin(lon), Math.sin(lat), Math.cos(lat) * Math.cos(lon));
  const s = glowSprite(0xffffff, 0.06, 1);
  s.position.copy(dir).multiplyScalar(1.014);
  pivot.add(s);
  return { ...p, dir, sprite: s, world: V3(), ph: -1 };
});
const siteRampe = placeObjs.find((p) => p.id === 'rampe');
const siteOase = placeObjs.find((p) => p.id === 'oase');
const siteFor = (n) => (n >= 21 ? siteOase : siteRampe); // CANON2 C-35: din P21 câmpul se mută în Valea Oaselor
const placeOn = (p) => (S.layers.places && p.in.places) || (S.layers.hemi && p.in.hemi) || (S.layers.atlas && p.in.atlas);

// ---------- Fanare, Cimitir, Plasă ----------
// Un singur inel orbital (planul e perpendicular pe axa spre Plasă): Fanarele la 1,06 R, Cimitirul retrograd la 1,25 R,
// Plasa pe axă, la 9 R, fixă față de stele (CANON2 C-07, C-08, C-36).
const SD = V3(0.34, 0.5, 0.8).normalize();
const orbital = new THREE.Group();
orbital.quaternion.setFromUnitVectors(V3(0, 1, 0), SD);
planetRoot.add(orbital);
const fanare = [];
{
  const r = rng(31);
  const basketMat = new THREE.MeshBasicMaterial({ color: 0x8a6a45 });
  const bigMat = new THREE.MeshBasicMaterial({ color: 0xffb860 });
  const basketGeo = new THREE.BoxGeometry(0.007, 0.007, 0.007);
  const bigGeo = new THREE.BoxGeometry(0.011, 0.011, 0.011);
  const cableGeo1 = new THREE.BufferGeometry().setFromPoints([V3(-0.055, 0, 0), V3(0.055, 0, 0)]);
  const cableMat = new THREE.LineBasicMaterial({ color: 0xc9b38a, transparent: true, opacity: 0.8 });
  FANARE.forEach((f, i) => {
    const g = new THREE.Group();
    g.add(new THREE.Line(cableGeo1, cableMat));
    for (let k = 0; k < 7; k++) { const b = new THREE.Mesh(bigGeo, bigMat); b.position.x = -0.045 + k * 0.015; b.position.y = -0.008; g.add(b); }
    for (let k = 0; k < 9; k++) { const b = new THREE.Mesh(basketGeo, basketMat); b.position.set(-0.05 + k * 0.0125, 0.006 + (k % 2) * 0.003, 0.0); g.add(b); }
    const glow = glowSprite(0xffb050, 0.2, 0.9);
    g.add(glow);
    g.visible = false;
    orbital.add(g);
    const rad = ORBIT_R + (i % 3) * 0.003;
    fanare.push({ nm: f.nm, def: f, g, glow, rad, ph: (i / FANARE.length) * Math.PI * 2 + r() * 0.3, w: 0.2 / Math.pow(rad, 1.5), alive: false });
  });
}
const orbitRing = (() => {
  const pts = [];
  for (let i = 0; i < 128; i++) { const a = (i / 128) * Math.PI * 2; pts.push(V3(Math.cos(a) * ORBIT_R, 0, Math.sin(a) * ORBIT_R)); }
  const l = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineDashedMaterial({ color: 0xffd9a0, dashSize: 0.012, gapSize: 0.014, transparent: true, opacity: 0.5 }));
  l.computeLineDistances();
  orbital.add(l);
  return l;
})();
const cimitirRoot = new THREE.Group();
orbital.add(cimitirRoot);
const cimitir = (() => {
  const r = rng(77);
  const N = 1400;
  const pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const a = r() * Math.PI * 2;
    const rad = CIM_R + (r() + r() - 1) * 0.05;
    const h = (r() + r() + r() - 1.5) * 0.04;
    pos[i * 3] = Math.cos(a) * rad; pos[i * 3 + 1] = h; pos[i * 3 + 2] = Math.sin(a) * rad;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const p = new THREE.Points(g, new THREE.PointsMaterial({ color: 0x9a8a78, size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0.75, depthWrite: false }));
  cimitirRoot.add(p);
  return p;
})();

// Plasa: punct fix pe cer, cu P/4 fire
const plasaGroup = new THREE.Group();
scene.add(plasaGroup);
const plasaNode = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 12), new THREE.MeshBasicMaterial({ color: 0xcfe6ff }));
const plasaGlow = glowSprite(0xa8d0ff, 0.9, 0.9);
plasaGroup.add(plasaNode, plasaGlow);
const FIRE_MAX = 56; // P1 are 212 / 4 = 53 de fire
const THREAD_LEN = 1.5;
const threadDir = (k) => {
  const y = 1 - 2 * ((k * 0.6180339887 + 0.13) % 1); // prefix uniform: orice număr de fire e răspândit pe toată sfera
  const rr = Math.sqrt(Math.max(0, 1 - y * y));
  const th = k * 2.399963;
  return V3(Math.cos(th) * rr, y, Math.sin(th) * rr);
};
const plasaThreads = (() => {
  const pos = new Float32Array(FIRE_MAX * 2 * 3);
  const col = new Float32Array(FIRE_MAX * 2 * 3);
  for (let k = 0; k < FIRE_MAX; k++) {
    const p = threadDir(k).multiplyScalar(THREAD_LEN);
    pos.set([0, 0, 0, p.x, p.y, p.z], k * 6);
    col.set([0.85, 0.95, 1, 0.12, 0.2, 0.35], k * 6);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const l = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending, depthWrite: false }));
  l.frustumCulled = false;
  plasaGroup.add(l);
  return l;
})();
// firele rupte în avans (P20): cioturi roșii scurte
const plasaStubs = (() => {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(MAX_QUESTIONS * 2 * 3), 3));
  const l = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: 0xff6a4d, transparent: true, opacity: 0.85, depthWrite: false }));
  l.frustumCulled = false;
  plasaGroup.add(l);
  return l;
})();
// lumina scurtă: o singură dată pe Fereastră, cu un minut înaintea primei salve; pleacă de la Plasă spre Gol
const plasaBeam = (() => {
  const g = new THREE.BufferGeometry().setFromPoints([V3(0, 0, 0), V3(0, 0, -1)]);
  const l = new THREE.Line(g, new THREE.LineBasicMaterial({ color: 0xbff4ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
  l.frustumCulled = false;
  plasaGroup.add(l);
  return l;
})();

// ---------- Particule și rachete ----------
class Particles {
  constructor(max) {
    this.max = max; this.i = 0; this.hot = 0;
    this.pos = new Float32Array(max * 3); this.vel = new Float32Array(max * 3);
    this.col = new Float32Array(max * 3); this.size = new Float32Array(max);
    this.alpha = new Float32Array(max); this.life = new Float32Array(max); this.maxLife = new Float32Array(max);
    this.base = new Float32Array(max);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    g.setAttribute('aCol', new THREE.BufferAttribute(this.col, 3));
    g.setAttribute('aSize', new THREE.BufferAttribute(this.size, 1));
    g.setAttribute('aA', new THREE.BufferAttribute(this.alpha, 1));
    this.uniforms = { uOrigin: { value: V3() }, uScale: { value: 400 } };
    const m = new THREE.ShaderMaterial({ uniforms: this.uniforms, vertexShader: PART_VS, fragmentShader: PART_FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    this.points = new THREE.Points(g, m);
    this.points.frustumCulled = false;
    this.geo = g;
  }
  emit(p, v, life, c, size, a = 0.8) {
    const k = this.i; this.i = (this.i + 1) % this.max;
    this.pos[k * 3] = p.x; this.pos[k * 3 + 1] = p.y; this.pos[k * 3 + 2] = p.z;
    this.vel[k * 3] = v.x; this.vel[k * 3 + 1] = v.y; this.vel[k * 3 + 2] = v.z;
    this.col[k * 3] = c[0]; this.col[k * 3 + 1] = c[1]; this.col[k * 3 + 2] = c[2];
    this.base[k] = size; this.size[k] = size; this.life[k] = life; this.maxLife[k] = life; this.alpha[k] = a;
    this.hot = 3; // cât mai are particule vii (secunde)
    this.geo.attributes.aCol.needsUpdate = true;
  }
  clear() {
    this.life.fill(0); this.alpha.fill(0); this.hot = 0.1;
    this.geo.attributes.aA.needsUpdate = true;
  }
  update(dt) {
    if (this.hot <= 0) return; // nimic viu: nu mai parcurgem și nu mai încărcăm buffere
    this.hot -= dt;
    for (let k = 0; k < this.max; k++) {
      if (this.life[k] <= 0) { this.alpha[k] = 0; continue; }
      this.life[k] -= dt;
      const f = Math.max(0, this.life[k] / this.maxLife[k]);
      this.pos[k * 3] += this.vel[k * 3] * dt; this.pos[k * 3 + 1] += this.vel[k * 3 + 1] * dt; this.pos[k * 3 + 2] += this.vel[k * 3 + 2] * dt;
      this.alpha[k] = f * 0.8;
      this.size[k] = this.base[k] * (1.6 - 0.6 * f);
    }
    this.geo.attributes.position.needsUpdate = true;
    this.geo.attributes.aA.needsUpdate = true;
    this.geo.attributes.aSize.needsUpdate = true;
  }
}
const parts = new Particles(5000);
planetRoot.parent.add(parts.points);

const rockets = [];
const rocketGeo = new THREE.CylinderGeometry(0.004, 0.007, 0.06, 6);
const rocketMat = new THREE.MeshBasicMaterial({ color: 0xece4d2 });
const flameMat = new THREE.SpriteMaterial({ map: GLOW, color: 0xff9a40, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
const ROCKET_MAX = 60; // rachete în zbor în același timp
const arrivedMax = 300;
const arrivedList = [];
const arrivedPos = new Float32Array(arrivedMax * 3);
const arrivedGeo = new THREE.BufferGeometry();
arrivedGeo.setAttribute('position', new THREE.BufferAttribute(arrivedPos, 3));
const arrivedPts = new THREE.Points(arrivedGeo, new THREE.PointsMaterial({ color: 0xffe9a8, size: 3, sizeAttenuation: false, depthWrite: false }));
arrivedPts.frustumCulled = false;
planetRoot.add(arrivedPts);

function planetFrame() {
  const q = pivot.getWorldQuaternion(new THREE.Quaternion());
  const nq = tilt.getWorldQuaternion(new THREE.Quaternion());
  return { q, north: V3(0, 1, 0).applyQuaternion(nq) };
}
// ajunge rachetă numărul k pe orbită? Șir cu discrepanță mică: la P20 (60%) ies 54 din 90, mereu la fel.
const rocketOk = (k, n) => ((k * 0.6180339887 + 0.37) % 1) < rocketSuccess(n);

function spawnRocket(Rrel) {
  if (rockets.length >= ROCKET_MAX) return false;
  const { q, north } = planetFrame();
  const jitter = V3((Math.random() - 0.5) * 0.08, (Math.random() - 0.5) * 0.08, (Math.random() - 0.5) * 0.08);
  const dir = siteFor(S.n).dir.clone().add(jitter).normalize().applyQuaternion(q).normalize();
  const east = V3().crossVectors(north, dir).normalize();
  const ok = rocketOk(S.launched, S.n);
  const mesh = new THREE.Mesh(rocketGeo, rocketMat);
  const flame = new THREE.Sprite(flameMat);
  flame.scale.setScalar(0.09);
  flame.position.y = -0.04;
  mesh.add(flame);
  planetRoot.add(mesh);
  rockets.push({ mesh, dir, east, ok, t: 0, dur: 5 + Math.random() * 1.5, R: Rrel, last: dir.clone().multiplyScalar(Rrel), acc: 0 });
  S.launched++;
  return true;
}

function updateRockets(dt, Rrel) {
  for (let i = rockets.length - 1; i >= 0; i--) {
    const k = rockets[i];
    k.t += dt;
    const s = clamp(k.t / k.dur, 0, 1);
    const alt = k.R * (1 + (ORBIT_R - 1) * Math.pow(s, 0.8)); // până la 1,06 R, înălțimea Fanarelor
    const psi = 0.55 * s * s;
    const p = k.dir.clone().multiplyScalar(Math.cos(psi)).addScaledVector(k.east, Math.sin(psi)).multiplyScalar(alt);
    const v = p.clone().sub(k.last);
    if (v.lengthSq() > 1e-10) k.mesh.quaternion.setFromUnitVectors(V3(0, 1, 0), v.normalize());
    k.mesh.position.copy(p);
    k.last.copy(p);
    k.acc += dt * 12; // emisie pe timp, nu pe cadru
    while (k.acc >= 1) {
      k.acc -= 1;
      const rv = V3((Math.random() - 0.5) * 0.05, (Math.random() - 0.5) * 0.05, (Math.random() - 0.5) * 0.05);
      parts.emit(p, rv, 1.2 + Math.random() * 0.6, [0.6, 0.6, 0.65], 0.04, 0.06);
      parts.emit(p, V3(), 0.22, [0.9, 0.5, 0.18], 0.03, 0.16);
    }
    if (!k.ok && s > 0.5) {
      for (let j = 0; j < 32; j++) {
        const a = V3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize().multiplyScalar(0.12 + Math.random() * 0.14);
        parts.emit(p, a, 0.8 + Math.random() * 1.2, [1.0, 0.5 + Math.random() * 0.3, 0.15], 0.06, 0.3);
      }
      S.failed++;
      planetRoot.remove(k.mesh);
      rockets.splice(i, 1);
      continue;
    }
    if (s >= 1) {
      if (arrivedList.length < arrivedMax) {
        const ang = (Math.random() - 0.5) * 1.6, d0 = k.dir.clone();
        const e0 = k.east.clone().applyAxisAngle(d0, ang); // planuri orbitale diferite, ca sosirile să nu formeze un singur ciorchine
        const r0 = alt * (1 + (Math.random() - 0.5) * 0.014);
        arrivedList.push({ d: d0, e: e0, r: r0, a: Math.random() * 6.28, w: 0.5 / Math.pow(r0, 1.5) * (0.8 + Math.random() * 0.4) });
      }
      S.arrived++;
      planetRoot.remove(k.mesh);
      rockets.splice(i, 1);
    }
  }
  for (let i = 0; i < arrivedList.length; i++) {
    const a = arrivedList[i];
    a.a += a.w * dt * 3;
    const p = a.d.clone().multiplyScalar(Math.cos(a.a)).addScaledVector(a.e, Math.sin(a.a)).multiplyScalar(a.r);
    arrivedPos[i * 3] = p.x; arrivedPos[i * 3 + 1] = p.y; arrivedPos[i * 3 + 2] = p.z;
  }
  arrivedGeo.setDrawRange(0, arrivedList.length);
  arrivedGeo.attributes.position.needsUpdate = true;
}

// Salturi în timp (derulare, schimbarea pendulului): salvele rămase în urmă se socotesc direct, fără animație.
function catchUpRockets(plan, uNow) {
  const rs = Math.random;
  while (S.salvo < plan.length && plan[S.salvo].u < uNow - 0.04) {
    const sv = plan[S.salvo++];
    for (let j = 0; j < sv.n; j++) {
      const ok = rocketOk(S.launched, S.n);
      S.launched++;
      if (ok) {
        S.arrived++;
        if (arrivedList.length < arrivedMax) {
          const d = siteFor(S.n).dir.clone().add(V3(rs() - 0.5, rs() - 0.5, rs() - 0.5).multiplyScalar(0.08)).normalize();
          const e = V3().crossVectors(V3(0, 1, 0), d).normalize().applyAxisAngle(d, (rs() - 0.5) * 1.6);
          const r0 = S.Rrel * ORBIT_R * (1 + (rs() - 0.5) * 0.014);
          arrivedList.push({ d, e, r: r0, a: rs() * 6.28, w: 0.5 / Math.pow(r0, 1.5) * (0.8 + rs() * 0.4) });
        }
      } else S.failed++;
    }
  }
}

function clearRockets() {
  rockets.forEach((k) => planetRoot.remove(k.mesh));
  rockets.length = 0;
  arrivedList.length = 0;
  arrivedGeo.setDrawRange(0, 0);
  parts.clear();
  S.launched = 0; S.arrived = 0; S.failed = 0; S.salvo = 0; S.spawnQ = 0; S.spawnAcc = 0; S.shortLight = 0; S.spawnDelay = 0;
}

// ---------- Etichete HTML ----------
const labelsEl = $('labels');
const labels = [];
function addLabel(text, cls, fn) {
  const el = document.createElement('div');
  el.className = 'lbl ' + (cls || '');
  el.textContent = text;
  labelsEl.appendChild(el);
  const o = { el, fn, text, stack: /\b(place|cutl|orb)\b/.test(cls || '') };
  labels.push(o);
  return o;
}
const tmpV = V3();
function projectLabels() {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  const placed = []; // dreptunghiuri deja ocupate, ca etichetele din același loc să nu se suprapună
  for (const l of labels) {
    const r = l.fn();
    if (!r || !r.show) { if (l.shown !== false) { l.el.style.display = 'none'; l.shown = false; } continue; }
    tmpV.copy(r.pos).project(camera);
    if (tmpV.z > 1 || tmpV.z < -1 || Math.abs(tmpV.x) > 1.05 || Math.abs(tmpV.y) > 1.05) { if (l.shown !== false) { l.el.style.display = 'none'; l.shown = false; } continue; }
    if (l.shown !== true) { l.el.style.display = 'block'; l.shown = true; }
    if (r.text && r.text !== l.text) { l.el.textContent = r.text; l.text = r.text; }
    if (r.color && r.color !== l.color) { l.el.style.setProperty('--c', r.color); l.color = r.color; }
    l.el.style.opacity = r.alpha === undefined ? 1 : r.alpha;
    const x = (tmpV.x + 1) / 2 * w;
    let y = (1 - tmpV.y) / 2 * h;
    if (l.stack) {
      const lw = (l.text || '').length * 6 + 16;
      for (let it = 0; it < 8; it++) {
        const hit = placed.find((q) => x < q.x + q.w && q.x < x + lw && Math.abs(y - q.y) < 13);
        if (!hit) break;
        y = hit.y + 13;
      }
      placed.push({ x, y, w: lw });
    }
    l.el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
  }
}

const planetPos = V3(R_NEAR + 100, 0, 0);
function hiddenByPlanet(p) {
  const o = camera.position;
  const d = p.clone().sub(o);
  const L = d.length();
  d.divideScalar(L);
  const oc = planetPos.clone().sub(o);
  const tca = oc.dot(d);
  if (tca < 0 || tca > L) return false;
  const r = (S.Rrel || 1) * 1.1;
  return oc.lengthSq() - tca * tca < r * r;
}
const camDist = () => camera.position.distanceTo(planetPos);

addLabel('Golul', 'sys', () => ({ pos: V3(0, 5, 0), show: camera.position.length() > 30 }));
stars.forEach((s) => addLabel(s.name, 'sys', () => ({ pos: s.pos.clone().add(V3(0, s.R * 1.5, 0)), show: camera.position.distanceTo(s.pos) > s.R * 3 })));
addLabel('Planeta', 'sys planet', () => ({ pos: planetPos.clone().add(V3(0, camDist() * 0.03, 0)), show: camDist() > 40 }));
addLabel('Plasa', 'orb', () => ({
  pos: plasaGroup.position.clone().add(V3(0, 0.12, 0)), show: S.layers.orbital && camDist() < 30 && !hiddenByPlanet(plasaGroup.position),
  text: `Plasa · ${firesOf(S.n, S.asked)} de fire`,
}));
addLabel('Cimitirul', 'orb small', () => {
  const p = cimitirRoot.localToWorld(V3(CIM_R, 0.02, 0));
  return { pos: p, show: S.layers.orbital && camDist() < 12 && !hiddenByPlanet(p) };
});
fanare.forEach((f) => addLabel('Fanarul ' + f.nm, 'orb small', () => {
  const p = f.g.getWorldPosition(new THREE.Vector3());
  const vis = f.alive && S.layers.orbital && camDist() < 7 && (f.nm === 'Șapte' || camDist() < 4.5);
  return { pos: p.add(V3(0, 0.07, 0)), show: vis && !hiddenByPlanet(p) };
}));
placeObjs.forEach((p) => addLabel(p.name, 'place', () => {
  const show = placeOn(p) && camDist() < 14;
  p.sprite.getWorldPosition(p.world);
  const toCam = camera.position.clone().sub(p.world).normalize();
  const nrm = p.world.clone().sub(planetPos).normalize();
  const front = nrm.dot(toCam) > 0.12 && !S.layers.cut;
  let text = p.name, color = '#ffe9b0';
  if (S.layers.atlas && p.in.atlas) {
    const st = p.st[S.phase];
    text = p.name + ' · ' + st.t; color = ATLAS_COLORS[st.c];
  }
  return { pos: p.world, show: show && front, text, color };
}));
consLabels.forEach((c) => addLabel(c.text, 'cons', () => ({
  pos: camera.position.clone().add(c.dir), show: S.layers.sky && S.culture === c.ci && camDist() < 14, color: CULTURES[c.ci].color,
})));
addLabel('Locul gol · direcția Golului', 'cons', () => ({
  pos: camera.position.clone().addScaledVector(gapDir, 3900), show: S.layers.sky && camDist() < 14, color: '#fff1cf',
}));
// secțiune: etichete
{
  const toW = (r, a) => tideGroup.localToWorld(V3(Math.cos(a) * r, Math.sin(a) * r, 0.01));
  const deg = (d) => d * Math.PI / 180;
  const items = [
    ['Scara Mare · 1.212 trepte', 1.0, 100], ['Galeria Întâi · Cetatea Galbenă · ~470 m', 0.955, 250], ['Galeria a Doua · Cetatea Roșie · ~780 m', 0.925, 300],
    ['Galeria a Treia · Cetatea Palidă · ~1.090 m', 0.895, 280], ['Galeria a Patra · Peretele de Cărbune · 1.400 m', 0.865, 168],
  ];
  items.forEach(([t, r, a]) => addLabel(t, 'cutl', () => ({ pos: toW(r, deg(a)), show: S.layers.cut && camDist() < 8 })));
  caves.forEach((c, i) => addLabel('Peștera ' + (i + 1), 'cutl small', () => {
    const quiet = i === 3 && (S.n > N_NOW || (S.n === N_NOW && S.t > 22)); // a patra peșteră tace după ascultarea din anul 22
    return { pos: toW(c.r, c.a), show: S.layers.cut && camDist() < 6, text: quiet ? 'Peștera Tăcută' : 'Peștera ' + (i + 1) };
  }));
}

// ---------- Vederi ----------
const VIEWS = {
  sistem: { follow: false },
  planeta: { follow: true, off: V3(1.1, 0.7, 4.9) },
  cer: { follow: true, off: V3(6.0, 1.0, -2.2) }, // Volumul 8: privit dinspre stele, cu Golul la dreapta
  maree: { follow: true, off: V3(-5.6, 0.8, 3.0) }, // dinspre Gol, ca să se vadă emisfera întoarsă spre el
  orbita: { follow: true, off: V3(-5.9, 6.9, 15.5) }, // Plasa e la 9 R: trebuie să încapă în cadru, în dreapta planetei
  corte: { follow: true, off: V3(0.0, 0.0, 3.4) },
  umbre: { follow: true, off: V3(-0.6, 2.9, 4.0) },
  gaura: { follow: false, pos: V3(24, 7, 28), tgt: V3(0, 0, 0) },
};
function viewGoal() {
  const v = S.vdef;
  if (v.follow) return { pos: planetPos.clone().add(v.off.clone().multiplyScalar(Math.max(1, S.Rrel || 1))), tgt: planetPos.clone() };
  if (S.view === 'sistem') {
    // scena (de la Gol la ~720 u.) încape în partea liberă a ecranului: pe ecrane late, panoul de date din stânga o împinge spre dreapta
    const W = canvas.clientWidth || window.innerWidth;
    const inset = W >= 900 ? 370 : 0;
    const halfW = 400 * W / (W - inset);
    const dist = clamp(halfW / (Math.tan(25 * Math.PI / 180) * camera.aspect), 420, 2600);
    const tgt = V3(345 - (inset / 2) / (W / 2) * halfW, 0, 0);
    return { pos: tgt.clone().add(V3(0, 0.5, 0.87).multiplyScalar(dist)), tgt };
  }
  return { pos: v.pos.clone(), tgt: v.tgt.clone() };
}
function setView(name, instant = false) {
  if (!VIEWS[name]) name = 'planeta';
  S.view = name; S.vdef = VIEWS[name]; S.follow = S.vdef.follow;
  $('viewSel').value = name;
  if (instant) {
    const g = viewGoal();
    camera.position.copy(g.pos); controls.target.copy(g.tgt); S.tween = null;
  } else {
    S.tween = { t: 0, dur: 1.7, fromPos: camera.position.clone(), fromTgt: controls.target.clone() };
  }
  controls.maxDistance = 3000;
}
controls.addEventListener('start', () => { S.tween = null; });

// ---------- Straturi, volume, interfață ----------
function applyLayers() {
  const L = S.layers;
  pathGroup.visible = L.path;
  planetMat.uniforms.uBands.value = L.bands ? 1 : 0;
  planetMat.uniforms.uHemi.value = L.hemi ? 1 : 0;
  shared.uCut.value = L.cut ? 1 : 0;
  cutGroup.visible = L.cut;
  clouds.visible = !L.cut;
  atmo.visible = !L.cut;
  orbital.visible = L.orbital;
  plasaGroup.visible = L.orbital;
  shadowGroup.visible = L.shadows;
  skyRoot.children.forEach((c) => { if (c.isGroup) c.visible = false; });
  if (L.sky) consGroups[S.culture].visible = true;
  gapGroup.visible = !!L.sky;
  placeObjs.forEach((p) => { p.sprite.visible = !!placeOn(p); p.ph = -1; });
  $('tmapWrap').hidden = !(L.timemap || L.ribbon);
  tmapAcc = 1;
  $('culRow').hidden = !L.sky;
  lensPass.uniforms.uOn.value = L.lens ? 1 : 0;
  document.querySelectorAll('#layerList input').forEach((cb) => { cb.checked = !!L[cb.dataset.id]; });
}
function buildUI() {
  const list = $('layerList');
  LAYER_DEFS.forEach((l) => {
    const lab = document.createElement('label');
    lab.className = 'chk';
    lab.innerHTML = `<input type="checkbox" data-id="${l.id}"><span>${l.label}</span>`;
    lab.querySelector('input').addEventListener('change', (e) => {
      S.layers[l.id] = e.target.checked;
      if (l.id === 'cut') { if (e.target.checked) setView('corte'); else if (S.view === 'corte') setView('planeta'); }
      applyLayers();
    });
    list.appendChild(lab);
  });
  const chips = $('volChips');
  const all = document.createElement('button');
  all.className = 'chip'; all.textContent = 'Toate'; all.dataset.v = '0';
  all.addEventListener('click', () => selectVolume(0));
  chips.appendChild(all);
  VOLUMES.forEach((v) => {
    const b = document.createElement('button');
    b.className = 'chip'; b.dataset.v = String(v.n);
    b.innerHTML = `<b>${v.n}</b>${v.title}`;
    b.addEventListener('click', () => selectVolume(v.n));
    chips.appendChild(b);
  });
  const sel = $('culSel');
  CULTURES.forEach((c, i) => { const o = document.createElement('option'); o.value = String(i); o.textContent = c.name; sel.appendChild(o); });
  sel.addEventListener('change', () => { S.culture = +sel.value; applyLayers(); updateVolInfo(); });
}
function updateVolInfo() {
  document.querySelectorAll('#volChips .chip').forEach((c) => c.classList.toggle('on', +c.dataset.v === S.vol));
  const box = $('volInfo');
  if (S.vol === 0) { box.innerHTML = '<b>Toate volumele</b><span>Alege un volum ca să-i vezi harta pe planetă și în sistem.</span>'; return; }
  const v = VOLUMES[S.vol - 1];
  let extra = '';
  if (v.n === 4) extra = '<span class="note">Scară liniară, unică pentru tot desenul: 1.400 m (Peretele de Cărbune) = 0,135 din raza discului; Scara Mare, cu 1.212 trepte, coboară până la Galeria Întâi (~470 m). Doar scoarța e desenată cu această scară: discul nu e planeta la scară, iar straturile colorate din adânc sunt simbolice.</span>';
  if (v.n === 7) extra = '<span class="note">Fiecare con este umbra planetei în lumina unei stele (culoarea stelei), cu baza la planetă; se îngustează spre vârf, ca în geometria reală, iar capătul e tăiat și estompat (umbra adevărată e mult mai lungă). Se estompează și mai mult când steaua e acoperită de alta sau de Gol.</span>';
  if (v.n === 8) { const c = CULTURES[S.culture]; extra = `<span class="note">${c.name}: nordul este ${c.north}. Constelații: ${c.consts.join(', ')}.</span>`; }
  box.innerHTML = `<b>Vol. ${v.n} · ${v.title}</b><i>${v.map}</i><span>${v.text}</span>${extra}<button class="btn mini volread" id="volRead">Citește volumul →</button>`;
  const vr = $('volRead'); if (vr) vr.addEventListener('click', () => openReader(v.n));
}
const BASE_LAYERS = ['places', 'orbital', 'path', 'lens'];
function selectVolume(n) {
  n = Math.round(Number.isFinite(+n) ? +n : 0);
  if (n < 0 || n > VOLUMES.length) n = 0;
  S.vol = n;
  LAYER_DEFS.forEach((l) => { S.layers[l.id] = false; });
  S.layers.lens = true;
  S.layers.places = true;
  if (n === 0) {
    BASE_LAYERS.forEach((id) => { S.layers[id] = true; });
    setInverse(false);
    setView('planeta');
  } else {
    const v = VOLUMES[n - 1];
    S.layers.orbital = v.layers.includes('orbital'); S.layers.path = v.layers.includes('path');
    S.layers.places = v.layers.includes('places') || n === 4 || n === 5;
    v.layers.forEach((id) => { S.layers[id] = true; });
    setInverse(!!v.inverse);
    if (v.inverse) { S.n = N_NOW; S.t = 0; clearRockets(); updatePendUI(); }
    if (n === 7) S.layers.orbital = false;
    setView(v.view);
  }
  applyLayers(); updateVolInfo();
}
function setInverse(on) {
  S.inverse = on;
  $('invBtn').classList.toggle('on', on);
  $('invBtn').setAttribute('aria-pressed', String(on));
  $('invBtn').textContent = on ? 'Cronologie inversă: da' : 'Cronologie inversă: nu';
}
function gotoPend(n, t = 0) {
  n = Math.round(Number.isFinite(+n) ? +n : N_NOW);
  S.n = clamp(n, N_MIN, N_MAX);
  const p = pend(S.n);
  S.t = clamp(Number.isFinite(+t) ? +t : 0, 0, p.P - 0.001);
  clearRockets(); updatePendUI();
}
function updatePendUI() {
  const p = pend(S.n);
  $('pTxt').textContent = `P${S.n}`;
  $('pSub').textContent = `${p.periodCanon} de ani`;
  const sc = $('scrub');
  sc.max = String(Math.round(p.P * 100));
  const b = p.bounds;
  const stops = [];
  PHASES.forEach((ph, i) => {
    const a = (b[i] / p.P) * 100, e = (b[i + 1] / p.P) * 100;
    stops.push(`${ph.color} ${a.toFixed(3)}% ${Math.max(e, a + 0.8).toFixed(3)}%`);
  });
  sc.style.background = `linear-gradient(to right, ${stops.join(',')})`;
}

// ---------- Hărți 2D ----------
const tmap = $('tmap');
const tctx = tmap.getContext('2d');
const TM_W = 300, TM_H = 210;
function tmapPrep() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  if (tmap.width !== Math.round(TM_W * dpr)) { tmap.width = Math.round(TM_W * dpr); tmap.height = Math.round(TM_H * dpr); }
  tctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  tctx.clearRect(0, 0, TM_W, TM_H);
  tctx.textBaseline = 'alphabetic';
}
function drawTimeMap() {
  if ($('tmapWrap').hidden) return;
  tmapPrep();
  if (S.layers.ribbon && !S.layers.timemap) { drawRibbon(); return; }
  const p = pend(S.n);
  const cx = 74, cy = 78, R = 56;
  tctx.lineWidth = 9;
  tctx.lineCap = 'butt';
  PHASES.forEach((ph, i) => {
    const a0 = -Math.PI / 2 + (p.bounds[i] / p.P) * Math.PI * 2;
    const a1 = -Math.PI / 2 + Math.max(p.bounds[i + 1], p.bounds[i] + p.P * 0.012) / p.P * Math.PI * 2;
    tctx.strokeStyle = ph.color; tctx.globalAlpha = 0.9;
    tctx.beginPath(); tctx.arc(cx, cy, R, a0, Math.min(a1, Math.PI * 1.5)); tctx.stroke();
  });
  tctx.globalAlpha = 1;
  const ang = -Math.PI / 2 + (clamp(S.t, 0, p.P) / p.P) * Math.PI * 2;
  tctx.fillStyle = '#ece7da';
  tctx.beginPath(); tctx.arc(cx + Math.cos(ang) * R, cy + Math.sin(ang) * R, 5, 0, 7); tctx.fill();
  tctx.strokeStyle = 'rgba(236,231,218,.35)'; tctx.lineWidth = 1;
  tctx.beginPath(); tctx.arc(cx, cy, R - 12, 0, 7); tctx.stroke();
  tctx.fillStyle = '#ece7da'; tctx.textAlign = 'center';
  tctx.font = '600 15px ui-monospace, Menlo, monospace';
  tctx.fillText('P' + S.n, cx, cy + 1);
  tctx.fillStyle = '#a3acc0'; tctx.font = '10px system-ui, sans-serif';
  tctx.fillText(p.periodCanon + ' de ani', cx, cy + 16);
  tctx.fillText(epochOf(S.n), cx, cy + 29);
  // bare: perioada fiecărui pendul, colorate pe epoci; bara galbenă = Fereastra
  const bx = 156, by = 8, bw = 136, bh = 5.4;
  tctx.textAlign = 'left';
  tctx.fillStyle = '#a3acc0'; tctx.font = '10px system-ui, sans-serif';
  tctx.fillText('Perioada pe pendul', bx, by + 6);
  for (let k = N_MIN; k <= N_MAX; k++) {
    const y = by + 14 + (k - 1) * (bh + 1.2) * 0.62;
    const pk = pend(k);
    const ec = EPOCH_COLORS[epochIndex(k)];
    tctx.fillStyle = ec;
    tctx.fillRect(bx - 6, y, 3, bh * 0.62);
    tctx.globalAlpha = k === S.n ? 1 : 0.5;
    tctx.fillRect(bx, y, (pk.periodCanon / 212) * bw, bh * 0.62);
    tctx.globalAlpha = 1;
    if (pk.Wm > 0) { tctx.fillStyle = k === S.n ? '#ffe08a' : 'rgba(255,224,138,.4)'; tctx.fillRect(bx + (pk.periodCanon / 212) * bw + 3, y, (pk.Wm / 108) * 22, bh * 0.62); }
  }
  tctx.fillStyle = '#7a859e'; tctx.font = '9px system-ui, sans-serif';
  tctx.fillText('212', bx, by + 14 + 28 * 3.9 + 8);
  tctx.fillText('104', bx + (104 / 212) * bw - 8, by + 14 + 28 * 3.9 + 8);
  tctx.fillStyle = '#a3acc0'; tctx.font = '10px system-ui, sans-serif';
  tctx.fillText(S.inverse ? 'Timpul curge de la P20 spre P1' : 'Fereastra: bara galbenă', 8, TM_H - 8);
}
// Volumul 9: panglica de fază. 1° = P20/360 ani; un circuit al pendulului 20 are 360°, al lui 21 are 349°; la P1 spirala trece de 360°.
function drawRibbon() {
  const p = pend(S.n);
  const cx = 92, cy = 104, R0 = 38, dR = 14;
  const sweep = p.P / DEG_YEARS;
  const pos = (deg, rr) => { const a = -Math.PI / 2 + deg * Math.PI / 180; return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]; };
  const rad = (deg) => R0 + (deg / 360) * dR;
  tctx.lineCap = 'butt'; tctx.lineWidth = 6;
  PHASES.forEach((ph, i) => {
    const d0 = p.bounds[i] / DEG_YEARS, d1 = Math.max(p.bounds[i + 1] / DEG_YEARS, d0 + 1.2);
    tctx.strokeStyle = ph.color; tctx.globalAlpha = 0.92;
    tctx.beginPath();
    for (let d = d0; d <= d1 + 0.01; d += 2) { const [x, y] = pos(Math.min(d, d1), rad(Math.min(d, d1))); if (d === d0) tctx.moveTo(x, y); else tctx.lineTo(x, y); }
    tctx.stroke();
  });
  tctx.globalAlpha = 1;
  if (sweep < 360) { // lipsește un arc: panglica nu se închide
    tctx.strokeStyle = '#ff6a4d'; tctx.lineWidth = 2; tctx.setLineDash([3, 3]);
    tctx.beginPath();
    for (let d = sweep; d <= 360.01; d += 2) { const [x, y] = pos(Math.min(d, 360), rad(Math.min(d, 360))); if (d === sweep) tctx.moveTo(x, y); else tctx.lineTo(x, y); }
    tctx.stroke(); tctx.setLineDash([]);
  }
  const cur = clamp(S.t, 0, p.P) / DEG_YEARS;
  const [dx, dy] = pos(cur, rad(cur));
  tctx.fillStyle = '#ece7da'; tctx.beginPath(); tctx.arc(dx, dy, 4.5, 0, 7); tctx.fill();
  tctx.fillStyle = '#ece7da'; tctx.textAlign = 'center'; tctx.font = '600 15px ui-monospace, Menlo, monospace';
  tctx.fillText('P' + S.n, cx, cy + 5);
  tctx.textAlign = 'left'; tctx.font = '10px system-ui, sans-serif';
  tctx.fillStyle = '#a3acc0';
  tctx.fillText('Longitudine de fază · 1° = 0,38 ani', 8, 14);
  const fx = 172;
  const names = ['Apropiere', 'Fereastră', 'Trecere', 'Îndepărtare', 'Adânc'];
  const deg = (i) => (p.bounds[i + 1] - p.bounds[i]) / DEG_YEARS;
  names.forEach((nm, i) => {
    const y = 40 + i * 16;
    tctx.fillStyle = PHASES[i].color; tctx.fillRect(fx, y - 8, 8, 8);
    tctx.fillStyle = '#d7dbe6'; tctx.fillText(`${nm} ${deg(i) < 10 ? deg(i).toFixed(1).replace('.', ',') : Math.round(deg(i))}°`, fx + 14, y);
  });
  tctx.fillStyle = '#ece7da';
  tctx.fillText(`Circuit: ${Math.round(sweep)}°`, fx, 134);
  tctx.fillStyle = sweep < 359.5 ? '#ff8a70' : '#a3acc0';
  const miss = 360 - sweep;
  tctx.fillText(miss > 0.5 ? `Lipsesc ${Math.round(miss)}° = ${fmt(miss * DEG_YEARS, 0)} ani` : (miss < -0.5 ? `Trece de 360° cu ${Math.round(-miss)}°` : 'Se închide exact'), fx, 150);
  tctx.fillStyle = '#a3acc0';
  tctx.fillText(S.inverse ? 'Timpul curge de la P20 spre P1' : 'Roșu: arcul care lipsește', 8, TM_H - 8);
}

// ---------- Simulare ----------
const _q = new THREE.Quaternion();
let tmapAcc = 0, hudAcc = 0, spin = 0, tiltNow = 0.41;
const dtmp = V3();
const angDiff = (a, b) => { let d = (b - a) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; return d; };

function stepSim(dt) {
  const p = pend(S.n);
  const base = Math.pow(10, S.speedExp);
  let spd = base;
  if (S.autoSlow) {
    const slow = Math.min(base, 0.14);
    const t = S.t, A = p.A, WT = p.A + p.W + p.T;
    if (t < A - 4) spd = base;
    else if (t < A) spd = lerp(base, slow, sstep((t - (A - 4)) / 4));
    else if (t < p.A + p.W) spd = slow;
    else if (t < WT) spd = slow * 0.4;
    else if (t < WT + 1.5) spd = lerp(slow * 0.4, base, sstep((t - WT) / 1.5));
  }
  S.speedNow = spd;
  if (!S.playing) return;
  const dY = Math.max(0, dt * spd); // timpul nu curge niciodată înapoi în interiorul unui pendul
  S.t += dY; S.absT += dY;
  // Cronologia inversă schimbă doar ordinea pendulelor (P20, P19 ... P1), nu sensul timpului din interiorul unuia.
  let guard = 0;
  while (S.t >= pend(S.n).P && guard++ < 4) {
    const cur = pend(S.n);
    const nn = S.inverse ? S.n - 1 : S.n + 1;
    const wrapped = S.inverse ? (nn < N_MIN ? N_NOW : nn) : (nn > N_MAX ? N_MIN : nn);
    S.t -= cur.P; S.n = wrapped; clearRockets(); updatePendUI();
  }
}

function updateScene(dt, time) {
  const p = pend(S.n);
  const ph = phaseAt(p, S.t);
  S.phase = ph.i;
  const r = radialPos(p, S.t);
  const spd = S.speedNow;
  const wob = 2.2 / (1 + Math.pow(spd / 0.6, 2));
  const yearPh = S.absT * (365.25 / 400) * Math.PI * 2;
  planetPos.set(r, Math.cos(yearPh) * wob, Math.sin(yearPh) * wob);

  // stele
  stars.forEach((s) => {
    const a = s.ph + (S.absT / s.period) * Math.PI * 2;
    s.pos.set(s.x + Math.sin(a * 0.5) * 6, s.orbitR * Math.cos(a), s.orbitR * Math.sin(a));
    s.group.position.copy(s.pos);
    s.mat.uniforms.uTime.value = time;
  });

  // distanțe, eclipse, lumini
  const vs = stars.map((s) => s.pos.clone().sub(planetPos));
  const ds = vs.map((v) => v.length());
  const angR = stars.map((s, k) => Math.asin(Math.min(0.99, s.R / ds[k])));
  const cover = [0, 0, 0];
  const eclipse = [];
  for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) {
    if (a === b || ds[a] >= ds[b]) continue; // a e mai aproape, b e acoperită
    const sep = Math.acos(clamp(vs[a].clone().normalize().dot(vs[b].clone().normalize()), -1, 1));
    const ov = (angR[a] + angR[b] - sep) / (2 * Math.min(angR[a], angR[b]));
    if (ov > 0) { const c = clamp(ov, 0, 1); if (c > cover[b]) { cover[b] = c; } if (c > 0.05) eclipse.push(`${stars[a].name} peste ${stars[b].name}`); }
  }
  const rBH = planetPos.length();
  const angBH = Math.asin(Math.min(0.99, BH_RS / rBH));
  const bhDir = planetPos.clone().negate().normalize();
  for (let b = 0; b < 3; b++) {
    if (rBH >= ds[b]) continue;
    const sep = Math.acos(clamp(bhDir.dot(vs[b].clone().normalize()), -1, 1));
    const ov = (angBH + angR[b] - sep) / (2 * Math.min(angBH, angR[b]));
    if (ov > 0) { cover[b] = Math.max(cover[b], clamp(ov, 0, 1)); if (ov > 0.05) eclipse.push(`Golul peste ${stars[b].name}`); }
  }
  const season = 1 + 0.08 * Math.cos(yearPh) / (1 + Math.pow(spd / 0.6, 2));
  let Sn = 0.03 * Math.pow(60 / rBH, 2);
  let lit = 0;
  for (let k = 0; k < 3; k++) {
    const E = stars[k].L * Math.pow(100 / ds[k], 2) * season * (1 - cover[k]);
    const I = Math.max(0.05, 2.0 * (1 - Math.exp(-E * 1.5 / 2.0)));
    lightDirs[k].copy(vs[k]).normalize();
    lightCols[k].setRGB(stars[k].col[0] * I, stars[k].col[1] * I, stars[k].col[2] * I);
    Sn += stars[k].L * Math.pow(90 / ds[k], 2) * (1 - cover[k]);
    if (cover[k] < 0.7 && E > 0.08) lit++;
  }

  // maree, climă, atmosferă
  const e = clamp(0.45 * Math.pow(R_NEAR / r, 3), 0, 0.5);
  const tF0 = p.A, tT1 = p.A + p.W + p.T;
  const dt0 = S.t < tF0 ? tF0 - S.t : (S.t <= tT1 ? 0 : S.t - tT1);
  const L = Math.exp(-Math.pow(dt0 / 6, 2));
  const Rrel = 1; // raza planetei nu se schimbă (canon): Fereastra se vede în atmosferă și gravitație, nu în rază
  S.Rrel = Rrel;
  const T = clamp(288 * Math.pow(Sn + 0.08 + 0.12 * e, 0.25), 80, 400);
  const ice = sstep((266 - T) / 52);
  const gRel = 1 / (Rrel * Rrel);
  const vesc = Math.sqrt(1 / Rrel);
  const pRel = clamp(1 - 0.55 * L - 0.28 * ice, 0.1, 1);
  const lava = clamp((e - 0.2) / 0.2, 0, 1) * (ph.i === 2 ? 1 : 0.35);
  // atlas / faze (Volumul 3): ocean în Apropiere și Fereastră, munte în Trecere și Îndepărtare, gheață în Adânc
  const seaT = [0.52, 0.52, 0.3, 0.27, 0.24][ph.i];
  const mountT = [0.4, 0.45, 1.0, 0.85, 0.8][ph.i];
  const k = 1 - Math.exp(-dt * 2.5);
  planetMat.uniforms.uSea.value += (seaT - planetMat.uniforms.uSea.value) * k;
  planetMat.uniforms.uMount.value += (mountT - planetMat.uniforms.uMount.value) * k;
  planetMat.uniforms.uIce.value += (ice - planetMat.uniforms.uIce.value) * k;
  planetMat.uniforms.uTide.value = e;
  planetMat.uniforms.uLava.value = lava;
  planetMat.uniforms.uTemp.value = T;
  cloudMat.uniforms.uCover.value = clamp(0.55 * (T - 180) / 110, 0.05, 0.55);
  atmoMat.uniforms.uThick.value = pRel * 0.95;
  atmo.scale.setScalar(1 + 0.02 * pRel);

  // locurile din Volumul 3: culoarea indicatorului urmează starea de pe foaia curentă
  placeObjs.forEach((po) => {
    if (po.ph === S.phase && po.atl === !!S.layers.atlas) return;
    po.ph = S.phase; po.atl = !!S.layers.atlas;
    if (po.atl && po.in.atlas) { po.sprite.material.color.set(ATLAS_COLORS[po.st[S.phase].c]); po.sprite.scale.setScalar(0.09); }
    else { po.sprite.material.color.set(0xffffff); po.sprite.scale.setScalar(0.06); }
  });

  // Volumul 2: oceanul și deșertul își schimbă locul la ~40 de ani (tranziția în ultimii 6 ani ai fiecărui interval)
  {
    const x = S.absT / 40, fl = Math.floor(x);
    S.tideSign = Math.cos(Math.PI * (fl + sstep((x - fl - 0.85) / 0.15)));
  }

  // transformări
  planetRoot.position.copy(planetPos);
  controls.minDistance = 1.7 * Rrel * (1 + e);
  tideGroup.scale.set(Rrel * (1 + e), Rrel * (1 - e * 0.5), Rrel * (1 - e * 0.5));
  if (S.layers.hemi) {
    // emisfera întoarsă spre Golul: Marea Largă (0°, 80° E) sub Gol, axa dreaptă; rotația se oprește
    const lock = -Math.PI / 2 - 80 * Math.PI / 180;
    spin += angDiff(spin, lock) * (1 - Math.exp(-dt * 2.2));
    tiltNow += (0 - tiltNow) * (1 - Math.exp(-dt * 2.2));
  } else if (S.layers.atlas || S.layers.bands) {
    // Volumele 1 și 3: planeta stă cu locurile hărții spre noi (cu o legănare lentă), ca etichetele să nu dispară pe fața ascunsă
    const lock = -(S.layers.atlas ? 35 : 20) * Math.PI / 180 + (REDUCE ? 0 : 0.12 * Math.sin(time * 0.2));
    spin += angDiff(spin, lock) * (1 - Math.exp(-dt * 2.2));
    tiltNow += (0.41 - tiltNow) * (1 - Math.exp(-dt * 2.2));
  } else {
    const spinRate = (ph.i === 1 ? 0.06 : 0.32) * (S.layers.cut ? 0.15 : 1) * (REDUCE ? 0.25 : 1);
    spin += dt * spinRate;
    tiltNow += (0.41 - tiltNow) * (1 - Math.exp(-dt * 2.2));
  }
  tilt.rotation.z = tiltNow;
  pivot.rotation.y = spin;
  shared.uTime.value = time;
  shared.uCutC.value.copy(planetPos);
  const q = pivot.getWorldQuaternion(_q);
  planetMat.uniforms.uTideObj.value.set(-1, 0, 0).applyQuaternion(q.clone().invert()).normalize().multiplyScalar(S.tideSign);

  // Gaura neagră
  diskMat.uniforms.uTime.value = time;
  photonRing.quaternion.copy(camera.quaternion);
  bhGlow.material.opacity = 0.35;

  // marcajul planetei în vederea de sistem
  const dist = camDist();
  const mk = clamp((dist - 40) / 80, 0, 1);
  planetMarker.position.copy(planetPos);
  planetMarker.scale.setScalar(Math.max(0.01, dist * 0.045));
  planetMarker.material.opacity = 0.9 * mk;
  planetMarker.visible = mk > 0.01;

  // Fanare: doar cele existente la pendulul curent (Unu din P16, Șapte din P18, Șase până în P19)
  orbital.scale.setScalar(Rrel);
  fanare.forEach((f, ii) => {
    f.alive = S.n >= f.def.from && S.n <= f.def.to;
    f.g.visible = f.alive;
    if (!f.alive) return;
    f.ph += f.w * dt * (REDUCE ? 0.3 : 1.2);
    f.g.position.set(Math.cos(f.ph) * f.rad, 0, Math.sin(f.ph) * f.rad);
    f.g.rotation.y = -f.ph - Math.PI / 2;
    let blink = 0.65 + 0.35 * Math.sin(time * 2 + ii);
    if (ph.i === 2) blink = 0.4 + 0.6 * Math.abs(Math.sin(time * 18 + ii));
    f.glow.material.opacity = blink;
    f.glow.material.color.setHex(ph.i === 2 ? 0xff5a3a : 0xffb050);
  });
  cimitirRoot.rotation.y += dt * 0.012; // retrograd: invers față de Fanare
  updateGap(planetPos);

  // Plasa: pe axa orbitei, la 9 R, cu P/4 fire; în P20, întrebările rup firele în avans
  const fires = firesOf(S.n, S.asked);
  const broken = S.n === N_NOW ? clamp(S.asked, 0, MAX_QUESTIONS) : 0;
  plasaGroup.position.copy(planetPos).addScaledVector(SD, PLASA_R);
  const fl = S.askFlash > 0 ? (1 + 3 * S.askFlash) : 1;
  S.askFlash = Math.max(0, S.askFlash - dt * 1.2);
  S.shortLight = Math.max(0, S.shortLight - dt * 1.6);
  plasaGlow.scale.setScalar(0.9 * (fl + 4 * S.shortLight) * (1 + 0.08 * Math.sin(time * 3)));
  plasaThreads.geometry.setDrawRange(0, Math.min(FIRE_MAX, fires) * 2);
  plasaThreads.material.opacity = (S.view === 'orbita' ? 0.6 : 0.2) + 0.06 * Math.sin(time * 1.7);
  {
    const sp = plasaStubs.geometry.attributes.position;
    for (let j = 0; j < MAX_QUESTIONS; j++) {
      if (j < broken) { const d = threadDir(fires + j).multiplyScalar(THREAD_LEN * 0.3); sp.setXYZ(j * 2, 0, 0, 0); sp.setXYZ(j * 2 + 1, d.x, d.y, d.z); }
      else { sp.setXYZ(j * 2, 0, 0, 0); sp.setXYZ(j * 2 + 1, 0, 0, 0); }
    }
    sp.needsUpdate = true;
  }
  {
    // lumina scurtă, de la Plasă drept spre Gol
    const toBH = V3().copy(plasaGroup.position).negate();
    const len = toBH.length();
    plasaBeam.quaternion.setFromUnitVectors(V3(0, 0, -1), toBH.normalize());
    plasaBeam.scale.set(1, 1, len);
    plasaBeam.material.opacity = clamp(S.shortLight, 0, 1);
  }

  // umbre
  shadowGroup.children.forEach((cone, kk) => {
    const dir = lightDirs[kk].clone().negate();
    cone.position.set(0, 0, 0);
    cone.quaternion.setFromUnitVectors(V3(0, 1, 0), dir);
    const Rs = stars[kk].R, dk = Math.max(Rs * 1.5, ds[kk]);
    const umbraLen = Rrel * dk / Math.max(0.5, Rs - Rrel); // lungimea reală a umbrei, în raze planetare
    const len = Math.min(umbraLen, 9);
    const taper = clamp(1 - len / umbraLen, 0.12, 1); // raza la capătul desenat, față de bază
    cone.scale.set(Rrel * 0.98, len, Rrel * 0.98);
    if (Math.abs(taper - cone.userData.taper) > 0.004) {
      cone.userData.taper = taper;
      const pa = cone.geometry.attributes.position, o = cone.userData.orig;
      for (let i = 0; i < pa.count; i++) {
        const k2 = pa.getY(i) > 0.5 ? taper : 1;
        pa.setX(i, o[i * 2] * k2); pa.setZ(i, o[i * 2 + 1] * k2);
      }
      pa.needsUpdate = true;
    }
    cone.material.opacity = 0.05 + 0.14 * (1 - cover[kk]);
  });

  // rachete: prima salvă (un rând de zece) la ~5 luni după deschiderea Ferestrei, restul în salve, ultima cu o lună înaintea Trecerii
  const cap = rocketCap(S.n);
  const plan = salvoPlan(S.n);
  if (ph.i === 1 && plan.length) {
    catchUpRockets(plan, ph.u);
    while (S.salvo < plan.length && ph.u >= plan[S.salvo].u) {
      if (S.salvo === 0) { S.shortLight = 1; S.spawnDelay = 1.3; } // lumina scurtă, apoi racheta
      S.spawnQ += plan[S.salvo].n; S.salvo++;
    }
  } else S.spawnQ = 0; // ce n-a apucat să plece până la Trecere nu mai pleacă
  if (S.spawnDelay > 0) S.spawnDelay -= dt;
  else if (S.spawnQ > 0) {
    S.spawnAcc += dt * 8;
    while (S.spawnAcc >= 1 && S.spawnQ > 0) { S.spawnAcc -= 1; if (!spawnRocket(Rrel)) { S.spawnAcc = 0; break; } S.spawnQ--; }
  }
  if (ph.i === 2) { arrivedList.length = 0; }
  updateRockets(dt, Rrel);
  parts.uniforms.uOrigin.value.copy(planetPos);
  parts.uniforms.uScale.value = renderer.domElement.height * 0.5 / Math.tan(25 * Math.PI / 180);
  parts.update(dt);

  // secțiune: bătăi (în serii de patru; după coborârea Ilvarei, în anul 22 al lui P20, în serii de trei)
  if (S.layers.cut) {
    S.beatT += dt;
    const afterIlvara = S.n > N_NOW || (S.n === N_NOW && S.t > 22);
    const group = afterIlvara ? 3 : 4;
    const cycle = group * 0.55 + 3.2;
    const tt = S.beatT % cycle;
    const idx = Math.floor(tt / 0.55);
    if (tt < group * 0.55 && idx !== S.beatQ) {
      S.beatQ = idx;
      const cv = caves[idx % caves.length];
      const slot = beatPool.find((b) => b.age >= b.dur);
      if (slot) { slot.age = 0; slot.cx = Math.cos(cv.a) * cv.r; slot.cy = Math.sin(cv.a) * cv.r; slot.m.visible = true; }
    }
    if (tt >= group * 0.55) S.beatQ = -1;
    beatPool.forEach((b) => {
      if (b.age < b.dur) {
        b.age += dt;
        const f = b.age / b.dur;
        b.m.position.set(b.cx, b.cy, 0.008);
        b.m.scale.setScalar(0.02 + f * 0.28);
        b.m.material.opacity = (1 - f) * 0.9;
        if (b.age >= b.dur) b.m.visible = false;
      }
    });
  }

  // cer: constelații urmăresc camera
  skyRoot.position.copy(camera.position);

  // cameră
  if (S.tween) {
    const tw = S.tween;
    tw.t += dt;
    const g = viewGoal();
    const ee = sstep(tw.t / tw.dur);
    camera.position.lerpVectors(tw.fromPos, g.pos, ee);
    controls.target.lerpVectors(tw.fromTgt, g.tgt, ee);
    if (tw.t >= tw.dur) S.tween = null;
    S.prevPlanet = planetPos.clone();
  } else if (S.follow) {
    if (S.prevPlanet) { dtmp.copy(planetPos).sub(S.prevPlanet); camera.position.add(dtmp); controls.target.add(dtmp); }
    S.prevPlanet = planetPos.clone();
  } else S.prevPlanet = planetPos.clone();

  // lentilă
  const bhScreen = V3(0, 0, 0).project(camera);
  const bd = camera.position.length();
  const fovT = Math.tan(camera.fov * Math.PI / 360);
  const rScreen = (BH_RS / (bd * fovT)) * 0.5;
  const fwd = V3(); camera.getWorldDirection(fwd);
  const inFront = fwd.dot(V3().sub(camera.position)) > 0;
  lensPass.uniforms.uC.value.set(bhScreen.x * 0.5 + 0.5, bhScreen.y * 0.5 + 0.5);
  lensPass.uniforms.uR.value = rScreen;
  lensPass.uniforms.uAspect.value = camera.aspect;
  lensPass.uniforms.uOn.value = S.layers.lens && inFront && rScreen > 0.004 ? 1 : 0;

  S.shake = (ph.i === 2 && !REDUCE) ? 0.012 * (0.5 + e) : 0;

  // HUD
  hudAcc += dt;
  if (hudAcc > 0.12) {
    hudAcc = 0;
    $('hudPhase').textContent = PHASES[ph.i].name;
    $('hudDot').style.background = PHASES[ph.i].color;
    $('hudMain').textContent = `P${S.n} · ${epochOf(S.n)} · anul ${fmt(S.t, 1)} din ${fmt(p.P, 0)}`;
    $('sG').textContent = fmt(gRel, 2);
    $('sV').textContent = fmt(vesc, 2);
    $('sT').textContent = fmt(e * 100, 0) + '%';
    $('sTemp').textContent = `${fmt(T, 0)} K`;
    $('sAtm').textContent = fmt(pRel * 100, 0) + '%';
    $('sLight').textContent = eclipse.length ? `${lit}/3 · ${eclipse[0]}` : `${lit}/3`;
    const planned = rocketPlan(S.n);
    $('sRock').textContent = cap > 0
      ? `${S.arrived} urcate · ${S.failed} pierdute · loc pentru ${cap}${planned < cap ? ` (${S.n >= 19 ? 'pornesc' : 'încercări'}: ${planned})` : ''}`
      : (S.n < 7 ? 'fără rachete (prima lansare: P7)' : 'Fereastră sub 24 de luni: fără rachete');
    $('sFire').textContent = broken ? `${fires} de fire · ${broken} rupte în avans` : `${fires} de fire · ${p.periodCanon} ÷ 4`;
    const wl = windowsLeft(S.n, ph.i);
    $('sWin').textContent = wl > 0 ? `${wl} ${wl === 1 ? 'fereastră' : 'ferestre'} cu rachete, ultima la P${LAST_ROCKET_PEND}` : `fără rachete; Fereastra dispare la P28`;
    $('sDist').textContent = `${fmt(r, 0)} u.`;
    $('speedTxt').textContent = spd >= 1 ? `${fmt(spd, 1)} ani/s` : `${fmt(spd * 365.25, 0)} zile/s`;
    const sc = $('scrub');
    if (document.activeElement !== sc) sc.value = String(Math.round(S.t * 100));
    sc.setAttribute('aria-valuetext', `anul ${fmt(S.t, 1)} din ${fmt(p.P, 0)}, ${PHASES[ph.i].name}`);
    $('btnPlay').textContent = S.playing ? 'Pauză' : 'Pornește';
    $('btnPlay').setAttribute('aria-label', S.playing ? 'Pauză' : 'Pornește');
    const note = $('hudNote');
    let txt = '';
    if (S.shortLight > 0.05) txt = 'Lumina scurtă a Plasei: o singură dată pe Fereastră, cu un minut înaintea primei salve.';
    else if (ph.i === 1) {
      if (cap <= 0) txt = 'Fereastra e deschisă, dar prea scurtă pentru lansări.';
      else if (S.salvo === 0) txt = `Fereastra e deschisă: rampele se încarcă (${launchField(S.n)}). Prima salvă la ~5 luni.`;
      else txt = `Rachetele urcă în salve, de la ${launchField(S.n)}.`;
    } else if (ph.i === 2) txt = 'Trecerea: cutremure, lavă, zi care devine noapte.';
    else if (ph.i === 0 && S.t > p.A - 4) txt = 'Se apropie Fereastra.';
    else if (ph.i === 4) txt = 'Adâncul: iarna lungă, departe de toate stelele.';
    if (note.textContent !== txt) note.textContent = txt;
    note.hidden = !txt;
  }
  tmapAcc += dt;
  if (tmapAcc > 0.25) { tmapAcc = 0; drawTimeMap(); }
}

// ---------- Legături interfață ----------
function refreshAsk() {
  const b = $('btnAsk');
  const can = S.n === N_NOW && S.asked < MAX_QUESTIONS;
  b.disabled = !can;
  b.textContent = S.asked === 0 ? 'Întreabă „DE CE” (Kessa)' : (S.asked === 1 ? 'A doua întrebare (Selerin)' : 'Plasa a răspuns de două ori');
  b.title = S.n !== N_NOW ? 'Întrebările se pun în Fereastra pendulului 20' : '';
}
function bindUI() {
  $('btnPlay').addEventListener('click', () => { S.playing = !S.playing; });
  $('speed').addEventListener('input', (e) => { S.speedExp = clamp(+e.target.value || 0, -2.2, 1.7); });
  $('autoSlow').addEventListener('change', (e) => { S.autoSlow = e.target.checked; });
  $('scrub').addEventListener('input', (e) => { S.t = clamp((+e.target.value || 0) / 100, 0, pend(S.n).P - 0.001); clearRockets(); });
  $('pPrev').addEventListener('click', () => gotoPend(S.n - 1));
  $('pNext').addEventListener('click', () => gotoPend(S.n + 1));
  $('viewSel').addEventListener('change', (e) => setView(e.target.value));
  $('invBtn').addEventListener('click', () => { setInverse(!S.inverse); });
  $('btnPanel').addEventListener('click', () => {
    const open = $('panel').classList.toggle('open');
    $('btnPanel').setAttribute('aria-expanded', String(open));
    if (open) setTimeout(() => $('panelClose').focus({ preventScroll: true }), 30);
  });
  // după un clic cu mausul/degetul butonul nu mai ține focusul, ca Spațiu să pună pe pauză, nu să-l apese din nou
  document.addEventListener('click', (e) => { const b = e.target.closest && e.target.closest('.ui button'); if (b && e.detail > 0 && b.id !== 'panelClose') b.blur(); });
  $('panelClose').addEventListener('click', () => { $('panel').classList.remove('open'); $('btnPanel').setAttribute('aria-expanded', 'false'); $('btnPanel').focus(); });
  $('btnAsk').addEventListener('click', () => {
    if (S.n !== N_NOW || S.asked >= MAX_QUESTIONS) return;
    S.asked++; S.askFlash = 1; refreshAsk();
  });
  $('btnReset').addEventListener('click', () => { S.asked = 0; refreshAsk(); });
  $('btnHud').addEventListener('click', () => {
    const min = $('hud').classList.toggle('min');
    $('btnHud').setAttribute('aria-expanded', String(!min));
    $('btnHud').setAttribute('aria-label', min ? 'Extinde panoul de date' : 'Restrânge panoul de date');
    $('btnHud').textContent = min ? '+' : '–';
  });
  if (innerWidth < 640) { $('hud').classList.add('min'); $('btnHud').textContent = '+'; $('btnHud').setAttribute('aria-expanded', 'false'); $('btnHud').setAttribute('aria-label', 'Extinde panoul de date'); }
  $('quality').addEventListener('change', (e) => setQuality(e.target.value));
  window.addEventListener('keydown', (e) => {
    if (document.body.classList.contains('reading')) return;
    if (e.ctrlKey || e.metaKey || e.altKey || e.defaultPrevented) return;
    const tg = e.target;
    if (tg && (tg.tagName === 'INPUT' || tg.tagName === 'SELECT' || tg.tagName === 'TEXTAREA' || tg.isContentEditable)) return;
    if (e.code === 'Space') { if (tg && tg.tagName === 'BUTTON') return; /* Spațiu apasă butonul focalizat */ e.preventDefault(); S.playing = !S.playing; }
    else if (e.key === ',') gotoPend(S.n - 1);
    else if (e.key === '.') gotoPend(S.n + 1);
    else if (e.key === 'Escape' && $('panel').classList.contains('open')) { $('panel').classList.remove('open'); $('btnPanel').setAttribute('aria-expanded', 'false'); }
  });
}

// Calitatea: rezoluție, bloom și antialiasing-ul (MSAA) pe ținta de randare. La capătul de jos totul e redus.
let quality = 'mid';
function setQuality(v) {
  quality = v;
  const dpr = window.devicePixelRatio || 1;
  renderer.setPixelRatio(v === 'low' ? 1 : Math.min(dpr, v === 'high' ? 2 : 1.5));
  bloom.strength = v === 'low' ? 0.5 : 0.8;
  bloom.enabled = v !== 'low';
  const samples = v === 'low' ? 0 : (v === 'high' ? 4 : 2);
  [composer.renderTarget1, composer.renderTarget2].forEach((t) => { if (t.samples !== samples) { t.samples = samples; t.dispose(); } });
  const sel = $('quality'); if (sel && sel.value !== v) sel.value = v;
  resize();
}

function resize() {
  const w = canvas.clientWidth || window.innerWidth, h = canvas.clientHeight || window.innerHeight;
  renderer.setSize(w, h, false);
  composer.setPixelRatio(renderer.getPixelRatio());
  composer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  bloom.setSize(w, h);
}
window.addEventListener('resize', resize);

// ---------- Pornire ----------
let simTime = 0;
buildUI();
readerStarted = true;
initReader({ gotoPend, selectVolume, hasMap: (n) => n >= 1 && n <= VOLUMES.length });
bindUI();
updatePendUI();
applyLayers();
updateVolInfo();
$('speed').value = String(S.speedExp);
setQuality('mid');
planetPos.set(radialPos(pend(S.n), S.t), 0, 0);
S.prevPlanet = planetPos.clone();
setView('planeta', true);
{
  const g = viewGoal();
  camera.position.copy(g.pos);
  controls.target.copy(g.tgt);
}
canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); });
window.__pendulul = {
  scene, bh, S, setView, selectVolume, gotoPend, camera, controls, rockets, arrivedList, renderer, setQuality, fanare, parts,
  step: (sec) => { for (let k = 0; k < sec / 0.05; k++) { simTime += 0.05; stepSim(0.05); updateScene(0.05, simTime); } },
};

// Dacă laptopul nu ține pasul (cadre peste ~45 ms timp de ~1,5 s), coborâm singuri o treaptă de calitate.
let last = performance.now();
let slowFrames = 0, ema = 0.016;
function frame(now) {
  requestAnimationFrame(frame);
  const raw = (now - last) / 1000;
  last = now;
  if (document.body.classList.contains('reading')) return; // cititorul acoperă tot: nu mai randăm scena
  const dt = Math.min(0.05, Math.max(0, raw));
  simTime += dt;
  stepSim(dt);
  updateScene(dt, simTime);
  controls.update();
  let saved = null;
  if (S.shake > 0) { saved = camera.position.clone(); camera.position.add(V3((Math.random() - 0.5) * S.shake, (Math.random() - 0.5) * S.shake, (Math.random() - 0.5) * S.shake)); }
  composer.render();
  if (saved) camera.position.copy(saved);
  projectLabels();
  if (raw < 0.5 && !navigator.webdriver) {
    ema += (raw - ema) * 0.1;
    slowFrames = ema > 0.045 ? slowFrames + 1 : Math.max(0, slowFrames - 2);
    if (slowFrames > 90 && quality !== 'low') { slowFrames = 0; ema = 0.016; setQuality(quality === 'high' ? 'mid' : 'low'); }
  }
}
requestAnimationFrame(frame);
}

try {
  const probe = document.createElement('canvas');
  if (!(probe.getContext('webgl2') || probe.getContext('webgl'))) throw new Error('WebGL indisponibil');
  bootScene();
} catch (err) {
  startReaderOnly(err);
}
