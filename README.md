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
- the hero is an endless handscroll (`src/lib/ink/world.ts`): three strips slide left at
  different speeds while the wanderer walks the rock tops, waits at pavilions and jumps the gaps;
  the sky (`sky.ts`) has cranes by day and bats by night
- the theme toggle sets the sun and raises the moon (`src/lib/theme.svelte.ts`)

## weather

The painting follows Jakarta's current weather. `worker/index.ts` (the Cloudflare Worker that
serves the site) answers `/api/weather` from [Open-Meteo](https://open-meteo.com/), cached for ten
minutes, so visitors' browsers never call a third party. Clear skies change nothing; cloudy and
fog bring drifting ink clouds and haze; rain brings ink rain, the wanderer's red umbrella and drops
splashing between pages; a storm adds lightning. Add `?weather=clear|cloudy|fog|rain|storm` to any
URL to preview a mood. Under `bun run dev` there is no Worker, so the sky stays clear.

### performance

The painting is generated as SVG but never animated as SVG. In the browser each depth is painted
once per theme into a bitmap (`src/lib/ink/raster.ts`) and the hero redraws those bitmaps into one
canvas each frame. The sun, moon and clouds are pictures that only move. The other theme is
painted ahead of time when the page is idle, so switching swaps bitmaps under the ink wash.
Before script runs, and without it, `/scene/*.svg` (baked at build time, `src/lib/ink/stills.ts`)
show the same painting as plain images.

The ink blots (`static/ink/blot-*.webp`) come from `python3 scripts/ink-blots.py` (needs numpy
and Pillow); the brush strokes (`static/ink/stroke-*.svg`) from `bun scripts/ink-assets.ts`.

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
Workers together with the weather Worker (`bun run pre-deploy` runs both locally) (the GitHub Action does this on push to `main`).
