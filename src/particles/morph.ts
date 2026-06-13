// Small, fast, seedable PRNG (deterministic across runs).
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Move every component of `current` toward `target` by factor t (0..1), in place.
export function lerpTo(current: Float32Array, target: Float32Array, t: number): void {
  const n = Math.min(current.length, target.length);
  for (let i = 0; i < n; i++) {
    current[i] += (target[i] - current[i]) * t;
  }
}

// Smoothstep easing for hold/release timing curves.
export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}
