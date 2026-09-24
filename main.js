import * as THREE from 'three';
import { createEnvironment, PALETTE, fragmentMaterial, gemMaterial } from './materials.js';
import { buildRing, buildPendant, buildEarrings, gemGeometry, buildMacroArc, buildMacroBand } from './jewelry.js';
import { buildWorld, buildFragment } from './world.js';
import { cameraAt, fogColorAt, updateCaptions, smooth } from './path.js';
import { Showcase } from './showcase.js';

const isMobile = window.innerWidth < 768;

/* ---------- Renderer & scene ---------- */
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('gl'), antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 1.75));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.06;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const atmosphere = new THREE.Color(PALETTE.pearl);
scene.background = atmosphere;
scene.fog = new THREE.FogExp2(atmosphere, 0.045);
scene.environment = createEnvironment(renderer);

const camera = new THREE.PerspectiveCamera(isMobile ? 50 : 38, window.innerWidth / window.innerHeight, 0.05, 140);
scene.add(camera);

/* Lights travel with the camera so every chapter keeps the editorial key/rim balance */
const key = new THREE.DirectionalLight(0xFFF4E6, 2.4);
key.target.position.set(0, 0, -6);
camera.add(key, key.target);
const rim = new THREE.DirectionalLight(PALETTE.violet, 1.5);
rim.position.set(-4, 2, -8);
rim.target.position.set(0, 0, -4);
camera.add(rim, rim.target);
const rim2 = new THREE.DirectionalLight(PALETTE.sapphire, 0.7);
rim2.position.set(5, -2, -6);
rim2.target.position.set(0, 0, -4);
camera.add(rim2, rim2.target);
scene.add(new THREE.HemisphereLight(0xFFF6E8, PALETTE.champagne, 0.5));

/* ---------- Hero ring & inner world ---------- */
const hero = buildRing();
scene.add(hero);

const quality = { slabs: isMobile ? 7 : 13, fragments: isMobile ? 12 : 26, particles: isMobile ? 350 : 900 };
const world = buildWorld(scene, quality);

/* ---------- Showcase objects: live in the monumental composition, then settle into page slots ---------- */
const showcase = new Showcase(camera);

const ring2 = buildRing({ silver: true });
scene.add(ring2);
showcase.add('ring', ring2, { home: new THREE.Vector3(0, -6, -30), homeScale: 1.6, baseSize: 2.6, spin: 0.12 });

const pendant = buildPendant();
scene.add(pendant);
showcase.add('pendant', pendant, { home: new THREE.Vector3(4.4, -4.8, -31.5), homeScale: 0.9, baseSize: 3.0, spin: 0.1 });

const earrings = buildEarrings();
scene.add(earrings);
showcase.add('earrings', earrings, { home: new THREE.Vector3(-4.4, -7.6, -31.5), homeScale: 1.0, baseSize: 1.3, spin: 0.1 });

const fragment = buildFragment(0.5, fragmentMaterial(PALETTE.sapphire), 0);
scene.add(fragment);
showcase.add('fragment', fragment, { home: new THREE.Vector3(0, -6, -30), homeScale: 0, baseSize: 1.4, spin: 0.2, hideAtHome: true });

const macroGem = new THREE.Mesh(gemGeometry(0.5), gemMaterial(PALETTE.gold));
scene.add(macroGem);
showcase.add('macroGem', macroGem, { home: new THREE.Vector3(0, -6, -30), homeScale: 0, baseSize: 0.66, spin: 0.25, hideAtHome: true, baseRotX: 0.5 });

const macroArc = buildMacroArc();
scene.add(macroArc);
showcase.add('macroArc', macroArc, { home: new THREE.Vector3(0, -6, -30), homeScale: 0, baseSize: 2.4, spin: 0.08, hideAtHome: true });

const macroBand = buildMacroBand();
scene.add(macroBand);
showcase.add('macroBand', macroBand, { home: new THREE.Vector3(0, -6, -30), homeScale: 0, baseSize: 2.3, spin: 0.1, hideAtHome: true });

