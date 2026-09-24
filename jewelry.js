import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { metalMaterial, gemMaterial, PALETTE } from './materials.js';

/* Faceted cut: eight-sided crown with table + pavilion point */
export function gemGeometry(r = 0.32) {
  const crown = new THREE.CylinderGeometry(r * 0.6, r, r * 0.42, 8, 1);
  crown.translate(0, r * 0.21, 0);
  const pavilion = new THREE.CylinderGeometry(r, 0.015, r * 0.9, 8, 1);
  pavilion.translate(0, -r * 0.45, 0);
  return mergeGeometries([crown, pavilion]);
}

function collectMetals(group) {
  const list = [];
  group.traverse((o) => { if (o.isMesh && o.material.metalness === 1) list.push(o.material); });
  return list;
}

function setting(group, y, r, mat) {
  const open = mat.clone(); open.side = THREE.DoubleSide;
  const bezel = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.15, r * 0.85, r * 0.55, 8, 1, true), open);
  bezel.position.y = y - r * 0.35;
  group.add(bezel);
  const base = new THREE.Mesh(new THREE.TorusGeometry(r * 1.05, r * 0.11, 12, 48), mat);
  base.rotation.x = Math.PI / 2;
  base.position.y = y - r * 0.62;
  group.add(base);
  for (let i = 0; i < 4; i++) {
    const a = Math.PI / 4 + i * Math.PI / 2;
    const prong = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.08, r * 0.12, r * 0.9, 8), mat);
    prong.position.set(Math.cos(a) * r * 1.02, y + r * 0.05, Math.sin(a) * r * 1.02);
    prong.rotation.z = -Math.cos(a) * 0.28;
    prong.rotation.x = Math.sin(a) * 0.28;
    group.add(prong);
  }
}

export function buildRing({ silver = false, attenuation = 0x8F7CFF } = {}) {
  const g = new THREE.Group();
  const metal = metalMaterial(silver ? 0xDADCE2 : 0xE8E1D6, 0.11);
  const band = new THREE.Mesh(new THREE.TorusGeometry(1, 0.11, 28, 128), metal);
  band.scale.set(1, 1, 1.35);
  g.add(band);
  const y = 1.34, r = 0.32;
  setting(g, y, r, metal);
  const gem = new THREE.Mesh(gemGeometry(r), gemMaterial(attenuation));
  gem.position.y = y;
  gem.rotation.y = Math.PI / 8;
  g.add(gem);
  [-1, 1].forEach((s) => {
    const side = new THREE.Mesh(gemGeometry(0.1), gemMaterial(s > 0 ? PALETTE.pink : PALETTE.sapphire));
    side.position.set(s * 0.56, 1.0, 0);
    side.rotation.z = -s * 0.55;
    g.add(side);
  });
  g.userData.gem = gem;
  g.userData.metals = collectMetals(g);
  return g;
}

export function buildPendant() {
  const g = new THREE.Group();
  const inner = new THREE.Group();
  inner.position.y = -0.75;
  g.add(inner);
  const metal = metalMaterial(0xE6DED2, 0.1);
  const frame = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.045, 20, 96), metal);
  frame.scale.set(0.82, 1.15, 1);
  inner.add(frame);
  const bail = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.024, 12, 40), metal);
  bail.position.y = 0.72;
  bail.rotation.y = Math.PI / 2;
  inner.add(bail);
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.5, 10), metal);
  bar.position.y = 0.4;
  inner.add(bar);
  const gem = new THREE.Mesh(gemGeometry(0.26), gemMaterial(PALETTE.sapphire));
  gem.position.y = -0.02;
  gem.rotation.x = Math.PI / 2;
  inner.add(gem);
  const chain = (s) => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.8, 0), new THREE.Vector3(s * 0.42, 1.5, 0.06), new THREE.Vector3(s * 0.92, 2.3, 0.12),
    ]);
    inner.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 32, 0.016, 8), metal));
  };
  chain(1); chain(-1);
  g.userData.gem = gem;
  return g;
}

export function buildEarrings() {
  const g = new THREE.Group();
  const metal = metalMaterial(0xE3E0E0, 0.1);
  const open = metal.clone(); open.side = THREE.DoubleSide;
  const make = (x, attenuation) => {
    const e = new THREE.Group();
    const hook = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.022, 12, 48, Math.PI * 1.25), metal);
    hook.rotation.z = -Math.PI * 0.15;
    hook.position.y = 0.55;
    e.add(hook);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.55, 10), metal);
    stem.position.y = 0.1;
    e.add(stem);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.17, 0.12, 8, 1, true), open);
    cap.position.y = -0.2;
    e.add(cap);
    const gem = new THREE.Mesh(gemGeometry(0.16), gemMaterial(attenuation));
    gem.position.y = -0.3;
    e.add(gem);
    e.position.x = x;
    g.add(e);
    return e;
  };
  make(-0.5, PALETTE.emerald);
  make(0.5, PALETTE.pink).rotation.z = 0.06;
  return g;
}

/* Macro objects for the craftsmanship section */
export function buildMacroArc() {
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-1.2, -0.6, 0.2), new THREE.Vector3(-0.5, 0.5, -0.1),
    new THREE.Vector3(0.4, -0.3, 0.2), new THREE.Vector3(1.2, 0.7, -0.2),
  ]);
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 96, 0.11, 16), metalMaterial(0xE7DFD3, 0.08)));
  const bead = new THREE.Mesh(gemGeometry(0.2), gemMaterial(PALETTE.emerald));
  bead.position.set(0.4, -0.3, 0.2);
  bead.rotation.x = Math.PI / 2;
  g.add(bead);
  return g;
}

export function buildMacroBand() {
  const g = new THREE.Group();
  const band = new THREE.Mesh(new THREE.TorusGeometry(1, 0.13, 32, 96, Math.PI * 0.8), metalMaterial(0xDCDDE3, 0.06));
  band.scale.set(1, 1, 1.4);
  band.rotation.z = Math.PI * 0.6;
  band.rotation.y = -0.4;
  g.add(band);
  return g;
}