import { prefersReducedMotion } from './motion';

export function initScrollReveal(root: ParentNode = document): () => void {
  const els = Array.from(root.querySelectorAll<HTMLElement>('.reveal'));

  if (prefersReducedMotion() || typeof IntersectionObserver === 'undefined') {
    els.forEach((el) => el.classList.add('is-visible'));
    return () => {};
  }

  const io = new IntersectionObserver(
    (entries, obs) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
  );

  els.forEach((el) => io.observe(el));
  return () => io.disconnect();
}
