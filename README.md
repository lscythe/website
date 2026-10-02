## My Personal Website

A demonic-cultivator ink painting of a website, built with SvelteKit and prerendered to static HTML.
Every page works without client JavaScript; JS only adds the extras (repainting the landscape,
the Go board, the ink trail).

## the ink landscape

The hero is painted procedurally at build time by `src/lib/ink/`, a small seeded generator
inspired by [shan-shui-inf](https://github.com/LingDong-/shan-shui-inf): value noise shapes the
ridges, brush strokes vary in width like real bristles, and pines, moss dots and cun hatching are
scattered on top. Colours come from CSS, so the same painting works on paper (light) and at night
(dark).

- every build paints a new world; press the red seal to repaint it in the browser
- `/?seed=42` always paints the same landscape, so a seed can be shared

## develop

```sh
bun install
bun run dev
bun run check   # svelte-check
```

## writing

Posts are markdown files in `src/posts/`. A folder groups posts into a series, and the URL follows
the path: `src/posts/rebooting-android-basics/threading-101.md` is served at
`/blog/rebooting-android-basics/threading-101`.

Frontmatter: `title`, `pubDate`, and optionally `description`, `series` (display name), `tag`,
`updatedDate`, `heroImage`, `draft`. Parts of a series are ordered by `pubDate`. Published posts
show up on `/blog`, in `/rss.xml` and in `/sitemap.xml`.

## deploy

`bun run build` writes static files to `dist`, which `wrangler deploy` serves on Cloudflare
Workers (the GitHub Action does this on push to `main`).
