import { describe, it, expect } from 'vitest';
import { collectPoints } from '../src/particles/pixelSample';

// Build a 4x4 RGBA image with only the listed pixels opaque.
function img(opaque: Array<[number, number]>, w = 4, h = 4): Uint8ClampedArray {
  const data = new Uint8ClampedArray(w * h * 4);
  for (const [x, y] of opaque) {
    const i = (y * w + x) * 4;
    data[i + 3] = 255; // alpha
  }
  return data;
}

describe('collectPoints', () => {
  it('returns count*2 floats sampled only from opaque pixels, normalized to [-1,1]', () => {
    const data = img([[0, 0]]);
    const pts = collectPoints(data, 4, 4, { count: 3, rng: () => 0 });
    expect(pts).toBeInstanceOf(Float32Array);
    expect(pts.length).toBe(3 * 2);
    for (let i = 0; i < pts.length; i += 2) {
      expect(pts[i]).toBeGreaterThanOrEqual(-1);
      expect(pts[i]).toBeLessThanOrEqual(1);
      expect(pts[i + 1]).toBeGreaterThanOrEqual(-1);
      expect(pts[i + 1]).toBeLessThanOrEqual(1);
    }
  });

  it('throws when there are no opaque pixels', () => {
    expect(() => collectPoints(new Uint8ClampedArray(4 * 4 * 4), 4, 4, { count: 2 }))
      .toThrow(/no opaque/i);
  });
});
