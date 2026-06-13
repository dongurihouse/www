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
  const count = isSmall ? 800 : 2500;

  const { createField } = await import('./field'); // lazy: keep three off the critical path
  const field = createField(canvas, count);

  // pause when hero off-screen or tab hidden
  const hero = canvas.closest('section') ?? canvas.parentElement;
  let onScreen = true;
  if (hero && 'IntersectionObserver' in window) {
    new IntersectionObserver(
      (entries) => {
        onScreen = entries[0]?.isIntersecting ?? true;
        if (onScreen && document.visibilityState === 'visible') field.start();
        else field.stop();
      },
      { threshold: 0 },
    ).observe(hero);
  }
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && onScreen) field.start();
    else field.stop();
  });
  window.addEventListener('resize', () => field.resize(), { passive: true });

  field.start();
}
