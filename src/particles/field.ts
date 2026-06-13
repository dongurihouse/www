import * as THREE from 'three';
import { sampleShape } from './shapes';
import { mulberry32 } from './morph';

export interface Field {
  start(): void;
  stop(): void;
  dispose(): void;
  resize(): void;
}

const COLORS = [0xb9892f, 0xc8852f, 0x9cbf76, 0x6c9a5b];

export function createField(canvas: HTMLCanvasElement, count: number): Field {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));

  const scene = new THREE.Scene();
  // Ortho camera; left/right set to aspect on resize so x is not stretched.
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 10);
  camera.position.z = 1;

  const rng = mulberry32(7);

  // current positions (x,y,z per particle); z stays ~0
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

  // morph targets: acorn then leaf (fall back to drift only if sampling fails)
  const acorn = sampleShape('acorn', count);
  const leaf = sampleShape('leaf', count);
  const shapes = [acorn, leaf].filter((s): s is Float32Array => s !== null);

  const target = new Float32Array(count * 2);

  let phase: 'drift' | 'form' = 'drift';
  let phaseStart = 0;
  let shapeIdx = 0;
  const DRIFT_MS = 7000;
  const FORM_MS = 4500;

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

  function setTargetDrift(tms: number) {
    for (let i = 0; i < count; i++) {
      const a = i * 12.9898;
      target[i * 2] = drift[i * 2] + Math.sin(tms * 0.0003 + a) * 0.05;
      target[i * 2 + 1] = drift[i * 2 + 1] + Math.cos(tms * 0.00025 + a) * 0.05;
    }
  }

  function setTargetShape(buf: Float32Array) {
    for (let i = 0; i < count * 2; i++) target[i] = buf[i] * 0.62;
  }

  function frame(now: number) {
    if (!running) return;
    if (!last) last = now;
    const dt = Math.min(now - last, 50);
    last = now;
    elapsed += dt;

    const inPhase = now - phaseStart;
    if (phase === 'drift') {
      setTargetDrift(elapsed);
      if (inPhase > DRIFT_MS && shapes.length) { phase = 'form'; phaseStart = now; }
    } else {
      setTargetShape(shapes[shapeIdx]);
      if (inPhase > FORM_MS) {
        phase = 'drift'; phaseStart = now;
        shapeIdx = (shapeIdx + 1) % shapes.length;
      }
    }

    // gather faster than scatter for a satisfying snap
    const t = phase === 'form' ? 0.06 : 0.02;
    const pos = geom.getAttribute('position') as THREE.BufferAttribute;
    const arr = pos.array as Float32Array;
    for (let i = 0; i < count; i++) {
      const tx = target[i * 2];
      const ty = target[i * 2 + 1];
      const dx = arr[i * 3] - pointer.x;
      const dy = arr[i * 3 + 1] - pointer.y;
      const d2 = dx * dx + dy * dy;
      const repel = d2 < 0.04 ? (0.04 - d2) * 1.2 : 0;
      arr[i * 3] += (tx - arr[i * 3]) * t + dx * repel;
      arr[i * 3 + 1] += (ty - arr[i * 3 + 1]) * t + dy * repel;
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
      phaseStart = performance.now();
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
