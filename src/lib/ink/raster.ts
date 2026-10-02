import type { Splash } from "./landscape";
import { sheet, type Palette } from "./palette";

export { palette, PALETTES, type Palette } from "./palette";

/**
 * Turns ink SVG into bitmaps once, so animation only moves pixels.
 *
 * The painted scene is heavy (thousands of brush paths and displacement
 * filters). Drawn live it repaints every frame; rasterised it is a handful of
 * drawImage calls. Colours come from ./palette, because a bitmap cannot
 * follow CSS variables.
 */

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${src.slice(0, 60)}`));
    img.src = src;
  });

/** Yield to the browser between heavy steps so animations keep running. */
export const breathe = () =>
  new Promise<void>((done) => ("requestIdleCallback" in window ? requestIdleCallback(() => done(), { timeout: 120 }) : setTimeout(done, 16)));

const blotCache = new Map<number, Promise<HTMLImageElement>>();
const blot = (shape: number) => {
  if (!blotCache.has(shape)) blotCache.set(shape, loadImage(`/ink/blot-${shape + 1}.webp`));
  return blotCache.get(shape)!;
};

/**
 * Paint a horizontal band [y0, y1] of a `width`-wide piece of ink markup
 * into a canvas, `scale` device pixels per unit. Splashes go in first, as
 * tinted watercolour blots, so the linework sits on top of them.
 */
export async function rasterize(
  markup: string,
  defs: string,
  width: number,
  band: readonly [number, number],
  scale: number,
  p: Palette,
  splashes: Splash[] = [],
): Promise<HTMLCanvasElement> {
  const [y0, y1] = band;
  const h = y1 - y0;
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(width * scale);
  canvas.height = Math.ceil(h * scale);
  const ctx = canvas.getContext("2d")!;

  // The tile loops, so ink that spills past either edge belongs on the other
  // side: draw the neighbouring copies too.
  const tiled = `<defs><g id="tile">${markup}</g></defs><use href="#tile" x="${-width}"/><use href="#tile"/><use href="#tile" x="${width}"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 ${y0} ${width} ${h}" width="${canvas.width}" height="${canvas.height}"><style>${sheet(p)}</style>${defs}${tiled}</svg>`;
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
  try {
    const art = await loadImage(url);
    await breathe();

    // Washes: each blot tinted with the wash colour, laid down softly.
    for (const s of splashes) {
      const img = tint(await blot(s.shape), p.wash);
      ctx.globalAlpha = s.alpha;
      for (const shift of [-width, 0, width]) {
        ctx.drawImage(img, (s.x + shift - s.rx) * scale, (s.y - s.ry - y0) * scale, s.rx * 2 * scale, s.ry * 2 * scale);
      }
    }
    ctx.globalAlpha = 1;
    // Rasterise in vertical slices with a breath between each, so painting
    // a layer never blocks the page for long in one go.
    // Each slice is drawn with a margin and clipped back, so blur and
    // displacement filters see their neighbours and leave no seams.
    const slices = Math.max(1, Math.ceil(canvas.width / 700));
    const ratio = art.naturalWidth / canvas.width;
    const dw = canvas.width / slices;
    const pad = 40 * scale;
    for (let i = 0; i < slices; i++) {
      const x0 = Math.max(0, i * dw - pad);
      const x1 = Math.min(canvas.width, (i + 1) * dw + pad);
      ctx.save();
      ctx.beginPath();
      ctx.rect(i * dw, 0, dw, canvas.height);
      ctx.clip();
      ctx.drawImage(art, x0 * ratio, 0, (x1 - x0) * ratio, art.naturalHeight, x0, 0, x1 - x0, canvas.height);
      ctx.restore();
      await breathe();
    }
  } finally {
    URL.revokeObjectURL(url);
  }
  return canvas;
}

const tints = new Map<string, HTMLCanvasElement>();
function tint(img: HTMLImageElement, colour: string) {
  const key = `${img.src}|${colour}`;
  let c = tints.get(key);
  if (!c) {
    c = document.createElement("canvas");
    c.width = img.naturalWidth;
    c.height = img.naturalHeight;
    const g = c.getContext("2d")!;
    g.drawImage(img, 0, 0);
    g.globalCompositeOperation = "source-in";
    g.fillStyle = colour;
    g.fillRect(0, 0, c.width, c.height);
    tints.set(key, c);
  }
  return c;
}
