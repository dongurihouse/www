// Shared hover state: which game card the pointer is over. The particle field
// reads this each frame to play that card's themed scene, and the cards write it.
export type Game = 'vibe-survivor' | 'donguri-merge';

export const hover: { game: Game | null } = { game: null };
