export interface Game {
  slug: 'vibe-survivor' | 'donguri-merge';
  title: string;
  tagline: string;
  status: string;
  description: string;
  art: string;
  appStoreUrl?: string;
}

export interface SiteContent {
  studio: { name: string; domain: string; blurb: string };
  contact: { supportEmail: string };
  games: Game[];
}

export const site: SiteContent = {
  studio: {
    name: 'dongurihouse',
    domain: 'dongurihouse.net',
    blurb:
      "dongurihouse is a small independent studio. We make the games we'd want to play — a cozy one to unwind with, and a stranger one to get lost in.",
  },
  contact: { supportEmail: 'support@dongurihouse.net' },
  games: [
    {
      slug: 'vibe-survivor',
      title: 'Vibe Survivor',
      tagline: 'A dream roguelite about how deep you dare to go.',
      status: 'Coming soon',
      description:
        'An extraction horde-survivor set inside dreams. Get strong, decide when to wake, and gamble your haul.',
      art: '/art/vibe-survivor.svg',
    },
    {
      slug: 'donguri-merge',
      title: 'Donguri: Merge!',
      tagline: 'A cozy little grove that grows as you play.',
      status: 'Coming soon',
      description:
        'A relaxing merge game. Grow a homestead, befriend the forest, and restore the grove one acorn at a time.',
      art: '/art/donguri-merge.svg',
    },
  ],
};
