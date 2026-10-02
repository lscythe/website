import { brush, dryRuns, poly, type Pt } from "./brush";
import { between, createNoise, createRand, fbm, type Noise, type Rand } from "./random";

export const SCENE_W = 1600;
export const SCENE_H = 900;

/** Horizontal spot on the ledge where the wanderer stands. */
export const FIGURE_X = 724;
export const SUN = { x: 905, y: 285, r: 52 };

export type Depth = "far" | "mid" | "near";

/** A splash of ink (潑墨), painted as a watercolour blot by the renderer. */
export interface Splash {
  x: number;
  y: number;
  rx: number;
  ry: number;
  alpha: number;
  shape: number;
}

export interface Painter {
  rand: Rand;
  noise: Noise;
  out: string[];
  splashes?: Splash[];
}

export const DEPTH = {
  far: { stroke: 1.6, texture: 0.25, dots: 0.2, trees: 0 },
  mid: { stroke: 2.6, texture: 0.7, dots: 0.7, trees: 0.4 },
  near: { stroke: 3.6, texture: 1, dots: 1, trees: 1 },
} as const;

/* ------------------------------------------------------------------ */
/* Mountains                                                           */
/* ------------------------------------------------------------------ */

export interface MountainSpec {
  x: number;
  base: number;
  w: number;
  h: number;
  depth: Depth;
  /** 0 = rounded hill, 1 = sheer Huangshan pillars. */
  crag?: number;
}

export function ridgeOf(p: Painter, m: MountainSpec, seed: number): Pt[] {
  const { noise, rand } = p;
  const n = Math.max(30, Math.round(m.w / 7));
  const crag = m.crag ?? 0.5;
  const lean = between(rand, -0.25, 0.25);
  const sharp = between(rand, 0.7, 1.3);
  const pts: Pt[] = [];

  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    // Lean the envelope so peaks are not always centred.
    const tt = Math.min(1, Math.max(0, t + lean * Math.sin(Math.PI * t)));
    const env = Math.pow(Math.sin(Math.PI * tt), sharp);
    const body = 0.45 + 0.55 * fbm(noise, t * 2.6 + seed, seed * 0.13, 3);
    // Ridged noise gives knife-edged summits; crag raises it to sheer pillars.
    const ridged = 1 - Math.abs(2 * noise(t * 5 + seed * 3.1, seed) - 1);
    // Clip the very tips so pillars end in the flat crowns of Huangshan.
    const pillar = Math.min(0.92, Math.pow(ridged, 1 + crag * 1.4));
    const f = env * body * (1 - crag * 0.55 + crag * 0.55 * pillar * 1.6);
    const jitter = (noise(t * 40 + seed, 5) - 0.5) * 6 * (1 + crag);
    pts.push([m.x + (t - 0.5) * m.w, m.base - Math.max(0, f) * m.h + jitter * env]);
  }
  pts[0][1] = m.base;
  pts[n - 1][1] = m.base;
  return pts;
}

