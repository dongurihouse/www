// On touch/keyboard, toggle a `.open` class (CSS shows .desc for .open, :hover, :focus-within).
// Also keep aria-expanded in sync so assistive tech announces the toggle state.
export function initCards(root: ParentNode = document): void {
  const cards = Array.from(root.querySelectorAll<HTMLElement>('.card'));
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
  }
}
