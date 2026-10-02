import quotes from "$lib/quotes.json";
import { HOME_SEED } from "$lib/ink/stills";
import { groundAt, paintWorld } from "$lib/ink/world";

// Every build paints a fresh world and picks a fresh verse.
export function load() {
  const world = paintWorld(HOME_SEED);
  return {
    seed: HOME_SEED,
    // Where the wanderer starts, so the page can show them before the
    // browser has generated the world itself.
    start: world.start,
    startY: groundAt(world.surfaces, world.start) ?? 640,
    quote: quotes[Math.floor(Math.random() * quotes.length)],
  };
}
