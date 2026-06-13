import { collectPoints } from './pixelSample';

// SVG path silhouettes drawn in a 100x100 viewBox.
export const SHAPE_PATHS: Record<'acorn' | 'leaf', string> = {
  // acorn: stem + dome cap + egg-shaped nut (filled nonzero so the parts union cleanly)
  acorn:
    'M46 8 Q50 3 54 8 L53 20 L47 20 Z' +
    'M20 36 C20 22 33 15 50 15 C67 15 80 22 80 36 C80 43 67 47 50 47 C33 47 20 43 20 36 Z' +
    'M26 41 C28 38 72 38 74 41 C75 61 64 90 50 93 C36 90 25 61 26 41 Z',
  // leaf: a clean pointed blade
  leaf: 'M50 12 C72 30 78 60 50 92 C22 60 28 30 50 12 Z',
};

// Rasterize a path into a square offscreen canvas and sample `count` points from it.
// Returns a Float32Array [x,y, ...] in [-1,1] (see collectPoints), or null if canvas/2D unavailable.
export function sampleShape(
  name: keyof typeof SHAPE_PATHS,
  count: number,
  size = 220,
): Float32Array | null {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // scale 100x100 path coords up to `size`
  ctx.save();
  ctx.scale(size / 100, size / 100);
  ctx.fillStyle = '#000';
  ctx.fill(new Path2D(SHAPE_PATHS[name])); // nonzero: overlapping subpaths union
  ctx.restore();

  const { data } = ctx.getImageData(0, 0, size, size);
  try {
    return collectPoints(data, size, size, { count });
  } catch {
    return null;
  }
}
