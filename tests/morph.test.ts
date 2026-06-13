import { describe, it, expect } from 'vitest';
import { mulberry32, lerpTo } from '../src/particles/morph';

describe('mulberry32', () => {
  it('is deterministic for a seed and returns [0,1)', () => {
    const a = mulberry32(42); const b = mulberry32(42);
    for (let i = 0; i < 5; i++) {
      const v = a();
      expect(v).toBe(b());
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe('lerpTo', () => {
  it('moves current toward target by factor t (in place)', () => {
    const cur = new Float32Array([0, 0, 10, -10]);
    const tgt = new Float32Array([10, 20, 10, 10]);
    lerpTo(cur, tgt, 0.5);
    expect(Array.from(cur)).toEqual([5, 10, 10, 0]);
  });
  it('t=1 snaps to target', () => {
    const cur = new Float32Array([1, 2, 3]);
    lerpTo(cur, new Float32Array([9, 9, 9]), 1);
    expect(Array.from(cur)).toEqual([9, 9, 9]);
  });
});
