import { describe, it, expect, vi } from 'vitest';
import { prefersReducedMotion } from '../src/ui/motion';

function mockMatchMedia(matches: boolean) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches, media: query, onchange: null,
    addEventListener: () => {}, removeEventListener: () => {},
    addListener: () => {}, removeListener: () => {}, dispatchEvent: () => false,
  }));
}

describe('prefersReducedMotion', () => {
  it('is true when the media query matches', () => {
    mockMatchMedia(true);
    expect(prefersReducedMotion()).toBe(true);
  });
  it('is false when it does not match', () => {
    mockMatchMedia(false);
    expect(prefersReducedMotion()).toBe(false);
  });
});
