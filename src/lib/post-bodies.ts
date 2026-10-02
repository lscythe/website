import type { Component } from "svelte";

// Each post body (with its diagrams) is its own chunk, fetched only when that
// post is opened. Kept apart from posts.ts so the browser never bundles every post.
const bodies = import.meta.glob<Component>("/src/posts/**/*.md", { import: "default" });

export function loadBody(slug: string): Promise<Component> {
  return bodies[`/src/posts/${slug}.md`]();
}
