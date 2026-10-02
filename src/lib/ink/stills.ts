import { paintLandscape } from "./landscape";
import { sheet, PALETTES } from "./palette";
import { paintWorld, TILE, WORLD_DEFS, WORLD_H } from "./world";

/**
 * Build-time pictures of the ink paintings, served as plain images.
 * An <img> is one element for the browser to style and one bitmap to paint,
 * where the same painting inline would be thousands of SVG nodes restyled on
 * every theme change. They show before script runs, and without it.
 */

export const HOME_SEED = __BUILD_SEED__;
export const SCROLL_SEED = (__BUILD_SEED__ % 99999) + 1;

export const STILLS = ["home-light", "home-dark", "scroll-light", "scroll-dark"] as const;
export type Still = (typeof STILLS)[number];

const svg = (viewBox: string, w: number, h: number, body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${w}" height="${h}">${body}</svg>`;

export function still(name: Still): string {
  const [kind, tone] = name.split("-") as ["home" | "scroll", "light" | "dark"];
  const style = `<style>${sheet(PALETTES[tone])}</style>`;
  if (kind === "home") {
    const w = paintWorld(HOME_SEED);
    // Include the neighbouring copies, so ink that spills over the edges shows.
    const looped = (id: string, art: string) =>
      `<defs><g id="${id}">${art}</g></defs><use href="#${id}" x="${-TILE}"/><use href="#${id}"/><use href="#${id}" x="${TILE}"/>`;
    return svg(`0 0 ${TILE} ${WORLD_H}`, TILE, WORLD_H, style + WORLD_DEFS + looped("far", w.far) + looped("mid", w.mid) + looped("near", w.near));
  }
  // The hanging scroll on /about: a tall crop of a single landscape.
  return svg("560 220 420 640", 420, 640, style + paintLandscape(SCROLL_SEED).svg);
}
