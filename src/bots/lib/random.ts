export function createSeededRandom(seed: string): () => number {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }

  return function random() {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;

    return (h >>> 0) / 4294967296;
  };
}

export function pickByWeights<T extends string>(
  weights: Record<T, number>,
  random: () => number,
): T {
  const entries = Object.entries(weights) as [T, number][];
  const total = entries.reduce((sum, [, weight]) => sum + Math.max(weight, 0), 0);

  if (total <= 0) {
    return entries[0][0];
  }

  const point = random() * total;
  let cumulative = 0;

  for (const [key, weight] of entries) {
    cumulative += Math.max(weight, 0);
    if (point <= cumulative) {
      return key;
    }
  }

  return entries[entries.length - 1][0];
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