export function paintRock(
  p: Painter,
  ridge: Pt[],
  base: number,
  depth: Depth,
  seed: number,
  wash: string,
  contourScale = 1,
) {
  const { rand, noise, out } = p;
  const style = DEPTH[depth];
  const n = ridge.length;
  const x0 = ridge[0][0];
  const x1 = ridge[n - 1][0];
  const top = Math.min(...ridge.map((q) => q[1]));
  const height = base - top;

  // Opaque body hides what is behind it, then a wash darkens it from the top.
  const body: Pt[] = [...ridge, [x1, base + 40], [x0, base + 40]];
  out.push(`<path class="ink-body" d="${poly(body)}"/>`);
  out.push(`<path d="${poly(body)}" fill="url(#wash-${wash})"/>`);

  // Contour layers: shrunken echoes of the ridge, broken like a dry brush.
  const layers = Math.round((2 + style.texture * 4) * contourScale);
  for (let k = 1; k <= layers; k++) {
    const shrink = 1 - k / (layers + 1.4);
    const a = Math.floor(between(rand, 0, 0.35) * n);
    const b = Math.floor(between(rand, 0.65, 1) * n);
    const pts: Pt[] = [];
    for (let i = a; i < b; i++) {
      const [x, y] = ridge[i];
      const dx = (noise(i * 0.05 + k * 3, seed) - 0.5) * 30;
      pts.push([x + dx, base - (base - y) * shrink * (0.92 + 0.16 * noise(i * 0.1, k + seed))]);
    }
    for (const run of dryRuns(pts, rand, 0.05)) {
      out.push(`<path class="ink-soft" d="${brush(run, noise, { width: style.stroke * 0.55, offset: seed + k * 9 })}"/>`);
    }
  }

  // Vertical cliff faces dropping from the summits.
  const cliffs = Math.round(((x1 - x0) / 30) * style.texture);
  for (let c = 0; c < cliffs; c++) {
    const i = Math.floor(between(rand, 0.05, 0.95) * n);
    const [sx, sy] = ridge[i];
    const len = (base - sy) * between(rand, 0.25, 0.85);
    if (len < 12) continue;
    const steps = Math.max(6, Math.round(len / 7));
    const pts: Pt[] = [];
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      pts.push([sx + (noise(t * 3 + c, seed + i) - 0.5) * 18 * t, sy + 4 + t * len]);
    }
    out.push(`<path class="ink-soft" d="${brush(pts, noise, { width: style.stroke * between(rand, 0.4, 0.9), taper: "end", offset: c + seed })}"/>`);
  }

  // Cun texture: short slanted hatches clustered under the ridge line.
  const hatches = Math.round((((x1 - x0) * height) / 1600) * style.texture);
  for (let h = 0; h < hatches; h++) {
    const i = Math.floor(rand() * n);
    const [sx, sy] = ridge[i];
    const depthIn = Math.pow(rand(), 2) * (base - sy) * 0.6;
    const cx = sx + between(rand, -8, 8);
    const cy = sy + 6 + depthIn;
    const len = between(rand, 4, 11);
    const ang = between(rand, 1.1, 1.5) * (rand() < 0.5 ? 1 : -1);
    const pts: Pt[] = [
      [cx, cy],
      [cx + Math.cos(ang) * len * 0.5, cy + Math.sin(Math.abs(ang)) * len * 0.5],
      [cx + Math.cos(ang) * len, cy + Math.sin(Math.abs(ang)) * len],
    ];
    out.push(`<path class="ink-faint" d="${brush(pts, noise, { width: between(rand, 0.8, 1.8), wobble: 0.3, offset: h })}"/>`);
  }

  // Moss dots (dian) sprinkled along the ridge.
  const dots = Math.round(((x1 - x0) / 9) * style.dots);
  for (let d = 0; d < dots; d++) {
    const i = Math.floor(rand() * n);
    const [sx, sy] = ridge[i];
    const rad = between(rand, 0.7, 2.4) * (depth === "near" ? 1 : 0.7);
    out.push(`<ellipse class="ink" cx="${(sx + between(rand, -4, 4)).toFixed(1)}" cy="${(sy + between(rand, 1, 10)).toFixed(1)}" rx="${(rad * 1.4).toFixed(1)}" ry="${rad.toFixed(1)}"/>`);
  }

  // The outline itself, drawn last and boldest.
  for (const run of dryRuns(ridge, rand, depth === "far" ? 0.02 : 0.035)) {
    out.push(`<path class="ink" d="${brush(run, noise, { width: style.stroke, offset: seed * 1.7 })}"/>`);
  }

  // Pines clinging to the summits.
  const trees = Math.round(((x1 - x0) / 140) * style.trees);
  for (let t = 0; t < trees; t++) {
    const i = Math.floor(between(rand, 0.1, 0.9) * n);
    const [sx, sy] = ridge[i];
    pine(p, sx, sy + 3, between(rand, 14, 30) * (depth === "near" ? 1 : 0.6));
  }
}

export function mountain(p: Painter, m: MountainSpec, wash: string) {
  const seed = p.rand() * 100;
  paintRock(p, ridgeOf(p, m, seed), m.base, m.depth, seed, wash);
}

/** The ledge the wanderer stands on: a promontory jutting out over the mist. */
function ledge(p: Painter, edgeX: number, topY: number, base: number): number {
  const { noise } = p;
  const seed = p.rand() * 100;
  const startX = edgeX - 420;
  const pts: Pt[] = [];
  // Rising flank from the lower left.
  for (let x = startX - 80; x < startX; x += 9) {
    const t = (x - startX + 80) / 80;
    pts.push([x, base - Math.pow(t, 0.7) * (base - topY - 30) + (noise(x * 0.04, seed) - 0.5) * 16]);
  }
  // Uneven crown, climbing slightly toward the edge.
  let footY = topY;
  for (let x = startX; x <= edgeX; x += 9) {
    const t = (x - startX) / (edgeX - startX);
    const y = topY + 30 * (1 - t) - 18 * Math.sin(Math.PI * t * 0.8) + (noise(x * 0.03, seed) - 0.5) * 12;
    if (Math.abs(x - FIGURE_X) < 5) footY = y;
    pts.push([x, y]);
  }
  // Sheer, undercut drop on the right.
  for (let y = topY + 10; y <= base; y += 11) {
    const t = (y - topY) / (base - topY);
    pts.push([edgeX + 8 - Math.sin(t * Math.PI) * 40 - t * 30 + (noise(y * 0.05, seed + 3) - 0.5) * 30 * (0.4 + t), y]);
  }
  // Fewer echo lines: on a flat crown they stack into a grid.
  paintRock(p, pts, base, "near", seed, "near", 0.4);
  return footY;
}

