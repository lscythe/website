import type { Component } from "svelte";

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

type PostModule = { metadata: PostMeta; default: Component };

/** Markdown posts live in src/posts/, optionally grouped into series folders. */
const modules = import.meta.glob<PostModule>("/src/posts/**/*.md", { eager: true });

const slugOf = (path: string) => path.replace(/^\/src\/posts\//, "").replace(/\.md$/, "");

const published = Object.entries(modules)
  .map(([path, mod]) => ({ meta: { ...mod.metadata, slug: slugOf(path) } as Post, content: mod.default }))
  .filter(({ meta }) => !meta.draft);

const byDateDesc = (a: Post, b: Post) => +new Date(b.pubDate) - +new Date(a.pubDate);

export function getPosts(): Post[] {
  return published.map(({ meta }) => meta).sort(byDateDesc);
}

export function getPost(slug: string): { meta: Post; content: Component } | undefined {
  return published.find(({ meta }) => meta.slug === slug);
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
