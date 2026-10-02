import type { Component } from "svelte";
import { loadBody } from "./post-bodies";

export interface PostMeta {
  title: string;
  description?: string;
  pubDate: string;
  updatedDate?: string;
  series?: string;
  tag?: string[];
  heroImage?: string;
  draft?: boolean;
}

export interface Post extends PostMeta {
  /** Path under /blog, e.g. "migrating-legacy-code/the-chaos". */
  slug: string;
}

export interface Series {
  name: string;
  slug: string;
  /** Parts in reading order (oldest first). */
  posts: Post[];
}

/** Markdown posts live in src/posts/, optionally grouped into series folders. */
// Server-side only: importing this eagerly pulls in every post, so routes read it
// through +page.server.ts and the browser loads bodies via post-bodies.ts.
const metadata = import.meta.glob<PostMeta>("/src/posts/**/*.md", { eager: true, import: "metadata" });

const slugOf = (path: string) => path.replace(/^\/src\/posts\//, "").replace(/\.md$/, "");

const published: Post[] = Object.entries(metadata)
  .map(([path, meta]) => ({ ...meta, slug: slugOf(path) }))
  .filter((post) => !post.draft);

const byDateDesc = (a: Post, b: Post) => +new Date(b.pubDate) - +new Date(a.pubDate);

export function getPosts(): Post[] {
  return [...published].sort(byDateDesc);
}

export async function getPost(slug: string): Promise<{ meta: Post; content: Component } | undefined> {
  const meta = published.find((post) => post.slug === slug);
  if (!meta) return undefined;
  return { meta, content: await loadBody(slug) };
}

/** Series ordered by their newest part; posts outside a series are left out. */
export function getSeries(): Series[] {
  const groups = new Map<string, Series>();
  for (const post of getPosts()) {
    if (!post.series) continue;
    const slug = post.slug.split("/")[0];
    if (!groups.has(slug)) groups.set(slug, { name: post.series, slug, posts: [] });
    groups.get(slug)!.posts.push(post);
  }
  for (const series of groups.values()) series.posts.reverse();
  return [...groups.values()];
}

export function getSeriesOf(post: Post): Series | undefined {
  return getSeries().find((series) => series.posts.some((p) => p.slug === post.slug));
}
