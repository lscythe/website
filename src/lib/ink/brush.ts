import type { Noise } from "./random";

export type Pt = [number, number];

const r = (n: number) => Math.round(n * 10) / 10;

export interface BrushOptions {
  width: number;
  /** How much the bristles swell and starve along the stroke (0 = even). */
  wobble?: number;
  /** Which ends of the stroke thin out. */
  taper?: "both" | "start" | "end" | "none";
  /** Offset into the noise field so neighbouring strokes differ. */
  offset?: number;
}

/**
 * Turns a polyline into a filled outline with varying width, which reads as a
 * brush stroke rather than a uniform vector line.
 */
export function brush(pts: Pt[], noise: Noise, opts: BrushOptions): string {
  const { width, wobble = 0.8, taper = "both", offset = 0 } = opts;
  const n = pts.length;
  if (n < 2) return "";

  const left: Pt[] = [];
  const right: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const prev = pts[Math.max(0, i - 1)];
    const next = pts[Math.min(n - 1, i + 1)];
    let tx = next[0] - prev[0];
    let ty = next[1] - prev[1];
    const len = Math.hypot(tx, ty) || 1;
    tx /= len;
    ty /= len;

    const t = i / (n - 1);
    let shape = 1;
    if (taper === "both") shape = Math.pow(Math.sin(Math.PI * t), 0.55);
    else if (taper === "start") shape = Math.pow(Math.sin((Math.PI / 2) * t), 0.6);
    else if (taper === "end") shape = Math.pow(Math.cos((Math.PI / 2) * t), 0.6);
    shape = Math.max(shape, 0.08);

    const swell = 1 - wobble / 2 + wobble * noise(i * 0.18 + offset, offset * 0.37);
    const w = (width * shape * swell) / 2;
    left.push([pts[i][0] - ty * w, pts[i][1] + tx * w]);
    right.push([pts[i][0] + ty * w, pts[i][1] - tx * w]);
  }

  const outline = left.concat(right.reverse());
  return "M" + outline.map(([x, y]) => `${r(x)} ${r(y)}`).join("L") + "Z";
}

/** A plain closed polygon path. */
export function poly(pts: Pt[]): string {
  return "M" + pts.map(([x, y]) => `${r(x)} ${r(y)}`).join("L") + "Z";
}

/** Splits a polyline into runs with gaps, like a brush running dry. */
export function dryRuns(pts: Pt[], rand: () => number, gapChance = 0.06): Pt[][] {
  const runs: Pt[][] = [];
  let current: Pt[] = [];
  for (const p of pts) {
    if (current.length > 4 && rand() < gapChance) {
      runs.push(current);
      current = [];
      continue;
    }
    current.push(p);
  }
  if (current.length > 1) runs.push(current);
  return runs;
}
