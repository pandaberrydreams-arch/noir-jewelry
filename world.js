import * as THREE from 'three';
import { PALETTE, metalMaterial, crystalMaterial, fragmentMaterial, beamMaterial, haloMaterial, petalMaterial, particleTexture } from './materials.js';

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function buildFragment(size, mat, kind = 0) {
  const geos = [
    () => new THREE.IcosahedronGeometry(size, 0),
    () => new THREE.OctahedronGeometry(size, 0),
    () => new THREE.DodecahedronGeometry(size, 0),
  ];
  const m = new THREE.Mesh(geos[kind % 3](), mat);
  m.scale.set(1, 1.4 + (kind % 2) * 0.5, 0.8);
  return m;
}

export function buildArc(radius, tube, arc, mat) {
  return new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 12, 72, arc), mat);
}

/* Jewel-bloom: a crystalline halo of faceted translucent petals opening around a golden ring.
   The camera descends through its open centre. */
export function buildBloom({ radius, count, length, width, tilt, colors, opacity = 0.72, halo = true }) {
  const g = new THREE.Group();
  const petals = [];
  const gold = metalMaterial(0xF1D48A, 0.08);
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    const pivot = new THREE.Group();
    pivot.rotation.y = -a;
    const geo = new THREE.OctahedronGeometry(1, 0);
    geo.scale(width, length, width * 0.32);
    geo.translate(0, length * 0.9, 0);
    const petal = new THREE.Mesh(geo, petalMaterial(colors[i % colors.length], opacity));
    petal.position.x = radius;
    petal.rotation.z = -Math.PI / 2 + tilt;
    pivot.add(petal);
    /* tiny faceted bead at the petal base */
    const bead = new THREE.Mesh(new THREE.OctahedronGeometry(width * 0.32, 0), fragmentMaterial(colors[(i + 2) % colors.length]));
    bead.position.set(radius, -width * 0.15, 0);
    pivot.add(bead);
    g.add(pivot);
    petals.push({ petal, base: petal.rotation.z, ph: a });
  }
  if (halo) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, width * 0.14, 12, 160), gold);
    ring.rotation.x = Math.PI / 2;
    g.add(ring);
    const inner = new THREE.Mesh(new THREE.TorusGeometry(radius * 0.78, width * 0.06, 8, 140), gold);
    inner.rotation.x = Math.PI / 2;
    inner.position.y = -width * 0.6;
    g.add(inner);
  }
  g.userData.petals = petals;
  return g;
}

