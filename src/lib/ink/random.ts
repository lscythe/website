export type Rand = () => number;

/** Small, fast seeded PRNG (mulberry32). Same seed, same painting. */
export function createRand(seed: number): Rand {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const between = (rand: Rand, min: number, max: number) =>
  min + rand() * (max - min);

export const pick = <T>(rand: Rand, items: readonly T[]): T =>
  items[Math.floor(rand() * items.length)];

export type Noise = (x: number, y?: number) => number;

/** Seeded 2D value noise in [0, 1]. */
export function createNoise(rand: Rand): Noise {
  const perm = new Uint8Array(512);
  const values = new Float32Array(256);
  for (let i = 0; i < 256; i++) {
    perm[i] = i;
    values[i] = rand();
  }
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [perm[i], perm[j]] = [perm[j], perm[i]];
  }
  for (let i = 0; i < 256; i++) perm[i + 256] = perm[i];

  const fade = (t: number) => t * t * (3 - 2 * t);
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

  return (x, y = 0) => {
    const xi = Math.floor(x) & 255;
    const yi = Math.floor(y) & 255;
    const u = fade(x - Math.floor(x));
    const v = fade(y - Math.floor(y));
    const a = values[perm[perm[xi] + yi]];
    const b = values[perm[perm[xi + 1] + yi]];
    const c = values[perm[perm[xi] + yi + 1]];
    const d = values[perm[perm[xi + 1] + yi + 1]];
    return lerp(lerp(a, b, u), lerp(c, d, u), v);
  };
}

/** Fractal noise: a few octaves of value noise, normalised to [0, 1]. */
export function fbm(noise: Noise, x: number, y = 0, octaves = 4) {
  let sum = 0;
  let amp = 1;
  let norm = 0;
  let freq = 1;
  for (let i = 0; i < octaves; i++) {
    sum += noise(x * freq, y * freq + i * 17.3) * amp;
    norm += amp;
    amp *= 0.5;
    freq *= 2;
  }
  return sum / norm;
}
