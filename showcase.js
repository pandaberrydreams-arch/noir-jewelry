import * as THREE from 'three';

const _v = new THREE.Vector3();
const _dir = new THREE.Vector3();
const _cam = new THREE.Vector3();
const _target = new THREE.Vector3();

/* Places 3D objects onto HTML .slot elements so the 3D world settles into the page layout.
   Each object has a "home" in the monumental composition and one or more slots. */
export class Showcase {
  constructor(camera) {
    this.camera = camera;
    this.items = [];
  }

  add(name, object, opts) {
    const slots = [...document.querySelectorAll(`.slot[data-object="${name}"]`)];
    object.position.copy(opts.home);
    object.scale.setScalar(opts.homeScale ?? 1);
    if (opts.hideAtHome) object.visible = false;
    this.items.push({
      object, slots, home: opts.home.clone(), homeScale: opts.homeScale ?? 1, baseSize: opts.baseSize,
      spin: opts.spin ?? 0.15, hideAtHome: !!opts.hideAtHome, scale: opts.homeScale ?? 1,
      rot: new THREE.Vector2(), targetRot: new THREE.Vector2(), baseRotX: opts.baseRotX ?? 0,
    });
  }

  update(dt, t, pointer) {
    const H = window.innerHeight, W = window.innerWidth;
    const k = 1 - Math.exp(-dt * 3.2);
    const cam = this.camera;
    cam.getWorldPosition(_cam);
    const fov = THREE.MathUtils.degToRad(cam.fov);

    for (const it of this.items) {
      let best = null, bestRect = null, bestD = Infinity;
      for (const slot of it.slots) {
        const r = slot.getBoundingClientRect();
        if (r.bottom < -0.15 * H || r.top > 1.15 * H) continue;
        const d = Math.abs(r.top + r.height / 2 - H / 2);
        if (d < bestD) { bestD = d; best = slot; bestRect = r; }
      }

      let targetScale;
      if (best) {
        const depth = parseFloat(best.dataset.depth || '6');
        const fit = parseFloat(best.dataset.fit || '0.85');
        const nx = ((bestRect.left + bestRect.width / 2) / W) * 2 - 1;
        const ny = -((bestRect.top + bestRect.height / 2) / H) * 2 + 1;
        _v.set(nx, ny, 0.5).unproject(cam);
        _dir.copy(_v).sub(_cam).normalize();
        _target.copy(_cam).addScaledVector(_dir, depth);
        const visibleH = 2 * depth * Math.tan(fov / 2);
        targetScale = ((bestRect.height / H) * visibleH * fit) / it.baseSize;

        if (best.dataset.scrollRotate) {
          const sec = best.closest('section').getBoundingClientRect();
          const prog = THREE.MathUtils.clamp(-sec.top / Math.max(1, sec.height - H), 0, 1);
          it.targetRot.set(0.5 - prog * 0.9, -0.6 + prog * Math.PI * 1.6);
        } else {
          const hover = best.matches(':hover');
          it.targetRot.set(pointer.y * 0.08 + (hover ? -0.22 : 0.08), pointer.x * 0.14 + (hover ? 0.5 : 0));
        }
        it.object.visible = true;
      } else {
        _target.copy(it.home);
        targetScale = it.homeScale;
        it.targetRot.set(0, 0);
        if (it.hideAtHome && it.scale < 0.02) it.object.visible = false;
        if (it.hideAtHome) targetScale = 0;
      }

      it.object.position.lerp(_target, k);
      it.scale += (targetScale - it.scale) * k;
      it.object.scale.setScalar(Math.max(it.scale, 0.0001));
      it.rot.lerp(it.targetRot, k);
      it.object.rotation.set(it.baseRotX + it.rot.x + Math.sin(t * 0.4) * 0.02, it.rot.y + t * it.spin, 0);
    }
  }
}