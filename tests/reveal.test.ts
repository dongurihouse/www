import { describe, it, expect, vi, beforeEach } from 'vitest';
import { initScrollReveal } from '../src/ui/reveal';

let lastObserver: any;
class FakeIO {
  cb: IntersectionObserverCallback;
  elements: Element[] = [];
  constructor(cb: IntersectionObserverCallback) { this.cb = cb; lastObserver = this; }
  observe(el: Element) { this.elements.push(el); }
  unobserve() {}
  disconnect() {}
  trigger(el: Element) {
    this.cb([{ target: el, isIntersecting: true } as IntersectionObserverEntry], this as any);
  }
}

beforeEach(() => {
  vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
  vi.stubGlobal('IntersectionObserver', FakeIO as any);
  document.body.innerHTML = '<div class="reveal" id="a"></div>';
});

describe('initScrollReveal', () => {
  it('adds is-visible when an element intersects', () => {
    initScrollReveal();
    const a = document.getElementById('a')!;
    expect(a.classList.contains('is-visible')).toBe(false);
    lastObserver.trigger(a);
    expect(a.classList.contains('is-visible')).toBe(true);
  });

  it('reveals everything immediately under reduced motion', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true, addEventListener() {}, removeEventListener() {} }));
    initScrollReveal();
    expect(document.getElementById('a')!.classList.contains('is-visible')).toBe(true);
  });
});
