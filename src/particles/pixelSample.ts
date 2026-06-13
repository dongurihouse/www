export interface SampleOptions {
  count: number;
  alphaThreshold?: number; // 0-255, default 128
  rng?: () => number;      // returns [0,1); default Math.random
}

// Returns a flat Float32Array [x0,y0, x1,y1, ...] of `count` points sampled
// (with replacement) from pixels whose alpha exceeds the threshold.
// Coordinates are normalized to [-1,1], centered, with +y pointing up.
export function collectPoints(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  { count, alphaThreshold = 128, rng = Math.random }: SampleOptions,
): Float32Array {
  const filled: number[] = [];
  for (let p = 0; p < width * height; p++) {
    if (data[p * 4 + 3] > alphaThreshold) filled.push(p);
  }
  if (filled.length === 0) throw new Error('collectPoints: no opaque pixels found');

  const out = new Float32Array(count * 2);
  for (let i = 0; i < count; i++) {
    const p = filled[Math.floor(rng() * filled.length)];
    const px = p % width;
    const py = Math.floor(p / width);
    // normalize to [-1,1]; flip y so image-top maps to +1
    out[i * 2] = (px / (width - 1)) * 2 - 1;
    out[i * 2 + 1] = -((py / (height - 1)) * 2 - 1);
  }
  return out;
}
