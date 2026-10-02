import { randomSeed } from "$lib/ink/landscape";

export function load() {
  return { seed: randomSeed() };
}
