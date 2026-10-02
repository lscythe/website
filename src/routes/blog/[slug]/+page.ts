import { error } from "@sveltejs/kit";
import { getPost, getPosts } from "$lib/posts";

export function entries() {
  return getPosts().map((post) => ({ slug: post.slug }));
}

export function load({ params }) {
  const post = getPost(params.slug);
  if (!post) error(404, "This scroll was never written.");
  return { meta: post.meta, content: post.content };
}
