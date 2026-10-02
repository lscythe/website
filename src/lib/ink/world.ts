import type { Pt } from "./brush";
import { DEFS, mist, mountain, paintRock, pine, ridgeOf, type Painter } from "./landscape";
import { between, createNoise, createRand } from "./random";
import { bamboo, bridge, hut, pagoda, pavilion, plum, splash, splatter } from "./structures";

/**
 * The hero is an endless handscroll. Each depth is painted once as a tile
 * TILE units wide and shown three times side by side, so sliding it left by
 * one tile width loops seamlessly.
 */
export const TILE = 2400;
export const WORLD_H = 900;

/** What the wanderer is doing; drives the figure's pose. */
export type Pose = "stand" | "walk" | "wait" | "crouch" | "jump";

/** How fast each depth slides relative to the ground the wanderer walks on. */
export const PARALLAX = { far: 0.12, mid: 0.38, near: 1 } as const;

/** A walkable run of ground: a rock top or a bridge deck, in tile units. */
export interface Surface {
  pts: Pt[];
  kind: "rock" | "bridge";
}

export interface World {
  far: string;
  mid: string;
  near: string;
  surfaces: Surface[];
  /** Places worth stopping at (pavilions, huts), as tile x positions. */
  rests: number[];
  /** A comfortable place to start: the middle of the first rock. */
  start: number;
}

const mod = (x: number, m: number) => ((x % m) + m) % m;

/* ------------------------------------------------------------------ */
/* Depth layers                                                        */
/* ------------------------------------------------------------------ */

function paintFar(p: Painter) {
  const { rand, out } = p;
  out.push(`<g filter="url(#haze)" opacity="0.7">`);
  let x = 0;
  while (x < TILE) {
    const w = between(rand, 260, 460);
    mountain(p, { x: x + w / 2, base: 600, w, h: between(rand, 100, 230), depth: "far", crag: between(rand, 0.1, 0.5) }, "far");
    x += w * between(rand, 0.5, 0.75);
  }
  // A distant pagoda, barely more than a smudge.
  pagoda(p, between(rand, 400, 2000), 520, 0.55, 4);
  out.push(`</g>`);
  out.push(mist("fog", 470, 180));
}

function paintMid(p: Painter) {
  const { rand, out } = p;
  const peaks: { x: number; top: Pt }[] = [];
  out.push(`<g filter="url(#bleed)">`);
  let x = 120;
  while (x < TILE) {
    const w = between(rand, 300, 460);
    const seed = rand() * 100;
    const spec = { x, base: 760, w, h: between(rand, 300, 500), depth: "mid" as const, crag: between(rand, 0.6, 1) };
    const ridge = ridgeOf(p, spec, seed);
    // Splashed ink pooling in the upper body of the peak, before the linework.
    const top = ridge.reduce((a, b) => (b[1] < a[1] ? b : a));
    paintRock(p, ridge, spec.base, "mid", seed, "mid");
    splash(p, top[0] + between(rand, -30, 30), top[1] + spec.h * 0.28, w * 0.2, spec.h * 0.16);
    peaks.push({ x, top });
    x += w * between(rand, 0.75, 1.05) + between(rand, 40, 160);
  }
  out.push(`</g>`);
  // A pagoda keeps watch from one of the summits.
  const withPagoda = peaks[Math.floor(rand() * peaks.length)];
  pagoda(p, withPagoda.top[0], withPagoda.top[1] + 8, 1.1);
  out.push(mist("fog", 610, 190));
}

interface Rock {
  x0: number;
  x1: number;
  top: number;
}

