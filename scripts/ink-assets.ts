/**
 * Generates the brush strokes used as CSS masks around the site:
 *   static/ink/stroke-{1,2}.svg    horizontal brush strokes (rules, underlines)
 * (Splash blots are raster: see scripts/ink-blots.py.)
 * Masks carry only shape; the page fills them with the theme's ink colour.
 *
 *   bun scripts/ink-assets.ts
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { brush, type Pt } from "../src/lib/ink/brush";
import { createNoise, createRand } from "../src/lib/ink/random";

const r = (n: number) => n.toFixed(1);
const svg = (w: number, h: number, body: string, stretch = false) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}"${stretch ? ' preserveAspectRatio="none"' : ""}>${body}</svg>\n`;

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

mkdirSync("static/ink", { recursive: true });
for (const n of [1, 2]) writeFileSync(`static/ink/stroke-${n}.svg`, stroke(n * 17));
console.log("ink assets written");
