import { brush, dryRuns, type Pt } from "./brush";
import { between, createNoise, createRand, type Rand } from "./random";

/**
 * Everything in the sky is drawn around the sun / moon at (0, 0); the hero
 * places that origin on screen. Motion is SMIL, so it costs no script time.
 */
export const DISC_R = 58;

const r = (n: number) => Math.round(n * 10) / 10;
const wind = (...frames: string[]) => [...frames, frames[0]].join(";");

/* ------------------------------------------------------------------ */
/* Sun and moon                                                        */
/* ------------------------------------------------------------------ */

export function sun(): string {
  return `
  <circle r="${DISC_R * 2.7}" fill="url(#sky-glow)" class="glow"/>
  <circle r="${DISC_R}" class="sun" filter="url(#sky-bleed)"/>`;
}

export function moon(rand: Rand): string {
  const noise = createNoise(rand);
  // Dark maria brushed onto the disc, then a halo ring that breathes.
  const maria: string[] = [];
  for (let i = 0; i < 5; i++) {
    const a = rand() * Math.PI * 2;
    const d = rand() * DISC_R * 0.55;
    maria.push(`<ellipse class="maria" cx="${r(Math.cos(a) * d)}" cy="${r(Math.sin(a) * d)}" rx="${r(between(rand, 8, 20))}" ry="${r(between(rand, 6, 14))}" filter="url(#pomo-soft)"/>`);
  }
  const ring: Pt[] = [];
  for (let i = 0; i <= 60; i++) {
    const t = (i / 60) * Math.PI * 2;
    const rr = DISC_R * 1.55 + (noise(i * 0.2, 4) - 0.5) * 10;
    ring.push([Math.cos(t) * rr, Math.sin(t) * rr]);
  }
  return `
  <circle r="${DISC_R * 3}" fill="url(#sky-glow)" class="glow"/>
  <g class="halo">${dryRuns(ring, rand, 0.05).map((run) => `<path d="${brush(run, noise, { width: 2.2, wobble: 1.2, offset: run[0][0] })}"/>`).join("")}</g>
  <circle r="${DISC_R}" class="moon" filter="url(#sky-bleed)"/>
  <g clip-path="url(#moon-clip)">${maria.join("")}</g>`;
}

/** Wisps of cloud, written as long curling strokes, drifting past the disc. */
export function clouds(rand: Rand): string {
  const noise = createNoise(rand);
  const out: string[] = [];
  for (let c = 0; c < 3; c++) {
    const y = between(rand, -40, 70);
    const len = between(rand, 220, 380);
    const line: Pt[] = [];
    for (let i = 0; i <= 30; i++) {
      const t = i / 30;
      line.push([-len / 2 + t * len, y + Math.sin(t * Math.PI * 2 + c) * 8 + (noise(t * 3, c) - 0.5) * 10]);
    }
    // A curl at the head of the wisp, like an auspicious cloud.
    const [hx, hy] = line[line.length - 1];
    for (let i = 0; i <= 14; i++) {
      const a = (i / 14) * Math.PI * 1.6;
      line.push([hx + Math.sin(a) * 14, hy - 14 + Math.cos(a) * 14]);
    }
    const dur = between(rand, 70, 110);
    const from = between(rand, -420, -260);
    out.push(`<g class="cloud"><path d="${brush(line, noise, { width: between(rand, 5, 9), wobble: 1, offset: c * 5 })}"/>
      <animateTransform attributeName="transform" type="translate" dur="${r(dur)}s" begin="-${r(rand() * dur)}s" repeatCount="indefinite" values="${r(from)} 0;${r(-from)} 0"/></g>`);
  }
  return out.join("");
}

/* ------------------------------------------------------------------ */
/* Creatures                                                           */
/* ------------------------------------------------------------------ */

/** 鶴: a red-crowned crane in flight, wings beating slowly. */
function crane(scale: number): string {
  const up = "M-2 -2C-10 -16-24 -28-40 -30C-30 -22-22 -12-14 -3Z";
  const down = "M-2 0C-12 8-26 18-40 18C-30 12-20 6-14 1Z";
  const mid = "M-2 -1C-12 -4-26 -6-42 -4C-32 -1-22 0-14 0Z";
  return `<g transform="scale(${scale})">
    <path class="crane-wing" d="${up}"><animate attributeName="d" dur="1.6s" repeatCount="indefinite" values="${wind(up, mid, down, mid)}"/></path>
    <path class="crane-body" d="M-16 0C-8 -5 6 -5 14 -2C8 2-6 4-16 0Z"/>
    <path class="crane-neck" d="M13 -2C20 -4 26 -5 34 -4"/>
    <circle class="crane-crown" cx="34" cy="-4.4" r="1.8"/>
    <path class="crane-neck" d="M35 -4L41 -3"/>
    <path class="crane-legs" d="M-15 0L-30 3M-15 1L-29 5"/>
    <path class="crane-wing far" d="${up}" transform="translate(3 -1) scale(0.8)"><animate attributeName="d" dur="1.6s" begin="-0.15s" repeatCount="indefinite" values="${wind(up, mid, down, mid)}"/></path>
  </g>`;
}