/* ------------------------------------------------------------------ */
/* Trees, birds, sun                                                   */
/* ------------------------------------------------------------------ */

export function pine(p: Painter, x: number, y: number, size: number) {
  const { rand, noise, out } = p;
  const lean = between(rand, -0.35, 0.35);
  const trunk: Pt[] = [];
  for (let i = 0; i <= 8; i++) {
    const t = i / 8;
    trunk.push([x + lean * size * t + (noise(t * 2, x) - 0.5) * size * 0.25, y - t * size]);
  }
  out.push(`<path class="ink" d="${brush(trunk, noise, { width: size * 0.09, taper: "end", offset: x })}"/>`);

  // Flat, layered needle clouds, the way pines are written in ink.
  const tiers = 3 + Math.floor(rand() * 3);
  for (let k = 0; k < tiers; k++) {
    const t = 0.35 + (k / tiers) * 0.7;
    const [tx, ty] = trunk[Math.min(8, Math.round(t * 8))];
    const span = size * (0.75 - k * 0.1) * between(rand, 0.8, 1.2);
    const dir = rand() < 0.5 ? -1 : 1;
    const off = dir * span * between(rand, 0.1, 0.4);
    for (let l = 0; l < 3; l++) {
      const pts: Pt[] = [];
      const ls = span * (1 - l * 0.22);
      for (let i = 0; i <= 8; i++) {
        const u = i / 8;
        pts.push([tx + off + (u - 0.5) * ls, ty - l * size * 0.05 - Math.sin(Math.PI * u) * size * 0.07]);
      }
      out.push(`<path class="ink" d="${brush(pts, noise, { width: size * 0.06, wobble: 1.4, offset: x + k * 3 + l })}"/>`);
    }
    for (let d = 0; d < 5; d++) {
      const u = rand();
      out.push(`<circle class="ink" cx="${(tx + off + (u - 0.5) * span).toFixed(1)}" cy="${(ty - between(rand, 0, size * 0.12)).toFixed(1)}" r="${between(rand, 0.6, 1.6).toFixed(1)}"/>`);
    }
  }
}

/** The far horizon: soft, pale and blurred by distance. */
function farRange(p: Painter, base: number) {
  const { rand } = p;
  let x = between(rand, -120, -40);
  while (x < SCENE_W + 100) {
    const w = between(rand, 220, 420);
    mountain(p, { x: x + w / 2, base, w, h: between(rand, 90, 210), depth: "far", crag: between(rand, 0.1, 0.5) }, "far");
    x += w * between(rand, 0.45, 0.7);
  }
}

export function mist(id: string, y: number, h: number) {
  return `<rect x="-100" y="${y}" width="${SCENE_W + 200}" height="${h}" fill="url(#${id})"/>`;
}

export const DEFS = `
<defs>
  <linearGradient id="wash-far" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" class="wash" stop-opacity="0.22"/><stop offset="0.6" class="wash" stop-opacity="0"/>
  </linearGradient>
  <linearGradient id="wash-mid" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" class="wash" stop-opacity="0.45"/><stop offset="0.7" class="wash" stop-opacity="0"/>
  </linearGradient>
  <linearGradient id="wash-near" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" class="wash" stop-opacity="0.6"/><stop offset="0.75" class="wash" stop-opacity="0.05"/>
  </linearGradient>
  <linearGradient id="fog" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" class="fog" stop-opacity="0"/><stop offset="0.55" class="fog" stop-opacity="0.85"/><stop offset="1" class="fog" stop-opacity="1"/>
  </linearGradient>
  <radialGradient id="sun-glow">
    <stop offset="0.35" class="blood" stop-opacity="0.55"/><stop offset="1" class="blood" stop-opacity="0"/>
  </radialGradient>
  <filter id="bleed" x="-5%" y="-5%" width="110%" height="110%">
    <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="7" result="n"/>
    <feDisplacementMap in="SourceGraphic" in2="n" scale="3.5"/>
  </filter>
  <filter id="haze"><feGaussianBlur stdDeviation="1.6"/></filter>
</defs>`;

/**
 * Paints a whole landscape for a seed. Returns the inner markup of an
 * <svg viewBox="0 0 1600 900">, plus where the wanderer's feet land.
 * Colours come from CSS classes so both themes work.
 */
