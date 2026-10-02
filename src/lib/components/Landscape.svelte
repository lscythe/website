<script lang="ts">
    import { onMount } from "svelte";
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
            <g class="wanderer" transform="translate({FIGURE_X} {scene.footY}) scale(1.25)">
                <path class="ribbon" d="M-2 -45C-18 -52-30-38-52-47C-40-39-24-44-2-41Z">
                    <animate
                        attributeName="d"
                        dur="2.6s"
                        repeatCount="indefinite"
                        values="M-2 -45C-18 -52-30-38-52-47C-40-39-24-44-2-41Z;M-2 -45C-20 -44-32-50-55-41C-42-38-26-37-2-41Z;M-2 -45C-18 -52-30-38-52-47C-40-39-24-44-2-41Z"
                    />
                </path>
                <path class="cloak" d="M-6 -46C-14 -40-26 -26-42 -18L-31 -20-39 -11-27 -15-31 -6C-18 -15-9 -25-3 -29Z">
                    <animate
                        attributeName="d"
                        dur="3.4s"
                        repeatCount="indefinite"
                        values="M-6 -46C-14 -40-26 -26-42 -18L-31 -20-39 -11-27 -15-31 -6C-18 -15-9 -25-3 -29Z;M-6 -46C-15 -42-28 -31-45 -25L-33 -24-41 -16-28 -18-32 -9C-19 -16-9 -25-3 -29Z;M-6 -46C-14 -40-26 -26-42 -18L-31 -20-39 -11-27 -15-31 -6C-18 -15-9 -25-3 -29Z"
                    />
                </path>
                <path class="body" d="M-6 -0.5L-3 -24-7 -24-7 -46 7 -46 8 -24 4 -24 6 -0.5 2.5 -0.5 0.5 -18-2.5 -0.5Z" />
                <path class="body" d="M-9 -31L11 -60" stroke-width="1.6" />
                <circle class="body" cx="0" cy="-50" r="4.6" />
                <path class="body" d="M-18 -50Q0 -57 18 -50Q4 -60 0 -64Q-4 -60-18 -50Z" />
            </g>
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
            seed <span>{String(seed).padStart(5, "0")}</span> · press the seal to repaint the world
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

    .wanderer {
        .body,
        .cloak {
            fill: var(--figure);
            stroke: var(--figure-edge);
            stroke-width: 0.5;
        }

        path[stroke-width] {
            fill: none;
            stroke: var(--figure);
        }

        .ribbon {
            fill: var(--blood);
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
        font-size: var(--font-xs);
        letter-spacing: 0.08em;
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
