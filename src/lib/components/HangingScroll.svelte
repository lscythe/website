<script lang="ts">
    import { FIGURE_X, paintLandscape } from "$lib/ink/landscape";
    import Wanderer from "./Wanderer.svelte";

    let { seed, caption }: { seed: number; caption: string } = $props();

    const scene = $derived(paintLandscape(seed));
</script>

<!-- A vertical crop of the hero landscape, mounted like a hanging scroll. -->
<figure class="scroll">
    <span class="rod" aria-hidden="true"></span>
    <div class="silk">
        <svg class="ink-scene" viewBox="560 220 420 640" role="img" aria-label={caption}>
            {@html scene.svg}
            <Wanderer x={FIGURE_X} y={scene.footY} scale={1.5} />
        </svg>
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
            inset 0 0 0 1px color-mix(in srgb, var(--ink) 12%, transparent),
            0 24px 40px -24px rgb(0 0 0 / 0.5);
    }

    svg {
        display: block;
        width: 100%;
        height: auto;
        background: var(--paper);
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
