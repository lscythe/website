import { loadBody } from "$lib/post-bodies";

export async function load({ data }) {
  return { ...data, content: await loadBody(data.meta.slug) };
}