export function buildWorld(scene, quality) {
  const R = rng(11);
  const rand = (a, b) => a + R() * (b - a);
  const group = new THREE.Group();
  scene.add(group);
  const spinners = [];
  const orbiters = [];
  const blooms = [];

  /* ---------- Descent corridor: three moods along -Y ---------- */
  const moods = [
    { y0: -2, y1: -14, slab: crystalMaterial(0xFFEBC2, 0.2), frags: [PALETTE.gold, PALETTE.sapphire, PALETTE.emerald, PALETTE.pink], metal: metalMaterial(0xF0DDB4, 0.1), kind: 'radiance' },
    { y0: -14, y1: -26, slab: crystalMaterial(0xFFC9E6, 0.3), frags: [PALETTE.pink, PALETTE.violet, PALETTE.coral], metal: metalMaterial(0xF3D2E2, 0.1), kind: 'grace' },
    { y0: -26, y1: -40, slab: crystalMaterial(0xA7B8FF, 0.42), frags: [PALETTE.sapphire, PALETTE.violet, PALETTE.silver], metal: metalMaterial(0xD8DCE8, 0.06), kind: 'power' },
  ];

  moods.forEach((m) => {
    const power = m.kind === 'power', radiance = m.kind === 'radiance';
    const slabCount = radiance ? Math.round(quality.slabs * 0.6) : quality.slabs;
    for (let i = 0; i < slabCount; i++) {
      const a = rand(0, Math.PI * 2), r = rand(radiance ? 5.5 : 3.6, 8.5);
      const slab = new THREE.Mesh(
        new THREE.BoxGeometry(rand(1.6, power ? 5 : 4.2), rand(2.2, power ? 8 : 6), power ? rand(0.2, 0.5) : 0.06), m.slab
      );
      slab.position.set(Math.cos(a) * r, rand(m.y0, m.y1), Math.sin(a) * r);
      slab.rotation.set(power ? rand(-0.15, 0.15) : rand(-0.8, 0.8), rand(0, Math.PI * 2), power ? rand(-0.2, 0.2) : rand(-0.6, 0.6));
      group.add(slab);
    }
    const fragMats = m.frags.map((c) => fragmentMaterial(c));
    for (let i = 0; i < quality.fragments; i++) {
      const a = rand(0, Math.PI * 2), r = rand(radiance ? 3.6 : 1.5, radiance ? 6 : 4.5);
      const f = buildFragment(rand(0.1, 0.42), fragMats[i % fragMats.length], i);
      f.position.set(Math.cos(a) * r, rand(m.y0, m.y1), Math.sin(a) * r);
      f.rotation.set(rand(0, 3), rand(0, 3), rand(0, 3));
      group.add(f);
      spinners.push({ mesh: f, sx: rand(-0.2, 0.2), sy: rand(-0.3, 0.3), baseY: f.position.y, amp: rand(0.1, 0.35), ph: rand(0, 6), speed: rand(0.2, 0.5) });
    }

    if (radiance) {
      /* Two jewel-blooms replace the loose arcs: a bright opening halo and a wider, softer one deeper down */
      const bloomA = buildBloom({ radius: 2.3, count: 14, length: 2.2, width: 0.5, tilt: 0.55, opacity: 0.74,
        colors: [PALETTE.gold, PALETTE.sapphire, PALETTE.pink, PALETTE.emerald, PALETTE.coral] });
      bloomA.position.y = -7.2;
      group.add(bloomA);
      blooms.push({ g: bloomA, speed: 0.04 });
      const bloomB = buildBloom({ radius: 3.4, count: 18, length: 2.8, width: 0.6, tilt: 0.3, opacity: 0.55,
        colors: [PALETTE.sapphire, PALETTE.emerald, PALETTE.gold, PALETTE.pink] });
      bloomB.position.y = -12.2;
      group.add(bloomB);
      blooms.push({ g: bloomB, speed: -0.025 });
      /* A ring of tall floating prisms between the blooms */
      const prismMats = [petalMaterial(PALETTE.gold, 0.8), petalMaterial(PALETTE.sapphire, 0.8), petalMaterial(PALETTE.pink, 0.8), petalMaterial(PALETTE.emerald, 0.8)];
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + 0.3;
        const prism = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.22, rand(1.4, 2.4), 6, 1), prismMats[i % 4]);
        prism.position.set(Math.cos(a) * 4.6, rand(-11, -8), Math.sin(a) * 4.6);
        prism.rotation.set(rand(-0.25, 0.25), a, rand(-0.25, 0.25));
        group.add(prism);
        spinners.push({ mesh: prism, sx: 0, sy: rand(0.1, 0.25), baseY: prism.position.y, amp: rand(0.2, 0.45), ph: rand(0, 6), speed: rand(0.2, 0.4) });
      }
      /* Coloured glow within the chapter */
      const l1 = new THREE.PointLight(PALETTE.gold, 9, 14, 2); l1.position.set(2.5, -6.5, 1.5); group.add(l1);
      const l2 = new THREE.PointLight(PALETTE.sapphire, 8, 14, 2); l2.position.set(-2.5, -11, -1.5); group.add(l2);
      const l3 = new THREE.PointLight(PALETTE.pink, 5, 12, 2); l3.position.set(0.5, -9.5, 2.8); group.add(l3);
    } else {
      for (let i = 0; i < (power ? 6 : 4); i++) {
        const arc = buildArc(rand(2.6, 5.5), rand(0.03, power ? 0.09 : 0.06), Math.PI * rand(0.5, 1.4), m.metal);
        arc.position.set(rand(-1, 1), rand(m.y0, m.y1), rand(-1, 1));
        if (m.kind === 'grace') arc.rotation.set(rand(0, 3), rand(0, 3), rand(0, 3));
        else arc.rotation.set(0, rand(0, Math.PI * 2), rand(-0.2, 0.2));
        group.add(arc);
      }
      const l = new THREE.PointLight(power ? PALETTE.sapphire : PALETTE.pink, power ? 9 : 7, 16, 2);
      l.position.set(rand(-2, 2), (m.y0 + m.y1) / 2, rand(-2, 2));
      group.add(l);
    }
    if (m.kind === 'grace') {
      for (let k = 0; k < 3; k++) {
        const pts = [];
        const a0 = rand(0, 6);
        for (let j = 0; j < 7; j++) {
          const a = a0 + j * 0.85, r = 3 + Math.sin(j * 1.3) * 1.2;
          pts.push(new THREE.Vector3(Math.cos(a) * r, m.y0 - 1 - j * 1.7, Math.sin(a) * r));
        }
        group.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 96, 0.05, 10), m.metal));
      }
    }
  });

  /* ---------- Rising column around (0, *, -30) ---------- */
  const riseMetal = metalMaterial(0xE8E1D4, 0.08);
  const riseFrags = [fragmentMaterial(PALETTE.sapphire), fragmentMaterial(PALETTE.emerald), fragmentMaterial(PALETTE.gold)];
  const beamViolet = beamMaterial(0xC7B2FF, 0.22), beamGold = beamMaterial(0xFFE6A8, 0.2);
  for (let i = 0; i < 7; i++) {
    const rad = rand(0.08, 0.28);
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(rad, rad * 1.4, rand(16, 30), 10, 1, true), i % 2 ? beamViolet : beamGold);
    beam.position.set(rand(-7, 7), rand(-30, -10), -30 + rand(-5, 5));
    beam.rotation.set(rand(-0.06, 0.06), 0, rand(-0.06, 0.06));
    group.add(beam);
  }
  for (let i = 0; i < 8; i++) {
    const arc = buildArc(rand(3, 7.5), rand(0.03, 0.07), Math.PI * rand(0.4, 0.9), riseMetal);
    arc.position.set(rand(-2, 2), rand(-34, -8), -30 + rand(-3, 3));
    arc.rotation.set(0, rand(0, Math.PI * 2), rand(-0.4, 0.4));
    group.add(arc);
  }
  [[-22, 6], [-15, 8.5], [-9, 11]].forEach(([y, r]) => {
    const halo = new THREE.Mesh(new THREE.TorusGeometry(r, 0.03, 8, 160), riseMetal);
    halo.rotation.x = Math.PI / 2;
    halo.position.set(0, y, -30);
    group.add(halo);
  });
  for (let i = 0; i < quality.fragments; i++) {
    const f = buildFragment(rand(0.12, 0.5), riseFrags[i % 3], i);
    f.position.set(rand(-8, 8), rand(-38, -6), -30 + rand(-7, 7));
    f.rotation.set(rand(0, 3), rand(0, 3), rand(0, 3));
    group.add(f);
    spinners.push({ mesh: f, sx: rand(-0.2, 0.2), sy: rand(-0.3, 0.3), baseY: f.position.y, amp: rand(0.4, 1.2), ph: rand(0, 6), speed: rand(0.15, 0.35) });
  }
  const riseLight = new THREE.PointLight(PALETTE.violet, 10, 22, 2);
  riseLight.position.set(0, -18, -30);
  group.add(riseLight);

  /* ---------- Monumental composition at (0, -6, -30) ---------- */
  const monument = new THREE.Group();
  monument.position.set(0, -6, -30);
  group.add(monument);
  const haloMats = [haloMaterial(0xB89CFF, 0.6), metalMaterial(0xF1D48A, 0.08), riseMetal];
  [[2.7, 0.012], [3.9, 0.02], [5.4, 0.016]].forEach(([r, tube], i) => {
    monument.add(new THREE.Mesh(new THREE.TorusGeometry(r, tube, 8, 200), haloMats[i]));
  });
  for (let i = 0; i < 6; i++) {
    const arc = buildArc(rand(2.9, 4.8), rand(0.03, 0.07), Math.PI * rand(0.3, 0.8), riseMetal);
    arc.rotation.set(rand(-0.3, 0.3), rand(-0.5, 0.5), rand(0, Math.PI * 2));
    arc.position.z = rand(-1.5, 1.5);
    monument.add(arc);
  }
  const monMats = [fragmentMaterial(PALETTE.sapphire), fragmentMaterial(PALETTE.pink), fragmentMaterial(PALETTE.gold), fragmentMaterial(PALETTE.emerald)];
  for (let i = 0; i < 24; i++) {
    const f = buildFragment(rand(0.1, 0.4), monMats[i % 4], i);
    monument.add(f);
    orbiters.push({ mesh: f, a: rand(0, Math.PI * 2), r: rand(2.3, 5.6), y: rand(-2.6, 2.6), speed: rand(0.03, 0.08) * (i % 2 ? 1 : -1), sx: rand(-0.3, 0.3) });
  }
  const monLightA = new THREE.PointLight(PALETTE.gold, 7, 16, 2); monLightA.position.set(4, 3, 2); monument.add(monLightA);
  const monLightB = new THREE.PointLight(PALETTE.sapphire, 7, 16, 2); monLightB.position.set(-4, -2, 2); monument.add(monLightB);

  /* ---------- Atmosphere particles ---------- */
  const count = quality.particles;
  const pos = new Float32Array(count * 3);
  const vel = new Float32Array(count);
  const bounds = new Float32Array(count * 2);
  for (let i = 0; i < count; i++) {
    const rising = i > count * 0.6;
    pos[i * 3] = rand(-8, 8);
    pos[i * 3 + 2] = rising ? -30 + rand(-8, 8) : rand(-7, 7);
    const lo = rising ? -42 : -44, hi = rising ? 0 : 6;
    pos[i * 3 + 1] = rand(lo, hi);
    bounds[i * 2] = lo; bounds[i * 2 + 1] = hi;
    vel[i] = rising ? rand(0.08, 0.2) : rand(-0.12, 0.06);
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const particles = new THREE.Points(pGeo, new THREE.PointsMaterial({
    size: 0.11, map: particleTexture(), transparent: true, opacity: 0.65, depthWrite: false, color: 0xFFEFC8, sizeAttenuation: true,
  }));
  scene.add(particles);

  function update(t, dt) {
    for (const s of spinners) {
      s.mesh.rotation.x += s.sx * dt;
      s.mesh.rotation.y += s.sy * dt;
      s.mesh.position.y = s.baseY + Math.sin(t * s.speed + s.ph) * s.amp;
    }
    for (const o of orbiters) {
      o.a += o.speed * dt;
      o.mesh.position.set(Math.cos(o.a) * o.r, o.y + Math.sin(t * 0.3 + o.a) * 0.25, Math.sin(o.a) * o.r * 0.45);
      o.mesh.rotation.x += o.sx * dt;
      o.mesh.rotation.y += 0.2 * dt;
    }
    for (const b of blooms) {
      b.g.rotation.y += b.speed * dt;
      for (const p of b.g.userData.petals) p.petal.rotation.z = p.base + Math.sin(t * 0.35 + p.ph) * 0.05;
    }
    const p = pGeo.attributes.position.array;
    for (let i = 0; i < count; i++) {
      let y = p[i * 3 + 1] + vel[i] * dt;
      const lo = bounds[i * 2], hi = bounds[i * 2 + 1];
      if (y > hi) y = lo; else if (y < lo) y = hi;
      p[i * 3 + 1] = y;
      p[i * 3] += Math.sin(t * 0.2 + i) * 0.002;
    }
    pGeo.attributes.position.needsUpdate = true;
    monument.rotation.z = Math.sin(t * 0.08) * 0.03;
  }

  return { group, monument, particles, update };
}