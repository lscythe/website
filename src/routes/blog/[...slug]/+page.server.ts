import { error } from "@sveltejs/kit";
import { getPosts, getSeriesOf } from "$lib/posts";

export function entries() {
  return getPosts().map((post) => ({ slug: post.slug }));
}

export function load({ params }) {
  const meta = getPosts().find((post) => post.slug === params.slug);
  if (!meta) error(404, "This scroll was never written.");
  const series = getSeriesOf(meta);
  const index = series?.posts.findIndex((p) => p.slug === meta.slug) ?? -1;
  return {
    meta,
    series: series && {
      name: series.name,
      part: index + 1,
      total: series.posts.length,
      prev: series.posts[index - 1],
      next: series.posts[index + 1],
    },
  };
}
