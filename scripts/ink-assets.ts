/**
 * Generates the ink shapes used as CSS masks around the site:
 *   static/ink/splash-{1,2,3}.svg  splashed ink blots with flicks and droplets
 *   static/ink/stroke-{1,2}.svg    horizontal brush strokes (rules, underlines)
 *   static/ink-wash.svg            the theme-change reveal
 * Masks carry only shape; the page fills them with the theme's ink colour.
 *
 *   bun scripts/ink-assets.ts
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { brush, type Pt } from "../src/lib/ink/brush";
import { createNoise, createRand, fbm } from "../src/lib/ink/random";

const r = (n: number) => n.toFixed(1);
const svg = (w: number, h: number, body: string, stretch = false) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}"${stretch ? ' preserveAspectRatio="none"' : ""}>${body}</svg>\n`;

function blob(seed: number, cx: number, cy: number, radius: number, ragged: number, spikes: number) {
  const rand = createRand(seed);
  const noise = createNoise(rand);
  const pts: string[] = [];
  const n = 300;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    let rr = radius * (1 + (fbm(noise, Math.cos(a) * 2 + 5, Math.sin(a) * 2 + 5, 4) - 0.5) * ragged);
    rr += Math.pow(Math.max(0, noise(a * 9, 3) - 0.6) / 0.4, 3) * radius * spikes;
    pts.push(`${r(cx + Math.cos(a) * rr)} ${r(cy + Math.sin(a) * rr)}`);
  }
  return `M${pts.join("L")}Z`;
}

/** A blot with a darker core, a pale wet halo, flicked streaks and droplets. */
function splash(seed: number) {
  const rand = createRand(seed * 7 + 1);
  const noise = createNoise(rand);
  const C = 200;
  const parts: string[] = [];
  parts.push(`<path opacity="0.35" d="${blob(seed + 11, C, C, 120, 0.55, 0.15)}"/>`);
  parts.push(`<path d="${blob(seed, C, C, 82, 0.5, 0.45)}"/>`);
  // Streaks flung out from the centre, thinning as they go.
  const streaks = 4 + Math.floor(rand() * 4);
  for (let i = 0; i < streaks; i++) {
    const a = rand() * Math.PI * 2;
    const len = 60 + rand() * 90;
    const line: Pt[] = [];
    for (let k = 0; k <= 10; k++) {
      const d = 70 + (k / 10) * len;
      const bend = (noise(k * 0.3, i) - 0.5) * 0.25;
      line.push([C + Math.cos(a + bend) * d, C + Math.sin(a + bend) * d]);
    }
    parts.push(`<path d="${brush(line, noise, { width: 6 + rand() * 8, taper: "end", wobble: 0.8, offset: i })}"/>`);
  }
  for (let i = 0; i < 34; i++) {
    const a = rand() * Math.PI * 2;
    const d = 95 + Math.pow(rand(), 1.3) * 95;
    parts.push(`<circle cx="${r(C + Math.cos(a) * d)}" cy="${r(C + Math.sin(a) * d)}" r="${r(Math.max(1.2, 9 * (1 - (d - 95) / 95) * rand()))}"/>`);
  }
  return svg(400, 400, parts.join(""));
}

/** One confident horizontal stroke: loaded start, dry, broken tail. */
function stroke(seed: number) {
  const rand = createRand(seed * 13 + 5);
  const noise = createNoise(rand);
  const W = 1000;
  const H = 60;
  const line: Pt[] = [];
  for (let i = 0; i <= 60; i++) {
    const t = i / 60;
    line.push([20 + t * (W - 40), H / 2 + Math.sin(t * Math.PI * 1.3 + seed) * 6 + (noise(t * 4, seed) - 0.5) * 6]);
  }
  // The brush lands round and heavy, then runs dry toward the tail.
  const parts = [
    `<ellipse cx="${r(line[0][0] + 6)}" cy="${r(line[0][1])}" rx="13" ry="12.5"/>`,
    `<path d="${brush(line, noise, { width: 22, taper: "end", wobble: 0.9, offset: seed })}"/>`,
  ];
  // Dry-brush hairs streaking out of the tail.
  for (let k = 0; k < 7; k++) {
    const y = H / 2 + (k - 3) * 2.6;
    const from = 0.55 + rand() * 0.3;
    const hairs: Pt[] = [];
    for (let i = 0; i <= 20; i++) {
      const t = from + (i / 20) * (1 - from);
      hairs.push([20 + t * (W - 40), y + Math.sin(t * Math.PI * 1.3 + seed) * 6]);
    }
    parts.push(`<path opacity="0.7" d="${brush(hairs, noise, { width: 1.6, taper: "end", wobble: 1, offset: k + seed })}"/>`);
  }
  // Strokes stretch to whatever length the page asks for.
  return svg(W, H, parts.join(""), true);
}

/** The theme-change reveal: a big splash with a solid core. */
function wash() {
  const rand = createRand(1987);
  const drops: string[] = [];
  for (let i = 0; i < 46; i++) {
    const a = rand() * Math.PI * 2;
    const d = 400 + Math.pow(rand(), 1.4) * 90;
    const rr = 3 + rand() * 14 * (1 - (d - 400) / 100);
    drops.push(`<circle cx="${r(500 + Math.cos(a) * d)}" cy="${r(500 + Math.sin(a) * d)}" r="${r(Math.max(2, rr))}"/>`);
  }
  return svg(1000, 1000, `<path d="${blob(1987, 500, 500, 360, 0.33, 0.33)}"/>${drops.join("")}`);
}

mkdirSync("static/ink", { recursive: true });
for (const n of [1, 2, 3]) writeFileSync(`static/ink/splash-${n}.svg`, splash(n * 31));
for (const n of [1, 2]) writeFileSync(`static/ink/stroke-${n}.svg`, stroke(n * 17));
writeFileSync("static/ink-wash.svg", wash());
console.log("ink assets written");
