import adapter from "@sveltejs/adapter-static";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import { mdsvex } from "mdsvex";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  extensions: [".svelte", ".md"],
  preprocess: [vitePreprocess(), mdsvex({ extensions: [".md"] })],
  kit: {
    // The blog has no posts yet, so /blog/[slug] is legitimately empty; every
    // other route is prerendered and Cloudflare serves 404.html for the rest.
    adapter: adapter({ pages: "dist", assets: "dist", strict: false }),
    prerender: { handleHttpError: "warn", handleUnseenRoutes: "warn" },
  },
};

export default config;
