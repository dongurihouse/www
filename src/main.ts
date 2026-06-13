// Progressive-enhancement entry. CSS is imported here so Vite bundles it
// and every page that loads this module is styled.
import './styles/main.css';
import { initScrollReveal } from './ui/reveal';
import { initCards } from './ui/cards';

initScrollReveal();
initCards();
