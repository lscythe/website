import { paintLandscape } from "$lib/ink/landscape";
import { SCROLL_SEED } from "$lib/ink/stills";

export function load() {
  return { footY: paintLandscape(SCROLL_SEED).footY };
}
