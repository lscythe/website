<script lang="ts">
    import { onMount } from "svelte";
    import Wanderer from "./Wanderer.svelte";
    import {
        FIGURE_X,
        paintBirds,
        paintLandscape,
        paintVortex,
        randomSeed,
        SCENE_H,
        SCENE_W,
    } from "$lib/ink/landscape";

    let { seed: initialSeed }: { seed: number } = $props();

    // svelte-ignore state_referenced_locally
    let seed = $state(initialSeed);
    let painting = $state(false);

    const scene = $derived(paintLandscape(seed));
    const birds = $derived(paintBirds(seed));
    const vortex = $derived(paintVortex(seed));
    const viewBox = `0 0 ${SCENE_W} ${SCENE_H}`;

    onMount(() => {
        const shared = Number(new URL(location.href).searchParams.get("seed"));
        if (shared > 0) seed = Math.floor(shared);
    });

    function reforge() {
        painting = true;
        // Let the fade-out start before the main thread is busy painting.
        setTimeout(() => {
            seed = randomSeed();
            const url = new URL(location.href);
            url.searchParams.set("seed", String(seed));
            history.replaceState(history.state, "", url);
            painting = false;
        }, 260);
    }
</script>

<section class="hero" aria-label="A generated ink landscape">
    <div class="layers" class:painting>
        <svg class="vortex" {viewBox} preserveAspectRatio="xMidYMax slice" aria-hidden="true">
            <g>{@html vortex}</g>
        </svg>
        <svg class="ink-scene" {viewBox} preserveAspectRatio="xMidYMax slice" aria-hidden="true">
            {@html scene.svg}
        </svg>
        <svg class="life" {viewBox} preserveAspectRatio="xMidYMax slice" aria-hidden="true">
            <g class="birds">{@html birds}</g>
            <Wanderer x={FIGURE_X} y={scene.footY} />
        </svg>
        <div class="mist" aria-hidden="true">
            <span></span><span></span><span></span>
        </div>
    </div>

    <div class="title">
        <h1 class="calligraphy" aria-label="lscythe">魔道</h1>
        <button class="seal" onclick={reforge} title="repaint the world" aria-label="repaint the landscape">
            <span>镰</span>
        </button>
    </div>

    <div class="caption">
        <p class="name">lscythe <em>— a wanderer of the crooked path</em></p>
        <p class="seed">
            Painting <span>No. {seed}</span><span class="hint"> — press the seal to paint the world anew</span>
        </p>
    </div>

    <a class="descend" href="#prelude" aria-label="scroll to content">
        <span>下</span>
    </a>
</section>