/** 蝠: a bat, fluttering on quick, ragged wings. */
function bat(scale: number): string {
  const up = "M0 0C-4 -6-10 -10-18 -9C-15 -6-15 -3-12 -1C-9 -3-6 -2-4 1ZM0 0C4 -6 10 -10 18 -9C15 -6 15 -3 12 -1C9 -3 6 -2 4 1Z";
  const down = "M0 0C-4 4-10 8-17 9C-14 6-13 4-11 2C-8 3-6 3-4 1ZM0 0C4 4 10 8 17 9C14 6 13 4 11 2C8 3 6 3 4 1Z";
  return `<g transform="scale(${scale})">
    <path class="bat" d="${up}"><animate attributeName="d" dur="0.22s" repeatCount="indefinite" values="${wind(up, down)}"/></path>
    <ellipse class="bat" rx="2.4" ry="3.6"/>
  </g>`;
}

/** Cranes cross the sky by day in a loose skein. */
export function cranes(rand: Rand): string {
  const out: string[] = [];
  for (let i = 0; i < 3; i++) {
    const y = between(rand, -170, -40) + i * 26;
    const dur = between(rand, 46, 64);
    const path = `M-1400 ${r(y)}C-500 ${r(y - 60)} 300 ${r(y + 50)} 1400 ${r(y - 20)}`;
    out.push(`<g>${crane(between(rand, 0.8, 1.15))}<animateMotion dur="${r(dur)}s" begin="-${r(i * 6 + rand() * 20)}s" repeatCount="indefinite" path="${path}"/></g>`);
  }
  // Small birds wheeling near the sun.
  for (let i = 0; i < 9; i++) {
    const s = between(rand, 3, 5);
    const rx = between(rand, 90, 200);
    const ry = between(rand, 30, 70);
    const dur = between(rand, 18, 30);
    out.push(`<g class="bird"><path d="M${-s} ${-s * 0.4}Q${-s * 0.4} ${-s * 0.1} 0 ${s * 0.3}Q${s * 0.4} ${-s * 0.1} ${s} ${-s * 0.5}"><animate attributeName="d" dur="${r(between(rand, 0.6, 0.9))}s" repeatCount="indefinite" values="M${-s} ${-s * 0.4}Q${-s * 0.4} ${-s * 0.1} 0 ${s * 0.3}Q${s * 0.4} ${-s * 0.1} ${s} ${-s * 0.5};M${-s} ${s * 0.2}Q${-s * 0.4} ${-s * 0.2} 0 ${s * 0.3}Q${s * 0.4} ${-s * 0.2} ${s} ${s * 0.2};M${-s} ${-s * 0.4}Q${-s * 0.4} ${-s * 0.1} 0 ${s * 0.3}Q${s * 0.4} ${-s * 0.1} ${s} ${-s * 0.5}"/></path>
      <animateMotion dur="${r(dur)}s" begin="-${r(rand() * dur)}s" repeatCount="indefinite" path="M${r(rx)} -90a${r(rx)} ${r(ry)} 0 1 0 0.1 0Z"/></g>`);
  }
  return out.join("");
}

/** Bats flicker around the moon in erratic loops. */
export function bats(rand: Rand): string {
  const out: string[] = [];
  for (let i = 0; i < 8; i++) {
    // A jittery closed loop around the moon.
    const pts: string[] = [];
    const n = 7;
    const rad = between(rand, 80, 230);
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2 + between(rand, -0.3, 0.3);
      const rr = rad * between(rand, 0.6, 1.25);
      pts.push(`${r(Math.cos(a) * rr)} ${r(Math.sin(a) * rr * 0.6 - 20)}`);
    }
    const d = `M${pts[0]}` + pts.slice(1).map((p, k) => `Q${pts[(k + n - 1) % n].split(" ").map((v) => r(+v * 1.15)).join(" ")} ${p}`).join("") + `Q${pts[n - 1]} ${pts[0]}`;
    const dur = between(rand, 6, 11);
    out.push(`<g>${bat(between(rand, 0.7, 1.2))}<animateMotion dur="${r(dur)}s" begin="-${r(rand() * dur)}s" repeatCount="indefinite" path="${d}"/></g>`);
  }
  return out.join("");
}

