const GLYPHS = "魔道血墨剑杀心魂鬼煞夜孤寂刃";

/**
 * On hover, the label dissolves into brush glyphs and resolves back into
 * itself letter by letter. The text is untouched for screen readers.
 */
export function scramble(node: HTMLElement) {
  const original = node.textContent ?? "";
  let frame = 0;
  let raf = 0;

  const run = () => {
    const resolved = Math.floor(frame / 2);
    node.textContent = [...original]
      .map((ch, i) => (i < resolved || ch === "/" ? ch : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]))
      .join("");
    frame++;
    if (resolved < original.length) raf = requestAnimationFrame(run);
    else node.textContent = original;
  };

  const start = () => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    cancelAnimationFrame(raf);
    frame = 0;
    run();
  };

  node.setAttribute("aria-label", original);
  node.addEventListener("mouseenter", start);
  node.addEventListener("focus", start);

  return {
    destroy() {
      cancelAnimationFrame(raf);
      node.removeEventListener("mouseenter", start);
      node.removeEventListener("focus", start);
      node.textContent = original;
    },
  };
}
