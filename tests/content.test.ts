import { describe, it, expect } from 'vitest';
import { site } from '../src/content/site';

describe('site content', () => {
  it('has the studio identity', () => {
    expect(site.studio.name).toBe('dongurihouse');
    expect(site.studio.domain).toBe('dongurihouse.net');
    expect(site.contact.supportEmail).toBe('support@dongurihouse.net');
  });

  it('has exactly the two games with required fields', () => {
    expect(site.games).toHaveLength(2);
    const slugs = site.games.map((g) => g.slug).sort();
    expect(slugs).toEqual(['donguri-merge', 'vibe-survivor']);
    for (const g of site.games) {
      expect(g.title.length).toBeGreaterThan(0);
      expect(g.tagline.length).toBeGreaterThan(0);
      expect(g.status.length).toBeGreaterThan(0);
      expect(g.art).toMatch(/^\/art\//);
    }
  });
});