export function paintSky(seedInput: number) {
  const rand = createRand(seedInput ^ 0x2545f491);
  return { sun: sun(), moon: moon(rand), clouds: clouds(rand), cranes: cranes(rand), bats: bats(rand) };
}

export const SKY_DEFS = `
<defs>
  <radialGradient id="sky-glow">
    <stop offset="0.35" class="blood" stop-opacity="0.55"/><stop offset="1" class="blood" stop-opacity="0"/>
  </radialGradient>
  <clipPath id="moon-clip"><circle r="${DISC_R}"/></clipPath>
  <filter id="sky-bleed" x="-10%" y="-10%" width="120%" height="120%">
    <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="7" result="n"/>
    <feDisplacementMap in="SourceGraphic" in2="n" scale="3.5"/>
  </filter>
  <filter id="pomo-soft" x="-50%" y="-50%" width="200%" height="200%">
    <feTurbulence type="fractalNoise" baseFrequency="0.08" numOctaves="2" seed="11" result="n"/>
    <feDisplacementMap in="SourceGraphic" in2="n" scale="10" result="d"/>
    <feGaussianBlur in="d" stdDeviation="2.5"/>
  </filter>
</defs>`;

/* ------------------------------------------------------------------ */
/* Weather                                                             */
/* ------------------------------------------------------------------ */

/**
 * A rain cloud in ink: overlapping washes that bleed into each other, with a
 * scroll of curling brush strokes along its belly. The cloud itself spans
 * about 600 x 240 inside a 1000 x 560 box.
 */
export function inkCloud(seed: number): string {
  const rand = createRand(seed);
  const noise = createNoise(rand);
  const out: string[] = [];
  const lobes = 5 + Math.floor(rand() * 3);
  for (let i = 0; i < lobes; i++) {
    const cx = 80 + (i / (lobes - 1)) * 440 + between(rand, -30, 30);
    const cy = 130 - Math.sin((i / (lobes - 1)) * Math.PI) * between(rand, 30, 60);
    out.push(`<ellipse class="cloud-wash" cx="${r(cx)}" cy="${r(cy)}" rx="${r(between(rand, 70, 120))}" ry="${r(between(rand, 45, 70))}" filter="url(#cloud-bleed)"/>`);
  }
  // Belly strokes, each ending in a small curl.
  for (let k = 0; k < 3; k++) {
    const y = 165 + k * 14;
    const x0 = between(rand, 40, 120);
    const x1 = between(rand, 420, 560);
    const line: Pt[] = [];
    for (let i = 0; i <= 24; i++) {
      const t = i / 24;
      line.push([x0 + (x1 - x0) * t, y + Math.sin(t * Math.PI * 3 + k) * 5 + (noise(t * 3, k + seed) - 0.5) * 8]);
    }
    const [hx, hy] = line[line.length - 1];
    for (let i = 0; i <= 12; i++) {
      const a = (i / 12) * Math.PI * 1.7;
      line.push([hx + Math.sin(a) * 11, hy - 11 + Math.cos(a) * 11]);
    }
    out.push(`<path class="cloud-line" d="${brush(line, noise, { width: between(rand, 3, 6), wobble: 1, offset: k * 3 + seed })}"/>`);
  }
  // Generous margins: the wash is displaced and blurred well past its shapes,
  // and must fade out inside the box rather than be cut off at its edge.
  return `<svg viewBox="-200 -160 1000 560" aria-hidden="true"><defs><filter id="cloud-bleed-${seed}" x="-60%" y="-60%" width="220%" height="220%"><feTurbulence type="fractalNoise" baseFrequency="0.025" numOctaves="3" seed="${seed}" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="34" result="d"/><feGaussianBlur in="d" stdDeviation="9"/></filter></defs>${out.join("").replaceAll("url(#cloud-bleed)", `url(#cloud-bleed-${seed})`)}</svg>`;
}

/** A forked bolt of lightning, written as one jagged brush stroke. */
export function lightning(seed: number): string {
  const rand = createRand(seed);
  const noise = createNoise(rand);
  const main: Pt[] = [];
  let x = 100;
  let y = 0;
  while (y < 420) {
    main.push([x, y]);
    x += between(rand, -26, 26);
    y += between(rand, 22, 44);
  }
  const fork: Pt[] = [main[Math.floor(main.length * 0.45)]];
  let [fx, fy] = fork[0];
  for (let i = 0; i < 5; i++) {
    fx += between(rand, 8, 30);
    fy += between(rand, 18, 34);
    fork.push([fx, fy]);
  }
  return `<svg viewBox="0 0 200 440" aria-hidden="true"><path d="${brush(main, noise, { width: 7, taper: "end", wobble: 0.6, offset: seed })}"/><path d="${brush(fork, noise, { width: 4, taper: "end", wobble: 0.6, offset: seed + 1 })}"/></svg>`;
}
