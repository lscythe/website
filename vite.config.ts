import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";

// One seed per build, shared by the pages and the baked scene images
// (src/routes/scene), so they paint the same landscape.
const BUILD_SEED = Math.floor(Math.random() * 99999) + 1;

export default defineConfig({
  plugins: [sveltekit()],
  define: { __BUILD_SEED__: JSON.stringify(BUILD_SEED) },
});