function paintNear(p: Painter): { surfaces: Surface[]; rests: number[] } {
  const { rand, noise, out } = p;

  // Lay out rocks and gaps, then scale the run so it fills exactly one tile.
  const count = 5;
  const widths = Array.from({ length: count }, () => between(rand, 300, 520));
  const gaps = Array.from({ length: count }, () => between(rand, 80, 130));
  const bridgeAt = 2 + Math.floor(rand() * 2);
  gaps[bridgeAt] = between(rand, 220, 260);
  const total = widths.reduce((a, b) => a + b) + gaps.reduce((a, b) => a + b);
  const k = TILE / total;
  const rocks: Rock[] = [];
  let x = 0;
  for (let i = 0; i < count; i++) {
    rocks.push({ x0: x, x1: x + widths[i] * k, top: between(rand, 610, 680) });
    x += (widths[i] + gaps[i]) * k;
  }

  const surfaces: Surface[] = [];
  const rests: number[] = [];

  out.push(`<g filter="url(#bleed)">`);
  rocks.forEach((rock, i) => {
    const seed = rand() * 100;
    const crown: Pt[] = [];
    for (let cx = rock.x0; cx <= rock.x1; cx += 8) {
      const t = (cx - rock.x0) / (rock.x1 - rock.x0);
      // Rounded shoulders at both ends so jumps start from a believable lip.
      const shoulder = Math.pow(Math.abs(2 * t - 1), 6) * 22;
      // Rolling crown: a broad swell plus finer chatter, never a table top.
      const swell = (noise(cx * 0.006, seed) - 0.5) * 46;
      crown.push([cx, rock.top + shoulder + swell + (noise(cx * 0.03, seed + 1) - 0.5) * 12]);
    }
    const left: Pt[] = [];
    const right: Pt[] = [];
    for (let y = WORLD_H + 20; y > rock.top + 14; y -= 12) {
      const t = (y - rock.top) / (WORLD_H - rock.top);
      // Pillars narrow as they sink into the mist, with ledges biting in.
      left.push([rock.x0 + 6 + t * 44 + Math.sin(t * 9 + seed) * 10 + (noise(y * 0.05, seed) - 0.5) * 26, y]);
    }
    for (let y = rock.top + 14; y <= WORLD_H + 20; y += 12) {
      const t = (y - rock.top) / (WORLD_H - rock.top);
      right.push([rock.x1 - 6 - t * 40 - Math.sin(t * 7 + seed) * 12 + (noise(y * 0.05, seed + 5) - 0.5) * 26, y]);
    }
    paintRock(p, [...left, ...crown, ...right], WORLD_H + 20, "near", seed, "near", 0.25);
    surfaces.push({ pts: crown.map(([cx, cy]) => [cx, cy - 1] as Pt), kind: "rock" });

    // Ink splashed down the cliff faces and flicked across the stone.
    splash(p, rock.x0 + (rock.x1 - rock.x0) * between(rand, 0.3, 0.7), rock.top + 70, (rock.x1 - rock.x0) * 0.26, 46, "pomo pomo-near");
    splatter(p, rock.x1 - 30, rock.top + 60, 70, 26);

    // Dress each rock differently.
    const mid = (rock.x0 + rock.x1) / 2;
    const span = rock.x1 - rock.x0;
    const groundAt = (gx: number) => crown[Math.max(0, Math.min(crown.length - 1, Math.round((gx - rock.x0) / 8)))][1];
    if (i === 0) {
      pavilion(p, mid + span * 0.18, groundAt(mid + span * 0.18) + 2, 1.5);
      rests.push(mid + span * 0.18 - 40);
      pine(p, rock.x0 + 40, groundAt(rock.x0 + 40) + 2, 46);
    } else if (i === 1) {
      bamboo(p, rock.x0 + 50, groundAt(rock.x0 + 50) + 2, 1);
      plum(p, rock.x1 - 70, groundAt(rock.x1 - 70) + 2, 1);
    } else if (i === 2) {
      hut(p, mid, groundAt(mid) + 2, 1.6);
      rests.push(mid - 50);
      bamboo(p, mid + 70, groundAt(mid + 70) + 2, 0.9);
    } else if (i === 3) {
      plum(p, mid - 40, groundAt(mid - 40) + 2, 1.2);
      pine(p, rock.x1 - 50, groundAt(rock.x1 - 50) + 2, 56);
    } else {
      pine(p, mid, groundAt(mid) + 2, 40);
      bamboo(p, rock.x1 - 60, groundAt(rock.x1 - 60) + 2, 0.8);
    }
  });
  out.push(`</g>`);

  // The bridge spans the widest gap, landing on the lips of both rocks.
  const from = rocks[bridgeAt];
  const to = rocks[(bridgeAt + 1) % count];
  const fromCrown = surfaces[bridgeAt].pts;
  const toCrown = surfaces[(bridgeAt + 1) % count].pts;
  const toX = bridgeAt + 1 === count ? to.x0 + TILE : to.x0;
  const deck = bridge(p, from.x1 - 14, fromCrown[fromCrown.length - 2][1] + 1, toX + 14, toCrown[1][1] + 1);
  surfaces.push({ pts: deck.map(([dx, dy]) => [mod(dx, TILE), dy] as Pt), kind: "bridge" });

  out.push(mist("fog", 790, 140));
  return { surfaces, rests };
}

