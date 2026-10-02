import type { Component } from "svelte";

export interface PostMeta {
  title: string;
  description: string;
  pubDate: string;
  updatedDate?: string;
  tag?: string[];
  heroImage?: string;
  draft?: boolean;
}

export interface Post extends PostMeta {
  slug: string;
}

type PostModule = { metadata: PostMeta; default: Component };

/** Markdown posts live in src/posts/<slug>.md with frontmatter. */
const modules = import.meta.glob<PostModule>("/src/posts/*.md", { eager: true });

const slugOf = (path: string) => path.split("/").pop()!.replace(/\.md$/, "");

export function getPosts(): Post[] {
  return Object.entries(modules)
    .map(([path, mod]) => ({ ...mod.metadata, slug: slugOf(path) }))
    .filter((post) => !post.draft)
    .sort((a, b) => +new Date(b.pubDate) - +new Date(a.pubDate));
}

export function getPost(slug: string): { meta: Post; content: Component } | undefined {
  const entry = Object.entries(modules).find(([path]) => slugOf(path) === slug);
  if (!entry || entry[1].metadata.draft) return undefined;
  return { meta: { ...entry[1].metadata, slug }, content: entry[1].default };
}
