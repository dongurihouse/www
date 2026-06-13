import { collectPoints } from './pixelSample';

// SVG path silhouettes drawn in a 100x100 viewBox.
// All silhouettes are drawn in a 100x100 viewBox and sampled with nonzero fill,
// so overlapping subpaths union cleanly. The particle field cycles through all of them.
export const SHAPE_PATHS = {
  // acorn: stem + dome cap + egg-shaped nut
  acorn:
    'M46 8 Q50 3 54 8 L53 20 L47 20 Z' +
    'M20 36 C20 22 33 15 50 15 C67 15 80 22 80 36 C80 43 67 47 50 47 C33 47 20 43 20 36 Z' +
    'M26 41 C28 38 72 38 74 41 C75 61 64 90 50 93 C36 90 25 61 26 41 Z',
  // leaf: a clean pointed blade
  leaf: 'M50 12 C72 30 78 60 50 92 C22 60 28 30 50 12 Z',
  // tree: round canopy + trunk
  tree:
    'M50 12 C67 12 80 23 80 38 C80 53 67 62 50 62 C33 62 20 53 20 38 C20 23 33 12 50 12 Z' +
    'M45 56 L55 56 L55 90 L45 90 Z',
  // cloud: three soft bumps over a flat base
  cloud: 'M26 62 C14 62 14 50 25 49 C24 39 39 35 45 44 C50 33 68 33 71 45 C84 45 84 62 72 62 Z',
  // airplane: top-down, nose up, swept wings + tail
  airplane:
    'M50 8 C48 8 47 13 47 24 L47 40 L20 56 L20 62 L47 51 L47 76 L37 83 L37 88 L47 81 ' +
    'L47 90 L53 90 L53 81 L63 88 L63 83 L53 76 L53 51 L80 62 L80 56 L53 40 L53 24 C53 13 52 8 50 8 Z',
  // bird: spread wings + body + small head
  bird:
    'M50 44 C40 32 24 30 12 40 C26 42 38 46 50 50 C62 46 74 42 88 40 C76 30 60 32 50 44 Z' +
    'M48 47 C47 47 47 55 48 63 C49 68 51 68 52 63 C53 55 53 47 52 47 Z' +
    'M50 37 C54 37 55 42 50 44 C45 42 46 37 50 37 Z',
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