const ctaGem = new THREE.Mesh(gemGeometry(0.6), gemMaterial(PALETTE.emerald));
scene.add(ctaGem);
showcase.add('ctaGem', ctaGem, { home: new THREE.Vector3(0, -6, -30), homeScale: 0, baseSize: 0.8, spin: 0.18, hideAtHome: true, baseRotX: 0.9 });

/* ---------- Scroll, pointer, DOM ---------- */
const track = document.getElementById('track');
const nav = document.getElementById('nav');
const hint = document.getElementById('hint');
const veil = document.getElementById('veil');
let trackH = track.offsetHeight;

const scroll = { target: window.scrollY, current: window.scrollY };
window.addEventListener('scroll', () => { scroll.target = window.scrollY; }, { passive: true });

const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
window.addEventListener('pointermove', (e) => {
  pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
  pointer.ty = (e.clientY / window.innerHeight) * 2 - 1;
});

window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  trackH = track.offsetHeight;
});

/* ---------- Frame loop ---------- */
const clock = new THREE.Clock();
const camPos = new THREE.Vector3();
const camLook = new THREE.Vector3();
const fogC = new THREE.Color();

function frame() {
  requestAnimationFrame(frame);
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;

  scroll.current += (scroll.target - scroll.current) * (1 - Math.exp(-dt * 6));
  pointer.x += (pointer.tx - pointer.x) * (1 - Math.exp(-dt * 3));
  pointer.y += (pointer.ty - pointer.y) * (1 - Math.exp(-dt * 3));

  const storyLen = Math.max(1, trackH - window.innerHeight);
  const p = THREE.MathUtils.clamp(scroll.current / storyLen, 0, 1);
  const w = THREE.MathUtils.clamp((scroll.current - storyLen) / (window.innerHeight * 1.6), 0, 1);

  /* Camera along the story path + restrained cursor parallax */
  cameraAt(p, camPos, camLook);
  camera.position.copy(camPos);
  camera.lookAt(camLook);
  camera.rotateY(-pointer.x * 0.03);
  camera.rotateX(-pointer.y * 0.02);
  camera.updateMatrixWorld();

  /* Atmosphere */
  fogColorAt(p, fogC);
  atmosphere.copy(fogC);
  scene.fog.density = 0.045 + w * 0.03;

  /* Opening: reveal the ring through moving light */
  const reveal = smooth(p / 0.16);
  hero.userData.metals.forEach((m) => { m.envMapIntensity = 0.12 + 1.3 * reveal; });
  hero.userData.gem.material.envMapIntensity = 0.3 + 1.2 * reveal;
  hero.userData.gem.material.attenuationDistance = THREE.MathUtils.lerp(2.6, 0.55, smooth((p - 0.12) / 0.18));
  key.position.set(THREE.MathUtils.lerp(-6, 3, reveal), THREE.MathUtils.lerp(1, 4, reveal), THREE.MathUtils.lerp(-14, 2, reveal));
  key.intensity = 0.7 + 1.8 * reveal;

  hero.visible = p < 0.345;
  hero.rotation.y = -0.7 + p * 2.4 + Math.sin(t * 0.25) * 0.04;
  hero.rotation.x = Math.sin(t * 0.2) * 0.03;
  hero.position.y = Math.sin(t * 0.5) * 0.03;

  /* Pearl-lilac veil masks the instant we pass into the stone */
  veil.style.opacity = Math.exp(-Math.pow((p - 0.345) / 0.022, 2)).toFixed(3);

  updateCaptions(p + w);
  nav.classList.toggle('is-visible', p + w > 0.12);
  hint.classList.toggle('is-hidden', p > 0.03);

  /* The monumental world recedes into haze as the page takes over */
  world.group.position.z = -w * 35;
  world.update(t, dt);
  showcase.update(dt, t, pointer);

  renderer.render(scene, camera);
}
frame();