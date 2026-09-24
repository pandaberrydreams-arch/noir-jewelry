import * as THREE from 'three';

export const PALETTE = {
  pearl: 0xF7F3EC, champagne: 0xE9DEC9, silver: 0xC9CCD3,
  sapphire: 0x4A7CFF, emerald: 0x38C98B, gold: 0xFFD84D, coral: 0xFF6B6B,
  pink: 0xFF7AD9, violet: 0xA97CFF,
  /* legacy aliases used by a few builders */
  lilac: 0xA97CFF, blush: 0xFF7AD9, jade: 0x38C98B, mauve: 0x8E6FA8,
};

/* Procedural studio environment: a warm room with soft colored light panels.
   Baked with PMREM so metals and gems reflect pearl, lilac, blush and jade. */
export function createEnvironment(renderer) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = new THREE.Scene();
  env.add(new THREE.Mesh(
    new THREE.SphereGeometry(20, 32, 16),
    new THREE.MeshBasicMaterial({ color: 0xE6DCD0, side: THREE.BackSide })
  ));
  const panel = (color, intensity, pos, size) => {
    const c = new THREE.Color(color).multiplyScalar(intensity);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(size[0], size[1]), new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide }));
    m.position.set(pos[0], pos[1], pos[2]);
    m.lookAt(0, 0, 0);
    env.add(m);
  };
  panel(0xFFF8F0, 4.5, [0, 9, 3], [9, 6]);
  panel(PALETTE.gold, 2.6, [6, 5, 7], [5, 5]);
  panel(PALETTE.sapphire, 2.8, [-10, 3, -2], [7, 9]);
  panel(PALETTE.pink, 2.2, [10, 1, 2], [6, 8]);
  panel(PALETTE.emerald, 1.8, [0, -9, 1], [10, 10]);
  panel(PALETTE.violet, 2.2, [2, 3, -10], [5, 6]);
  panel(PALETTE.coral, 1.4, [-6, -4, 8], [4, 5]);
  const texture = pmrem.fromScene(env, 0.04).texture;
  pmrem.dispose();
  return texture;
}

export function metalMaterial(color = 0xE8E1D6, roughness = 0.12) {
  return new THREE.MeshPhysicalMaterial({
    color, metalness: 1, roughness, clearcoat: 0.35, clearcoatRoughness: 0.18, envMapIntensity: 1.4,
  });
}

export function gemMaterial(attenuation = PALETTE.violet) {
  return new THREE.MeshPhysicalMaterial({
    color: 0xFFFFFF, metalness: 0, roughness: 0.03, transmission: 1, thickness: 1.4, ior: 1.72,
    iridescence: 1, iridescenceIOR: 1.32, iridescenceThicknessRange: [120, 640],
    attenuationColor: new THREE.Color(attenuation), attenuationDistance: 0.6,
    clearcoat: 1, clearcoatRoughness: 0.05, specularIntensity: 1, envMapIntensity: 1.5, flatShading: true,
  });
}

export function crystalMaterial(color, opacity = 0.3) {
  return new THREE.MeshPhysicalMaterial({
    color, transparent: true, opacity, roughness: 0.1, metalness: 0, iridescence: 0.65, iridescenceIOR: 1.4,
    clearcoat: 1, clearcoatRoughness: 0.1, side: THREE.DoubleSide, depthWrite: false, envMapIntensity: 1.2,
  });
}

export function fragmentMaterial(color) {
  return new THREE.MeshPhysicalMaterial({
    color, transparent: true, opacity: 0.86, roughness: 0.06, metalness: 0, iridescence: 1, iridescenceIOR: 1.3,
    clearcoat: 1, flatShading: true, envMapIntensity: 1.6,
    emissive: new THREE.Color(color), emissiveIntensity: 0.08,
  });
}

/* Faceted translucent petal for the jewel-bloom: glass-like, iridescent, softly self-lit */
export function petalMaterial(color, opacity = 0.72) {
  return new THREE.MeshPhysicalMaterial({
    color, transparent: true, opacity, roughness: 0.04, metalness: 0, iridescence: 0.9, iridescenceIOR: 1.35,
    iridescenceThicknessRange: [140, 520], clearcoat: 1, clearcoatRoughness: 0.04, flatShading: true,
    side: THREE.DoubleSide, depthWrite: false, envMapIntensity: 1.9,
    emissive: new THREE.Color(color), emissiveIntensity: 0.14,
  });
}

export function beamMaterial(color, opacity = 0.22) {
  return new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, fog: false, side: THREE.DoubleSide });
}

export function haloMaterial(color, opacity = 0.7) {
  return new THREE.MeshBasicMaterial({ color, transparent: true, opacity });
}

export function particleTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,250,240,1)');
  g.addColorStop(0.4, 'rgba(255,236,200,0.55)');
  g.addColorStop(1, 'rgba(255,236,200,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}