import { brush, type Pt } from "./brush";
import { between } from "./random";
import type { Painter } from "./landscape";

const r = (n: number) => Math.round(n * 10) / 10;
const pts = (list: Pt[]) => list.map(([x, y]) => `${r(x)} ${r(y)}`).join(" ");

/** A sweeping roof with upturned eaves, the defining line of Chinese buildings. */
function roof(p: Painter, cx: number, eaveY: number, w: number, h: number, cls = "ink") {
  const { out, noise } = p;
  const lift = h * 0.45;
  // Underside: eave tips curl up, the middle sags under the tiles.
  const d =
    `M${r(cx - w * 0.62)} ${r(eaveY - lift)}` +
    `Q${r(cx - w * 0.5)} ${r(eaveY + h * 0.08)} ${r(cx - w * 0.3)} ${r(eaveY + h * 0.05)}` +
    `L${r(cx + w * 0.3)} ${r(eaveY + h * 0.05)}` +
    `Q${r(cx + w * 0.5)} ${r(eaveY + h * 0.08)} ${r(cx + w * 0.62)} ${r(eaveY - lift)}` +
    `Q${r(cx + w * 0.42)} ${r(eaveY - h * 0.25)} ${r(cx + w * 0.16)} ${r(eaveY - h)}` +
    `L${r(cx - w * 0.16)} ${r(eaveY - h)}` +
    `Q${r(cx - w * 0.42)} ${r(eaveY - h * 0.25)} ${r(cx - w * 0.62)} ${r(eaveY - lift)}Z`;
  out.push(`<path class="${cls}" d="${d}"/>`);
  // A few tile strokes across the roof face, lighter than the outline.
  for (let i = 1; i <= 3; i++) {
    const y = eaveY - (h * i) / 4.2;
    const half = w * (0.5 - i * 0.08);
    out.push(
      `<path class="paper-stroke" d="${brush(
        [
          [cx - half, y + 1],
          [cx, y - 1],
          [cx + half, y + 1],
        ],
        noise,
        { width: 0.9, wobble: 0.6, offset: cx + i },
      )}"/>`,
    );
  }
}

/** 亭: an open pavilion on a stone plinth, lantern hung from the eave. */
export function pavilion(p: Painter, x: number, ground: number, s: number) {
  const { out, noise, rand } = p;
  const w = 62 * s;
  const colH = 34 * s;
  const eave = ground - 6 * s - colH;
  // Plinth.
  out.push(`<path class="ink" d="${brush([[x - w * 0.55, ground - 3 * s], [x + w * 0.55, ground - 3 * s]], noise, { width: 6 * s, wobble: 0.4, taper: "none", offset: x })}"/>`);
  // Columns: the back pair lighter, like ink thinned with water.
  for (const [dx, cls] of [[-0.28, "ink-soft"], [0.28, "ink-soft"], [-0.4, "ink"], [0.4, "ink"]] as const) {
    out.push(`<path class="${cls}" d="${brush([[x + w * dx, ground - 6 * s], [x + w * dx + between(rand, -0.6, 0.6), eave + 2]], noise, { width: 2.6 * s, taper: "none", wobble: 0.3, offset: x + dx * 10 })}"/>`);
  }
  // Railing.
  out.push(`<path class="ink-soft" d="${brush([[x - w * 0.42, ground - 14 * s], [x + w * 0.42, ground - 14 * s]], noise, { width: 1.4 * s, taper: "none", offset: x + 3 })}"/>`);
  roof(p, x, eave, w, 18 * s);
  // Finial.
  out.push(`<path class="ink" d="${brush([[x, eave - 18 * s], [x, eave - 26 * s]], noise, { width: 2 * s, taper: "end", offset: x })}"/>`);
  // Lantern: dull red by day, glowing at night.
  out.push(`<line class="ink-soft-line" x1="${r(x + w * 0.5)}" y1="${r(eave - 2)}" x2="${r(x + w * 0.5)}" y2="${r(eave + 7 * s)}"/>`);
  out.push(`<ellipse class="lantern" cx="${r(x + w * 0.5)}" cy="${r(eave + 10 * s)}" rx="${r(3.2 * s)}" ry="${r(4.2 * s)}"/>`);
}

