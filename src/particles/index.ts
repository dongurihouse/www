import { prefersReducedMotion } from '../ui/motion';

function webglAvailable(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

export async function initParticles(selector = '#bg'): Promise<void> {
  const canvas = document.querySelector<HTMLCanvasElement>(selector);
  if (!canvas) return;
  if (prefersReducedMotion() || !webglAvailable()) return; // CSS gradient remains; canvas stays empty

  const isSmall = Math.min(innerWidth, innerHeight) < 700;
  const count = isSmall ? 1300 : 3600;

  const { createField } = await import('./field'); // lazy: keep three off the critical path
  const field = createField(canvas, count);

  // The canvas is a fixed, full-viewport background (see #bg in main.css), so it is
  // visible the whole time the tab is. Gate only on tab visibility — not on scroll
  // position — and keep the field alive (and battery use modest: count-bound, DPR-capped).
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') field.start();
    else field.stop();
  });
  window.addEventListener('resize', () => field.resize(), { passive: true });

  field.start();
}
