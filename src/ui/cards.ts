import { prefersReducedMotion } from './motion';

// Card interactions:
// - tap/keyboard toggles the description (CSS shows .desc for .open / :hover / :focus-within)
// - on hover, the art pans toward the cursor to reveal the image hidden past the edges
export function initCards(root: ParentNode = document): void {
  const cards = Array.from(root.querySelectorAll<HTMLElement>('.card'));
  const reduce = prefersReducedMotion();

  for (const card of cards) {
    const toggle = () => {
      const open = card.classList.toggle('open');
      card.setAttribute('aria-expanded', String(open));
    };
    card.addEventListener('click', toggle);
    card.addEventListener('keydown', (e) => {
      const key = (e as KeyboardEvent).key;
      if (key === 'Enter' || key === ' ') {
        e.preventDefault();
        toggle();
      }
    });

    if (reduce) continue;
    const art = card.querySelector<HTMLElement>('.art');
    if (!art) continue;

    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      const mx = (e.clientX - r.left) / r.width;  // 0..1 across the card
      const my = (e.clientY - r.top) / r.height;
      // pan toward the cursor to reveal that edge (clamped to the oversize margin)
      const px = 50 + (mx - 0.5) * 70;
      const py = 50 + (my - 0.5) * 70;
      art.style.backgroundPosition = `${px}% ${py}%`;
    });
    card.addEventListener('pointerleave', () => {
      art.style.backgroundPosition = '50% 50%';
    });
  }
}
