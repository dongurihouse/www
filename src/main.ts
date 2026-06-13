// Progressive-enhancement entry. CSS is imported here so Vite bundles it
// and every page that loads this module is styled.
import './styles/main.css';
import { initScrollReveal } from './ui/reveal';
import { initCards } from './ui/cards';
import { initParticles } from './particles';

initScrollReveal();
initCards();

const boot = () => { void initParticles('#bg'); };
if ('requestIdleCallback' in window) {
  (window as unknown as { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(boot);
} else {
  setTimeout(boot, 200);
}
