import { collectPoints } from './pixelSample';

// SVG path silhouettes drawn in a 100x100 viewBox.
export const SHAPE_PATHS: Record<'acorn' | 'leaf', string> = {
  // acorn: rounded nut body + cap
  acorn:
    'M50 30 C35 30 28 42 28 60 C28 80 40 92 50 92 C60 92 72 80 72 60 C72 42 65 30 50 30 Z' +
    'M28 30 C28 20 40 16 50 16 C60 16 72 20 72 30 C72 38 62 40 50 40 C38 40 28 38 28 30 Z',
  // leaf: pointed ellipse with a stem
  leaf:
    'M50 12 C72 30 78 60 50 92 C22 60 28 30 50 12 Z' +
    'M49 40 L51 40 L51 88 L49 88 Z',
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
  ctx.fill(new Path2D(SHAPE_PATHS[name]), 'evenodd');
  ctx.restore();

  const { data } = ctx.getImageData(0, 0, size, size);
  try {
    return collectPoints(data, size, size, { count });
  } catch {
    return null;
  }
}
