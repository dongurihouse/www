import * as THREE from 'three';
import { sampleShape, samplePath, SHAPE_PATHS } from './shapes';
import { mulberry32 } from './morph';
import { hover } from './hover';

export interface Field {
  start(): void;
  stop(): void;
  dispose(): void;
  resize(): void;
}

const COLORS = [0xb9892f, 0xc8852f, 0x9cbf76, 0x6c9a5b];
const DRIFT_MS = 6000;
const FORM_MS = 4200;

// a simple person silhouette for the "flee" scene
const FIGURE_PATH =
  'M50 6 C54 6 57 9 57 13 C57 17 54 20 50 20 C46 20 43 17 43 13 C43 9 46 6 50 6 Z' +
  'M46 21 L54 21 L53 32 L66 42 L62 47 L52 38 L52 52 L60 82 L54 84 L50 60 L46 84 L40 82 L48 52 L48 38 L38 47 L34 42 L47 32 Z';

export function createField(canvas: HTMLCanvasElement, count: number): Field {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 10);
  camera.position.z = 1;

  const rng = mulberry32(7);

  const positions = new Float32Array(count * 3);
  const drift = new Float32Array(count * 2);
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

  // ambient morph silhouettes + scene-specific shapes
  const shapes = (Object.keys(SHAPE_PATHS) as (keyof typeof SHAPE_PATHS)[])
    .map((name) => sampleShape(name, count))
    .filter((s): s is Float32Array => s !== null);
  const figurePts = samplePath(FIGURE_PATH, count);
  const treePts = sampleShape('tree', count);
  const housePts = sampleShape('house', count);

  const target = new Float32Array(count * 2);

  // ---- ambient state: independent morph groups in corners ----
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
    phaseElapsed[g] = rng() * DRIFT_MS;
    shapeIdx[g] = shapes.length ? (g * 2) % shapes.length : 0;
  }

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

  // ---- hover-scene state ----
  let swarmX = 0, swarmY = 0;
  let mergePhase: 'grid' | 'merge' = 'grid';
  let mergeElapsed = 0;
  let mergeIdx = 0;

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

  // ambient morph: each group drifts / forms its current shape in its corner
  function ambient(dt: number, arr: Float32Array) {
    for (let g = 0; g < G; g++) {
      phaseElapsed[g] += dt;
      const forming = phase[g] === 'form' && shapes.length > 0;
      const t = forming ? 0.06 : 0.02;
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
        moveToward(arr, i, tx, ty, t);
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
  }

  // Vibe Survivor: a figure runs (sweeps the left region) while a swarm cloud chases with lag
  function fillFlee() {
    const halfW = camera.right, halfH = camera.top;
    const cxRegion = -halfW * 0.42;
    const spanX = halfW * 0.5;
    const figScale = Math.min(halfW, halfH) * 0.3;
    const fx = cxRegion + Math.sin(elapsed * 0.0019) * spanX;
    const fy = 0.1 + Math.sin(elapsed * 0.006) * 0.05;
    swarmX += (fx - swarmX) * 0.013;          // chase with lag → a gap opens behind the figure
    swarmY += (fy - swarmY) * 0.013;
    const nFig = Math.floor(count * 0.22);
    for (let i = 0; i < count; i++) {
      if (i < nFig && figurePts) {
        target[i * 2] = figurePts[i * 2] * figScale + fx;
        target[i * 2 + 1] = figurePts[i * 2 + 1] * figScale + fy;
      } else {
        target[i * 2] = swarmX + drift[i * 2] * 0.15;   // tighter swarm cloud
        target[i * 2 + 1] = swarmY + drift[i * 2 + 1] * 0.15;
      }
    }
  }

  // Donguri: items sit in a grid, then collapse and merge into a tree / house, then reset
  function fillMerge(dt: number) {
    const halfW = camera.right, halfH = camera.top;
    const regionCx = halfW * 0.45, regionCy = 0.05;
    mergeElapsed += dt;
    const GRID_MS = 2200, MERGE_MS = 2200;
    const cols = 4, rows = 3, cells = cols * rows;
    const gapX = (halfW * 0.55) / cols, gapY = (halfH * 0.7) / rows;
    const mergeScale = Math.min(halfW, halfH) * 0.26;
    const mergeBuf = mergeIdx % 2 === 0 ? treePts : housePts;
    const grid = mergePhase === 'grid' || !mergeBuf;

    for (let i = 0; i < count; i++) {
      if (grid) {
        const cell = i % cells;
        const ccx = regionCx + ((cell % cols) - (cols - 1) / 2) * gapX;
        const ccy = regionCy + (Math.floor(cell / cols) - (rows - 1) / 2) * gapY;
        target[i * 2] = ccx + drift[i * 2] * 0.025;
        target[i * 2 + 1] = ccy + drift[i * 2 + 1] * 0.025;
      } else {
        target[i * 2] = mergeBuf![i * 2] * mergeScale + regionCx;
        target[i * 2 + 1] = mergeBuf![i * 2 + 1] * mergeScale + regionCy;
      }
    }

    if (mergePhase === 'grid') {
      if (mergeElapsed > GRID_MS) { mergePhase = 'merge'; mergeElapsed = 0; }
    } else if (mergeElapsed > MERGE_MS) {
      mergePhase = 'grid'; mergeElapsed = 0; mergeIdx++;
    }
  }

  function moveToward(arr: Float32Array, i: number, tx: number, ty: number, t: number) {
    const dx = arr[i * 3] - pointer.x;
    const dy = arr[i * 3 + 1] - pointer.y;
    const d2 = dx * dx + dy * dy;
    const repel = d2 < 0.04 ? (0.04 - d2) * 1.2 : 0;
    arr[i * 3] += (tx - arr[i * 3]) * t + dx * repel;
    arr[i * 3 + 1] += (ty - arr[i * 3 + 1]) * t + dy * repel;
  }

  function sceneLerp(arr: Float32Array, t: number) {
    for (let i = 0; i < count; i++) moveToward(arr, i, target[i * 2], target[i * 2 + 1], t);
  }

  function frame(now: number) {
    if (!running) return;
    if (!last) last = now;
    const dt = Math.min(now - last, 50);
    last = now;
    elapsed += dt;

    const pos = geom.getAttribute('position') as THREE.BufferAttribute;
    const arr = pos.array as Float32Array;

    if (hover.game === 'vibe-survivor' && figurePts) {
      fillFlee();
      sceneLerp(arr, 0.08);
    } else if (hover.game === 'donguri-merge' && treePts && housePts) {
      fillMerge(dt);
      sceneLerp(arr, 0.08);
    } else {
      ambient(dt, arr);
    }

    pos.needsUpdate = true;

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
