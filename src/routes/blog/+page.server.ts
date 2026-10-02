import { getPosts, getSeries } from "$lib/posts";

export function load() {
  return {
    series: getSeries(),
    loose: getPosts().filter((post) => !post.series),
  };
}
