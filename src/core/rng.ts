// Seeded random generator so every level is the same each time it is played.
export type Rng = {
  next: () => number;
  int: (min: number, max: number) => number;
  pick: <T>(arr: readonly T[]) => T;
  shuffle: <T>(arr: readonly T[]) => T[];
  sample: <T>(arr: readonly T[], n: number) => T[];
  chance: (p: number) => boolean;
};

export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function createRng(seed: number): Rng {
  let a = seed >>> 0 || 1;
  const next = () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const int = (min: number, max: number) => min + Math.floor(next() * (max - min + 1));
  const shuffle = <T,>(arr: readonly T[]): T[] => {
    const out = arr.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(next() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  };
  return {
    next,
    int,
    pick: arr => arr[Math.floor(next() * arr.length)],
    shuffle,
    sample: (arr, n) => shuffle(arr).slice(0, n),
    chance: p => next() < p,
  };
}

/** Linear scale from level 1 (a) to level 30 (b), rounded. */
export function lerp(level: number, a: number, b: number): number {
  const t = Math.min(1, Math.max(0, (level - 1) / 29));
  return Math.round(a + (b - a) * t);
}

export function starsFromMistakes(mistakes: number, ok2 = 2): 1 | 2 | 3 {
  if (mistakes === 0) {
    return 3;
  }
  return mistakes <= ok2 ? 2 : 1;
}
