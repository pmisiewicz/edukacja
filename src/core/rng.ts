/** Deterministic pseudo-random number generator returning floats in [0, 1). */
export type Rng = () => number;

/** mulberry32 — small, fast, good enough for worksheets. */
export function createRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** FNV-1a hash: turns a textual seed (e.g. from the URL) into a number. */
export function hashSeed(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Random short seed for a brand-new sheet. Not deterministic by design. */
export function newSeed(): string {
  return Math.floor(Math.random() * 36 ** 6)
    .toString(36)
    .padStart(6, '0');
}

/** Integer in [min, max] inclusive. */
export function randomInt(rng: Rng, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

export function shuffle<T>(rng: Rng, items: readonly T[]): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Picks `count` items from `pool`, without repeats as long as the pool allows.
 * When the pool is smaller than `count`, it is reshuffled and reused.
 */
export function pickDistinct<T>(rng: Rng, pool: readonly T[], count: number): T[] {
  if (pool.length === 0) return [];
  const out: T[] = [];
  while (out.length < count) out.push(...shuffle(rng, pool));
  return out.slice(0, count);
}
