import { error } from "@sveltejs/kit";
import { getPost, getPosts, getSeriesOf } from "$lib/posts";

export function entries() {
  return getPosts().map((post) => ({ slug: post.slug }));
}

export function load({ params }) {
  const post = getPost(params.slug);
  if (!post) error(404, "This scroll was never written.");
  const series = getSeriesOf(post.meta);
  const index = series?.posts.findIndex((p) => p.slug === post.meta.slug) ?? -1;
  return {
    meta: post.meta,
    content: post.content,
    series: series && {
      name: series.name,
      part: index + 1,
      total: series.posts.length,
      prev: series.posts[index - 1],
      next: series.posts[index + 1],
    },
  };
}
