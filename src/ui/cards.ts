import { prefersReducedMotion } from './motion';
import { hover, type Game } from '../particles/hover';

// Card interactions:
// - tap/keyboard toggles the description (CSS shows .desc for .open / :hover / :focus-within)
// - hover/focus tells the particle field which game's scene to play
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

    // tell the particle field which game's themed scene to play
    const game = card.dataset.game as Game | undefined;
    if (game) {
      const enter = () => { hover.game = game; };
      const leave = () => { if (hover.game === game) hover.game = null; };
      card.addEventListener('pointerenter', enter);
      card.addEventListener('focusin', enter);
      card.addEventListener('pointerleave', leave);
      card.addEventListener('focusout', leave);
    }

    if (reduce) continue;
    const art = card.querySelector<HTMLElement>('.art');
    if (!art) continue;

    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      const mx = (e.clientX - r.left) / r.width;  // 0..1 across the card
      const my = (e.clientY - r.top) / r.height;
      const px = 50 + (mx - 0.5) * 70;
      const py = 50 + (my - 0.5) * 70;
      art.style.backgroundPosition = `${px}% ${py}%`;
    });
    card.addEventListener('pointerleave', () => {
      art.style.backgroundPosition = '50% 50%';
    });
  }
}