<style>
    .hero {
        position: relative;
        height: 100svh;
        min-height: 560px;
        overflow: hidden;
        isolation: isolate;
    }

    /* Let the painting dissolve into the page instead of ending on a hard edge. */
    .hero::after {
        content: "";
        position: absolute;
        inset: auto 0 0;
        height: 22%;
        background: linear-gradient(transparent, var(--paper));
        pointer-events: none;
    }

    .layers,
    .layers svg {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
    }

    .layers {
        transition:
            opacity 0.26s,
            filter 0.26s;

        &.painting {
            opacity: 0;
            filter: blur(8px);
        }
    }

    .vortex {
        :global(path) {
            fill: var(--vortex);
        }

        g {
            transform-box: view-box;
            transform-origin: 905px 285px;
            animation: spin 240s linear infinite;
        }
    }

    .life {
        :global(.birds path) {
            fill: none;
            stroke: var(--ink);
            stroke-width: 1.3;
            stroke-linecap: round;
        }

        .birds {
            animation: drift 40s ease-in-out infinite alternate;
        }
    }

    .mist span {
        position: absolute;
        width: 70vmax;
        height: 22vmax;
        border-radius: 50%;
        background: radial-gradient(closest-side, color-mix(in srgb, var(--paper) 85%, transparent), transparent);
        animation: drift 34s ease-in-out infinite alternate;

        &:nth-child(1) {
            left: -20vmax;
            bottom: 18%;
        }

        &:nth-child(2) {
            right: -25vmax;
            bottom: 4%;
            animation-duration: 46s;
            animation-direction: alternate-reverse;
        }

        &:nth-child(3) {
            left: 20%;
            bottom: -10vmax;
            animation-duration: 58s;
        }
    }

    .title {
        position: absolute;
        top: clamp(5rem, 12vh, 8rem);
        right: clamp(1rem, 6vw, 6rem);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--space-md);
    }

    .calligraphy {
        writing-mode: vertical-rl;
        margin: 0;
        font-family: var(--font-brush);
        font-style: normal;
        font-weight: 400;
        font-size: clamp(4.5rem, 11vw, 9.5rem);
        line-height: 1;
        letter-spacing: -0.05em;
        color: var(--ink);
        text-shadow: 0 0 40px var(--paper);
    }

    .seal {
        all: unset;
        cursor: pointer;
        display: grid;
        place-items: center;
        width: clamp(2.6rem, 4vw, 3.4rem);
        aspect-ratio: 1;
        background: var(--blood);
        color: var(--seal-text);
        font-family: var(--font-brush);
        font-size: clamp(1.8rem, 3vw, 2.5rem);
        line-height: 1;
        border-radius: 4px;
        box-shadow: 0 0 0 3px var(--paper), 0 0 0 4px var(--blood);
        transform: rotate(3deg);
        transition: transform 0.4s cubic-bezier(0.7, 0, 0.2, 1), box-shadow 0.3s;

        &:hover {
            transform: rotate(-8deg) scale(1.08);
            box-shadow: 0 0 0 3px var(--paper), 0 0 0 4px var(--blood), 0 0 30px var(--glow);
        }

        &:active {
            transform: rotate(0) scale(0.92);
        }

        &:focus-visible {
            outline: 2px dashed var(--blood);
            outline-offset: 8px;
        }
    }

    .caption {
        position: absolute;
        left: clamp(1rem, 5vw, 4rem);
        right: 5rem;
        bottom: clamp(1.5rem, 6vh, 4rem);
        z-index: 1;
        max-width: 38rem;
        text-shadow:
            0 0 12px var(--paper),
            0 0 4px var(--paper);

        p {
            margin: 0;
        }
    }

    .name {
        font-family: var(--font-serif);
        font-size: clamp(1.4rem, 3vw, 2.1rem);
        font-weight: 600;

        em {
            font-weight: 400;
            color: var(--ink-soft);
        }
    }

    .seed {
        font-style: italic;
        color: var(--ink-soft);

        span {
            color: var(--blood);
        }
    }

    .descend {
        position: absolute;
        right: clamp(1rem, 5vw, 4rem);
        bottom: clamp(1.5rem, 6vh, 4rem);
        font-family: var(--font-brush);
        font-size: var(--font-2xl);
        text-decoration: none;
        background: none;
        color: var(--blood);
        z-index: 1;
        animation: bob 2.4s ease-in-out infinite;

        &:hover {
            color: var(--ink);
        }
    }

    /* On tall screens the sun sits right of centre, so the title moves left. */
    @media (aspect-ratio < 1) {
        .title {
            right: auto;
            left: clamp(1rem, 6vw, 3rem);
        }

        .hero::after {
            height: 38%;
        }

        .caption {
            right: 3.5rem;
        }

        .name em {
            display: block;
            font-size: 0.75em;
        }

        .hint {
            display: none;
        }
    }

    @keyframes spin {
        to {
            transform: rotate(-360deg);
        }
    }

    @keyframes drift {
        from {
            transform: translateX(-3%);
        }
        to {
            transform: translateX(3%);
        }
    }

    @keyframes bob {
        50% {
            transform: translateY(6px);
        }
    }

    @media (prefers-reduced-motion: reduce) {
        .vortex g,
        .birds,
        .mist span,
        .descend {
            animation: none;
        }
    }
</style>
