const STYLES = ['pixel-art', 'pixel-art-neutral'];

export function getBossAvatarUrl(seed) {
  return `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
}

// Pre-generate 100 boss seeds
export const BOSS_SEEDS = Array.from({ length: 100 }, (_, i) => `boss_${i + 1}_noodle`);