/** 塔: a tiered pagoda, perched on a peak in the middle distance. */
export function pagoda(p: Painter, x: number, ground: number, s: number, tiers = 5) {
  const { out, noise } = p;
  let y = ground;
  let w = 34 * s;
  for (let t = 0; t < tiers; t++) {
    const bodyH = (t === 0 ? 16 : 11) * s;
    out.push(`<path class="ink-soft" d="M${r(x - w * 0.32)} ${r(y)}L${r(x - w * 0.3)} ${r(y - bodyH)}L${r(x + w * 0.3)} ${r(y - bodyH)}L${r(x + w * 0.32)} ${r(y)}Z"/>`);
    // A window slit per tier, lit at night.
    out.push(`<rect class="window" x="${r(x - 1.6 * s)}" y="${r(y - bodyH * 0.75)}" width="${r(3.2 * s)}" height="${r(bodyH * 0.45)}"/>`);
    y -= bodyH;
    roof(p, x, y, w, 7 * s);
    y -= 7 * s;
    w *= 0.84;
  }
  out.push(`<path class="ink" d="${brush([[x, y], [x, y - 16 * s]], noise, { width: 1.8 * s, taper: "end", offset: x })}"/>`);
  for (let i = 0; i < 3; i++) out.push(`<circle class="ink" cx="${r(x)}" cy="${r(y - 4 * s - i * 4 * s)}" r="${r(1.6 * s)}"/>`);
}

/** 茅屋: a thatched hut with a glowing window. */
export function hut(p: Painter, x: number, ground: number, s: number) {
  const { out, noise, rand } = p;
  const w = 46 * s;
  const wallH = 18 * s;
  out.push(`<path class="ink-body" d="M${r(x - w * 0.4)} ${r(ground)}L${r(x - w * 0.4)} ${r(ground - wallH)}L${r(x + w * 0.4)} ${r(ground - wallH)}L${r(x + w * 0.4)} ${r(ground)}Z"/>`);
  for (const dx of [-0.4, 0.4]) {
    out.push(`<path class="ink" d="${brush([[x + w * dx, ground], [x + w * dx, ground - wallH]], noise, { width: 1.8 * s, taper: "none", offset: x + dx })}"/>`);
  }
  out.push(`<rect class="window" x="${r(x + w * 0.06)}" y="${r(ground - wallH * 0.75)}" width="${r(w * 0.2)}" height="${r(wallH * 0.4)}"/>`);
  out.push(`<path class="ink-soft" d="M${r(x - w * 0.22)} ${r(ground)}L${r(x - w * 0.22)} ${r(ground - wallH * 0.7)}L${r(x - w * 0.06)} ${r(ground - wallH * 0.7)}L${r(x - w * 0.06)} ${r(ground)}Z"/>`);
  // Thatch: a heavy wash with straw strokes raking down it.
  const top: Pt = [x, ground - wallH - 22 * s];
  out.push(`<path class="ink-soft" d="M${r(x - w * 0.62)} ${r(ground - wallH + 3)}Q${r(x - w * 0.3)} ${r(top[1] + 4)} ${r(top[0])} ${r(top[1])}Q${r(x + w * 0.3)} ${r(top[1] + 4)} ${r(x + w * 0.62)} ${r(ground - wallH + 3)}Z"/>`);
  for (let i = 0; i < 9; i++) {
    const u = (i + 0.5) / 9;
    const sx = x - w * 0.55 + u * w * 1.1;
    const sy = ground - wallH - 20 * s * Math.sin(Math.PI * u) + 2;
    out.push(`<path class="ink" d="${brush([[sx, sy], [sx + (u - 0.5) * 8 * s, sy + 12 * s]], noise, { width: 1.1 * s, taper: "end", offset: i + x })}"/>`);
  }
  // Smoke curling from the roof.
  const smoke: Pt[] = [];
  for (let i = 0; i <= 12; i++) smoke.push([x + w * 0.2 + Math.sin(i * 0.7 + rand()) * 4 * s, top[1] + 6 - i * 4 * s]);
  out.push(`<path class="smoke" d="${brush(smoke, noise, { width: 2.2 * s, wobble: 1, offset: x })}"/>`);
}

/** 竹: a clump of bamboo, segmented stalks and dagger leaves. */
export function bamboo(p: Painter, x: number, ground: number, s: number) {
  const { out, noise, rand } = p;
  const stalks = 3 + Math.floor(rand() * 4);
  for (let k = 0; k < stalks; k++) {
    const sx = x + between(rand, -12, 12) * s;
    const h = between(rand, 60, 110) * s;
    const lean = between(rand, -0.12, 0.12);
    const segs = Math.round(h / (14 * s));
    const cls = k % 2 ? "ink-soft" : "ink";
    for (let i = 0; i < segs; i++) {
      const y0 = ground - (i * h) / segs;
      const y1 = ground - ((i + 1) * h) / segs + 2.5 * s;
      out.push(`<path class="${cls}" d="${brush([[sx + lean * (ground - y0), y0], [sx + lean * (ground - y1), y1]], noise, { width: 2.4 * s, taper: "none", wobble: 0.2, offset: sx + i })}"/>`);
    }
    // Leaves gather near the top, hanging down and outward.
    const leaves = 4 + Math.floor(rand() * 5);
    for (let l = 0; l < leaves; l++) {
      const ly = ground - h * between(rand, 0.55, 1);
      const lx = sx + lean * (ground - ly);
      const dir = rand() < 0.5 ? -1 : 1;
      const len = between(rand, 10, 18) * s;
      out.push(`<path class="${cls}" d="${brush([[lx, ly], [lx + dir * len * 0.6, ly + len * 0.35], [lx + dir * len, ly + len * 0.55]], noise, { width: 3.2 * s, taper: "end", wobble: 0.3, offset: l + sx })}"/>`);
    }
  }
}

