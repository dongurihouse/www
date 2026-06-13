import * as THREE from 'three';
import { sampleShape, SHAPE_PATHS } from './shapes';
import { mulberry32 } from './morph';

export interface Field {
  start(): void;
  stop(): void;
  dispose(): void;
  resize(): void;
}

const COLORS = [0xb9892f, 0xc8852f, 0x9cbf76, 0x6c9a5b];
const DRIFT_MS = 6000;
const FORM_MS = 4200;

export function createField(canvas: HTMLCanvasElement, count: number): Field {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));

  const scene = new THREE.Scene();
  // Ortho camera; left/right set to aspect on resize so x is not stretched.
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 10);
  camera.position.z = 1;

  const rng = mulberry32(7);

  const positions = new Float32Array(count * 3);
  const drift = new Float32Array(count * 2); // home/scatter anchor (x,y)
  const colors = new Float32Array(count * 3);
  const c = new THREE.Color();
  for (let i = 0; i < count; i++) {
    const x = (rng() * 2 - 1) * 1.4;
    const y = (rng() * 2 - 1) * 1.1;
    positions[i * 3] = x; positions[i * 3 + 1] = y; positions[i * 3 + 2] = 0;
    drift[i * 2] = x; drift[i * 2 + 1] = y;
    c.set(COLORS[Math.floor(rng() * COLORS.length)]);
    colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const material = new THREE.PointsMaterial({
    size: 2.6, sizeAttenuation: false, vertexColors: true,
    transparent: true, opacity: 0.9, depthWrite: false,
  });
  const points = new THREE.Points(geom, material);
  scene.add(points);

  // sample every silhouette once; the groups cycle through them
  const shapes = (Object.keys(SHAPE_PATHS) as (keyof typeof SHAPE_PATHS)[])
    .map((name) => sampleShape(name, count))
    .filter((s): s is Float32Array => s !== null);

  // Split the particles into independent morph groups, so several shapes can
  // form at the same time — each in its own corner, on its own offset timing.
  const G = count >= 2500 ? 3 : 2;
  const gStart: number[] = [];
  const gEnd: number[] = [];
  const groupSize = Math.floor(count / G);
  const phase: ('drift' | 'form')[] = [];
  const phaseElapsed: number[] = [];
  const shapeIdx: number[] = [];
  for (let g = 0; g < G; g++) {
    gStart[g] = g * groupSize;
    gEnd[g] = g === G - 1 ? count : (g + 1) * groupSize;
    phase[g] = 'drift';
    phaseElapsed[g] = rng() * DRIFT_MS;                              // desync the groups
    shapeIdx[g] = shapes.length ? (g * 2) % shapes.length : 0;       // start on spaced-out shapes
  }

  // Corner slots (recomputed from camera bounds each frame so they track resize).
  function slot(g: number) {
    const halfW = camera.right, halfH = camera.top;
    const s = Math.min(halfW, halfH) * 0.22;
    const right = halfW - s - 0.12;
    const top = halfH - s - 0.18;
    const bottom = -(halfH - s - 0.30);
    const slots = [
      { cx: right, cy: top },
      { cx: -right, cy: top },
      { cx: right, cy: bottom },
      { cx: -right, cy: bottom },
    ];
    const p = slots[g % slots.length];
    return { cx: p.cx, cy: p.cy, s };
  }

  const pointer = new THREE.Vector2(0, 0);
  function onPointer(e: PointerEvent) {
    const r = canvas.getBoundingClientRect();
    const aspect = r.width / r.height || 1;
    pointer.set(
      (((e.clientX - r.left) / r.width) * 2 - 1) * aspect,
      -(((e.clientY - r.top) / r.height) * 2 - 1),
    );
  }

  let raf = 0;
  let running = false;
  let last = 0;
  let elapsed = 0;

  function frame(now: number) {
    if (!running) return;
    if (!last) last = now;
    const dt = Math.min(now - last, 50);
    last = now;
    elapsed += dt;

    const pos = geom.getAttribute('position') as THREE.BufferAttribute;
    const arr = pos.array as Float32Array;

    for (let g = 0; g < G; g++) {
      phaseElapsed[g] += dt;
      const forming = phase[g] === 'form' && shapes.length > 0;
      const t = forming ? 0.06 : 0.02; // gather faster than scatter
      const sp = forming ? slot(g) : null;
      const buf = forming ? shapes[shapeIdx[g]] : null;

      for (let i = gStart[g]; i < gEnd[g]; i++) {
        let tx: number, ty: number;
        if (buf && sp) {
          const j = i - gStart[g];
          tx = buf[j * 2] * sp.s + sp.cx;
          ty = buf[j * 2 + 1] * sp.s + sp.cy;
        } else {
          const a = i * 12.9898;
          tx = drift[i * 2] + Math.sin(elapsed * 0.0003 + a) * 0.05;
          ty = drift[i * 2 + 1] + Math.cos(elapsed * 0.00025 + a) * 0.05;
        }
        const dx = arr[i * 3] - pointer.x;
        const dy = arr[i * 3 + 1] - pointer.y;
        const d2 = dx * dx + dy * dy;
        const repel = d2 < 0.04 ? (0.04 - d2) * 1.2 : 0;
        arr[i * 3] += (tx - arr[i * 3]) * t + dx * repel;
        arr[i * 3 + 1] += (ty - arr[i * 3 + 1]) * t + dy * repel;
      }

      if (phase[g] === 'form') {
        if (phaseElapsed[g] > FORM_MS) {
          phase[g] = 'drift'; phaseElapsed[g] = 0;
          shapeIdx[g] = shapes.length ? (shapeIdx[g] + 1) % shapes.length : 0;
        }
      } else if (phaseElapsed[g] > DRIFT_MS && shapes.length) {
        phase[g] = 'form'; phaseElapsed[g] = 0;
      }
    }

    pos.needsUpdate = true;

    // gentle whole-field parallax toward pointer
    points.position.x += (pointer.x * 0.03 - points.position.x) * 0.05;
    points.position.y += (pointer.y * 0.03 - points.position.y) * 0.05;

    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  }

  function resize() {
    const w = canvas.clientWidth || canvas.parentElement?.clientWidth || 1;
    const h = canvas.clientHeight || canvas.parentElement?.clientHeight || 1;
    renderer.setSize(w, h, false);
    const aspect = w / h;
    camera.left = -aspect; camera.right = aspect; camera.top = 1; camera.bottom = -1;
    camera.updateProjectionMatrix();
  }

  return {
    start() {
      if (running) return;
      running = true; last = 0;
      resize();
      window.addEventListener('pointermove', onPointer, { passive: true });
      raf = requestAnimationFrame(frame);
    },
    stop() {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onPointer);
    },
    dispose() {
      this.stop();
      geom.dispose(); material.dispose(); renderer.dispose();
    },
    resize,
  };
}
