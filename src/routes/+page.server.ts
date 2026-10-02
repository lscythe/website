import quotes from "$lib/quotes.json";
import { randomSeed } from "$lib/ink/landscape";

// Every build paints a fresh world and picks a fresh verse.
export function load() {
  return {
    seed: randomSeed(),
    quote: quotes[Math.floor(Math.random() * quotes.length)],
  };
}
