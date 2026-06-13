// On touch/keyboard, toggle a `.open` class (CSS shows .desc for .open, :hover, :focus-within).
export function initCards(root: ParentNode = document): void {
  const cards = Array.from(root.querySelectorAll<HTMLElement>('.card'));
  for (const card of cards) {
    card.addEventListener('click', () => card.classList.toggle('open'));
    card.addEventListener('keydown', (e) => {
      const key = (e as KeyboardEvent).key;
      if (key === 'Enter' || key === ' ') {
        e.preventDefault();
        card.classList.toggle('open');
      }
    });
  }
}