export function paintLandscape(seedInput: number): { svg: string; footY: number } {
  const rand = createRand(seedInput);
  const p: Painter = { rand, noise: createNoise(rand), out: [] };
  const { out } = p;

  out.push(DEFS);
  out.push(`<circle cx="${SUN.x}" cy="${SUN.y}" r="${SUN.r * 2.6}" fill="url(#sun-glow)" class="sun-glow"/>`);
  out.push(`<circle cx="${SUN.x}" cy="${SUN.y}" r="${SUN.r}" class="sun" filter="url(#bleed)"/>`);

  out.push(`<g filter="url(#haze)" opacity="0.75">`);
  farRange(p, 590);
  out.push(`</g>`);
  out.push(mist("fog", 470, 160));

  out.push(`<g filter="url(#bleed)">`);
  // Middle distance: a cluster left, a small lone peak in the centre, a pair right.
  mountain(p, { x: between(rand, 260, 360), base: 720, w: 420, h: between(rand, 330, 400), depth: "mid", crag: 0.8 }, "mid");
  mountain(p, { x: between(rand, 80, 140), base: 730, w: 300, h: between(rand, 200, 260), depth: "mid", crag: 0.6 }, "mid");
  mountain(p, { x: between(rand, 1000, 1060), base: 690, w: 230, h: between(rand, 150, 200), depth: "mid", crag: 0.7 }, "mid");
  mountain(p, { x: between(rand, 1180, 1240), base: 720, w: 300, h: between(rand, 240, 300), depth: "mid", crag: 0.9 }, "mid");
  out.push(`</g>`);
  out.push(mist("fog", 600, 170));

  out.push(`<g filter="url(#bleed)">`);
  // Foreground: towering pillars on the right, the wanderer's ledge on the left.
  mountain(p, { x: between(rand, 1380, 1440), base: 900, w: 460, h: between(rand, 600, 680), depth: "near", crag: 1 }, "near");
  mountain(p, { x: between(rand, 1580, 1640), base: 900, w: 300, h: between(rand, 380, 460), depth: "near", crag: 0.8 }, "near");
  const footY = ledge(p, 760, 640, 900);
  out.push(`</g>`);
  out.push(mist("fog", 760, 160));

  // Pines poking out of the lowest cloud bank.
  for (let i = 0; i < 4; i++) pine(p, between(rand, 820, 1180), between(rand, 905, 935), between(rand, 45, 80));

  return { svg: out.join(""), footY };
}

/** Birds crossing the sun, as a separate layer so they can drift. */
export function paintBirds(seedInput: number): string {
  const rand = createRand(seedInput ^ 0x9e3779b9);
  const out: string[] = [];
  const count = 18 + Math.floor(rand() * 10);
  for (let i = 0; i < count; i++) {
    // A loose V trailing away from the sun.
    const arm = rand() < 0.5 ? -1 : 1;
    const t = rand();
    const x = SUN.x - 140 + t * 360 + between(rand, -12, 12);
    const y = SUN.y - 70 + arm * t * 40 + Math.abs(t - 0.4) * 30 + between(rand, -8, 8);
    const s = between(rand, 3, 5.5);
    out.push(`<path d="M${(x - s).toFixed(1)} ${(y - s * 0.5).toFixed(1)}Q${(x - s * 0.4).toFixed(1)} ${(y - s * 0.2).toFixed(1)} ${x.toFixed(1)} ${(y + s * 0.3).toFixed(1)}Q${(x + s * 0.4).toFixed(1)} ${(y - s * 0.2).toFixed(1)} ${(x + s).toFixed(1)} ${(y - s * 0.6).toFixed(1)}"/>`);
  }
  return out.join("");
}

/** Spiral arms around the sun; only visible in the night theme. */
export function paintVortex(seedInput: number): string {
  const rand = createRand(seedInput ^ 0x51ed270b);
  const noise = createNoise(rand);
  const out: string[] = [];
  const arms = 7;
  for (let a = 0; a < arms; a++) {
    const start = (a / arms) * Math.PI * 2 + between(rand, -0.2, 0.2);
    const pts: Pt[] = [];
    for (let i = 0; i <= 90; i++) {
      const rr = SUN.r * 1.4 + i * 9;
      const th = start + i * 0.045 + (noise(i * 0.08, a) - 0.5) * 0.4;
      pts.push([SUN.x + Math.cos(th) * rr, SUN.y + Math.sin(th) * rr * 0.62]);
    }
    for (const run of dryRuns(pts, rand, 0.04)) {
      out.push(`<path d="${brush(run, noise, { width: between(rand, 6, 22), wobble: 1.4, offset: a * 7 })}"/>`);
    }
  }
  return out.join("");
}

export const randomSeed = () => Math.floor(Math.random() * 99999) + 1;