/** 梅: a gnarled plum branch flecked with blood-red blossoms. */
export function plum(p: Painter, x: number, ground: number, s: number) {
  const { out, noise, rand } = p;
  const grow = (from: Pt, angle: number, len: number, width: number, depth: number) => {
    const line: Pt[] = [from];
    let [cx, cy] = from;
    let a = angle;
    const steps = 6;
    for (let i = 0; i < steps; i++) {
      a += between(rand, -0.45, 0.45);
      cx += Math.cos(a) * (len / steps);
      cy += Math.sin(a) * (len / steps);
      line.push([cx, cy]);
    }
    out.push(`<path class="ink" d="${brush(line, noise, { width, taper: "end", wobble: 1, offset: cx })}"/>`);
    for (let i = 2; i < line.length; i++) {
      if (rand() < 0.55) {
        const [bx, by] = line[i];
        out.push(`<circle class="blossom" cx="${r(bx + between(rand, -3, 3))}" cy="${r(by + between(rand, -3, 3))}" r="${r(between(rand, 1.6, 3.2) * s)}"/>`);
      }
    }
    if (depth > 0) {
      const at = line[Math.floor(line.length * between(rand, 0.4, 0.8))];
      grow(at, a + between(rand, -1, 1), len * 0.6, width * 0.6, depth - 1);
      if (rand() < 0.6) grow(line[line.length - 2], a + between(rand, -0.8, 0.8), len * 0.5, width * 0.5, depth - 1);
    }
  };
  grow([x, ground], -Math.PI / 2 + between(rand, -0.5, 0.5), 70 * s, 6 * s, 2);
}

/** An arched wooden bridge. Returns its deck as a walkable surface. */
export function bridge(p: Painter, x0: number, y0: number, x1: number, y1: number): Pt[] {
  const { out, noise } = p;
  const deck: Pt[] = [];
  const span = x1 - x0;
  for (let i = 0; i <= 24; i++) {
    const t = i / 24;
    deck.push([x0 + span * t, y0 + (y1 - y0) * t - Math.sin(Math.PI * t) * span * 0.14]);
  }
  out.push(`<path class="ink" d="${brush(deck, noise, { width: 5, taper: "none", wobble: 0.5, offset: x0 })}"/>`);
  // Arch beneath and a hand rail above.
  out.push(`<path class="ink-soft" d="${brush(deck.map(([x, y]) => [x, y + 9 + Math.sin(((x - x0) / span) * Math.PI) * 6] as Pt), noise, { width: 2, offset: x0 + 5 })}"/>`);
  out.push(`<path class="ink-soft" d="${brush(deck.map(([x, y]) => [x, y - 15] as Pt), noise, { width: 1.6, taper: "none", offset: x0 + 9 })}"/>`);
  for (let i = 0; i <= 24; i += 4) {
    const [px, py] = deck[i];
    out.push(`<path class="ink" d="${brush([[px, py], [px, py - 16]], noise, { width: 2, taper: "none", offset: px })}"/>`);
  }
  return deck.map(([x, y]) => [x, y - 2] as Pt);
}

/** 潑墨: a loose wash of splashed ink, edges torn by the paper. */
export function splash(p: Painter, x: number, y: number, rx: number, ry: number, cls = "pomo") {
  p.out.push(`<ellipse class="${cls}" cx="${r(x)}" cy="${r(y)}" rx="${r(rx)}" ry="${r(ry)}" filter="url(#pomo)"/>`);
}

/** Flecks of ink flicked from a loaded brush. */
export function splatter(p: Painter, x: number, y: number, spread: number, count: number) {
  const { out, rand } = p;
  const dots: string[] = [];
  for (let i = 0; i < count; i++) {
    const a = rand() * Math.PI * 2;
    const d = Math.pow(rand(), 1.6) * spread;
    const rad = between(rand, 0.5, 2.6) * (1 - d / spread) + 0.4;
    dots.push(`<circle cx="${r(x + Math.cos(a) * d)}" cy="${r(y + Math.sin(a) * d * 0.6)}" r="${r(rad)}"/>`);
  }
  out.push(`<g class="ink-faint">${dots.join("")}</g>`);
}

export { pts as pointList };
