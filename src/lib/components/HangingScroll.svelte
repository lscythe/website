<script lang="ts">
    import { FIGURE_X } from "$lib/ink/landscape";
    import Wanderer from "./Wanderer.svelte";

    // The landscape is a build-time picture (see $lib/ink/stills); only the
    // wanderer is live SVG on top of it.
    let { footY, caption }: { footY: number; caption: string } = $props();
</script>

<!-- A vertical crop of a landscape, mounted like a hanging scroll. -->
<figure class="scroll">
    <span class="rod" aria-hidden="true"></span>
    <div class="silk">
        <div class="art" role="img" aria-label={caption}>
            <img class="day-only" src="/scene/scroll-light.svg" alt="" width="420" height="640" loading="lazy" />
            <img class="night-only" src="/scene/scroll-dark.svg" alt="" width="420" height="640" loading="lazy" />
            <svg viewBox="560 220 420 640" aria-hidden="true">
                <Wanderer x={FIGURE_X} y={footY} scale={1.5} />
            </svg>
        </div>
        <span class="seal" aria-hidden="true">镰</span>
    </div>
    <span class="rod" aria-hidden="true"></span>
    <figcaption>{caption}</figcaption>
</figure>

<style>
    .scroll {
        margin: 0;
        width: min(100%, 320px);
    }

    .rod {
        display: block;
        height: 12px;
        margin: 0 -14px;
        border-radius: 6px;
        background: linear-gradient(var(--ink-soft), var(--ink) 60%, var(--ink-soft));
    }

    .silk {
        position: relative;
        padding: 18px 16px 40px;
        background: var(--paper-raised);
        box-shadow:
            inset 0 0 0 1px color-mix(in srgb, var(--ink) 12%, transparent);
    }

    .art {
        position: relative;
        aspect-ratio: 420 / 640;
        background: var(--paper);

        img,
        svg {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
        }
    }

    .seal {
        position: absolute;
        right: 22px;
        bottom: 10px;
        display: grid;
        place-items: center;
        width: 1.6rem;
        height: 1.6rem;
        background: var(--blood);
        color: var(--seal-text);
        font-family: var(--font-brush);
        border-radius: 2px;
    }

    figcaption {
        margin-top: var(--space-sm);
        font-style: italic;
        color: var(--ink-soft);
    }
</style>
