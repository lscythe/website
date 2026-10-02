/** Colours for ink artwork that is baked (bitmaps, build-time images). */

export interface Palette {
  paper: string;
  ink: string;
  wash: string;
  blood: string;
  bloodDeep: string;
  dark: boolean;
}

/**
 * The theme colours for baked artwork. Bitmaps and build-time images can't
 * follow CSS variables, so these mirror --paper, --ink, --wash, --blood and
 * --blood-deep in src/lib/styles/global.css; change both together.
 */
export const PALETTES: Record<"light" | "dark", Palette> = {
  light: { paper: "#e8e2d6", ink: "#1b1715", wash: "#4a3f36", blood: "#b3141c", bloodDeep: "#7a0c11", dark: false },
  dark: { paper: "#0a0808", ink: "#ddd4c6", wash: "#5d544c", blood: "#d3131f", bloodDeep: "#7d0a10", dark: true },
};

export const palette = (dark: boolean) => PALETTES[dark ? "dark" : "light"];

/** The class names the painters use, written out as concrete colours. */
export function sheet(p: Palette) {
  const lit = p.dark ? "fill:#ff5a2a;opacity:1" : `fill:${p.ink};opacity:0.55`;
  return `
.ink{fill:${p.ink}}.ink-soft{fill:${p.ink};opacity:.7}.ink-faint{fill:${p.ink};opacity:.4}
.ink-body{fill:${p.paper}}.paper-stroke{fill:${p.paper};opacity:.5}
.wash{stop-color:${p.wash}}.fog{stop-color:${p.paper}}.blood{stop-color:${p.blood}}
.ink-soft-line{stroke:${p.ink};stroke-width:1}.smoke{fill:${p.ink};opacity:.16}
.blossom{fill:${p.blood}}.lantern{fill:${p.dark ? "#ff5a2a" : p.blood}}.window{${lit}}`;
}