/* ------------------------------------------------------------------ */
/* Assembly                                                            */
/* ------------------------------------------------------------------ */

const EXTRA_DEFS = `
<defs>
  <filter id="pomo" x="-30%" y="-30%" width="160%" height="160%">
    <feTurbulence type="fractalNoise" baseFrequency="0.022" numOctaves="3" seed="3" result="n"/>
    <feDisplacementMap in="SourceGraphic" in2="n" scale="38" result="d"/>
    <feGaussianBlur in="d" stdDeviation="7"/>
  </filter>
</defs>`;

export function paintWorld(seedInput: number): World {
  const rand = createRand(seedInput);
  const make = (): Painter => ({ rand, noise: createNoise(rand), out: [] });

  const far = make();
  paintFar(far);
  const mid = make();
  paintMid(mid);
  const near = make();
  const { surfaces, rests } = paintNear(near);

  const first = surfaces[0].pts;
  return {
    far: far.out.join(""),
    mid: mid.out.join(""),
    near: near.out.join(""),
    surfaces,
    rests,
    start: first[Math.floor(first.length * 0.35)][0],
  };
}

/** Shared gradients and filters for every strip. */
export const WORLD_DEFS = DEFS + EXTRA_DEFS;

/* ------------------------------------------------------------------ */
/* Walking                                                             */
/* ------------------------------------------------------------------ */

/** Height of the ground under a world x, or null over a gap. */
export function groundAt(surfaces: Surface[], worldX: number): number | null {
  const x = mod(worldX, TILE);
  let best: number | null = null;
  for (const { pts } of surfaces) {
    // A bridge deck may wrap past the tile edge; test both sides of the seam.
    for (const shift of [0, TILE, -TILE]) {
      const xs = x + shift;
      if (xs < pts[0][0] || xs > pts[pts.length - 1][0]) continue;
      for (let i = 1; i < pts.length; i++) {
        if (xs <= pts[i][0]) {
          const [ax, ay] = pts[i - 1];
          const [bx, by] = pts[i];
          const y = ay + ((by - ay) * (xs - ax)) / (bx - ax || 1);
          best = best === null ? y : Math.min(best, y);
          break;
        }
      }
    }
  }
  return best;
}

/** The next world x, after worldX, where solid ground begins again. */
export function nextLanding(surfaces: Surface[], worldX: number): number {
  for (let d = 4; d < TILE; d += 4) {
    if (groundAt(surfaces, worldX + d) !== null && groundAt(surfaces, worldX + d + 12) !== null) return worldX + d + 14;
  }
  return worldX + 120;
}

/** True when the next rest stop lies within `window` units ahead. */
export function restAhead(rests: number[], worldX: number, window: number): boolean {
  const x = mod(worldX, TILE);
  return rests.some((r) => {
    const d = mod(r - x, TILE);
    return d > 0 && d <= window;
  });
}
