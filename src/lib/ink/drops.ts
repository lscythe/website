const SHAPES = ["/ink/splash-1.svg", "/ink/splash-2.svg", "/ink/splash-3.svg"];

/**
 * A drop of ink that blooms into a splash on the paper and dries away.
 * Styled by .drop in global.css; removes itself when done.
 */
export function bloom(layer: HTMLElement, x: number, y: number, size: number, tone: "ink" | "blood", life: number, peak: number) {
  const el = document.createElement("span");
  el.className = `drop ${tone}`;
  const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
  el.style.cssText = `left:${x - size / 2}px;top:${y - size / 2}px;width:${size}px;height:${size}px;--peak:${peak};--life:${life}ms;mask-image:url(${shape});rotate:${Math.round(Math.random() * 360)}deg`;
  layer.append(el);
  setTimeout(() => el.remove(), life + 100);
}

/** A falling drop of ink that splashes where it lands. */
export function fall(layer: HTMLElement, x: number, y: number, size: number, peak: number, tone: "ink" | "blood" = "ink") {
  const el = document.createElement("span");
  el.className = `falling ${tone}`;
  const ms = 450 + Math.min(500, y * 0.6);
  el.style.cssText = `left:${x}px;top:${y}px;--from:${-y - 40}px;--ms:${ms}ms`;
  layer.append(el);
  setTimeout(() => {
    el.remove();
    bloom(layer, x, y, size, tone, 9000, peak);
  }, ms);
}
