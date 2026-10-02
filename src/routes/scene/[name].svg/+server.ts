import { error } from "@sveltejs/kit";
import { still, STILLS, type Still } from "$lib/ink/stills";

export const prerender = true;

export function entries() {
  return STILLS.map((name) => ({ name }));
}

export function GET({ params }) {
  if (!STILLS.includes(params.name as Still)) error(404);
  return new Response(still(params.name as Still), {
    headers: { "content-type": "image/svg+xml", "cache-control": "public, max-age=3600" },
  });
}
