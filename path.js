import * as THREE from 'three';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
export const smooth = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));

/* Camera keyframes across the immersive story (p in 0..1) */
const KEYS = [
  { t: 0.00, pos: V(0, 0.6, 10.5), look: V(0, 0.55, 0) },
  { t: 0.10, pos: V(0.2, 0.5, 8.0), look: V(0, 0.5, 0) },
  { t: 0.19, pos: V(1.2, 0.5, 4.4), look: V(0, 0.45, 0) },
  { t: 0.26, pos: V(0.25, 1.32, 1.8), look: V(0, 1.32, 0) },
  { t: 0.31, pos: V(0, 1.33, 0.55), look: V(0, 1.33, 0) },
  { t: 0.36, pos: V(0, 1.0, 0), look: V(0, -8, -0.03) },
  { t: 0.42, pos: V(0, -4, 0), look: V(0, -14, -0.05) },
  { t: 0.54, pos: V(0, -15, 0), look: V(0, -25, -0.05) },
  { t: 0.66, pos: V(0, -27, 0), look: V(0, -37, -0.05) },
  { t: 0.73, pos: V(0, -37, -1), look: V(0, -40, -9) },
  { t: 0.80, pos: V(0, -36, -7), look: V(0, -22, -30) },
  { t: 0.90, pos: V(0, -20, -16), look: V(0, -8, -30) },
  { t: 1.00, pos: V(0, -6, -21.5), look: V(0, -6, -30) },
];

/* Atmosphere colour per chapter */
const FOG = [
  [0.00, new THREE.Color(0xF7F3EC)],
  [0.34, new THREE.Color(0xF6EEE4)],
  [0.46, new THREE.Color(0xFBE8C6)],
  [0.58, new THREE.Color(0xF9D3E6)],
  [0.70, new THREE.Color(0xD4DAF4)],
  [0.82, new THREE.Color(0xE6DDFA)],
  [1.00, new THREE.Color(0xF7F3EC)],
];

/* Caption windows measured in story progress; the monument caption overruns into the web part */
const CAPS = [
  ['cap-brand', 0.015, 0.13], ['cap-tag', 0.07, 0.17], ['cap-ring', 0.18, 0.275],
  ['cap-enter', 0.285, 0.335], ['cap-radiance', 0.40, 0.51], ['cap-grace', 0.535, 0.635],
  ['cap-power', 0.655, 0.735], ['cap-rise', 0.78, 0.88], ['cap-monument', 0.94, 1.14],
].map(([id, a, b]) => ({ el: document.getElementById(id), a, b }));

export function cameraAt(p, pos, look) {
  let i = 0;
  while (i < KEYS.length - 2 && p > KEYS[i + 1].t) i++;
  const a = KEYS[i], b = KEYS[i + 1];
  const s = smooth((p - a.t) / (b.t - a.t));
  pos.lerpVectors(a.pos, b.pos, s);
  look.lerpVectors(a.look, b.look, s);
}

export function fogColorAt(p, out) {
  let i = 0;
  while (i < FOG.length - 2 && p > FOG[i + 1][0]) i++;
  const [ta, ca] = FOG[i], [tb, cb] = FOG[i + 1];
  out.copy(ca).lerp(cb, smooth((p - ta) / (tb - ta)));
}

export function updateCaptions(u) {
  for (const c of CAPS) c.el.classList.toggle('is-visible', u >= c.a && u <= c.b);
}