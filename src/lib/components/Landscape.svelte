<script lang="ts">
    import { onMount, untrack } from "svelte";
    import Wanderer from "./Wanderer.svelte";
    import { paintVortex, randomSeed, SUN } from "$lib/ink/landscape";
    import { inkCloud, lightning, paintSky, SKY_DEFS } from "$lib/ink/sky";
    import { weather } from "$lib/weather.svelte";
    import Rain from "./Rain.svelte";
    import {
        groundAt,
        nextLanding,
        paintWorld,
        PARALLAX,
        restAhead,
        TILE,
        WORLD_DEFS,
        WORLD_H,
        type Pose,
    } from "$lib/ink/world";

    let { seed: initialSeed }: { seed: number } = $props();

    // svelte-ignore state_referenced_locally
    let seed = $state(initialSeed);
    let painting = $state(false);
    let sunk = $state(false);

    const world = $derived(paintWorld(seed));
    const sky = $derived(paintSky(seed));
    const vortex = $derived(paintVortex(seed));

    // Jakarta's weather decides the mood: clear skies leave the painting alone.
    const mood = $derived(weather.now?.condition ?? "clear");
    const wet = $derived(mood === "rain" || mood === "storm");
    const clouds = $derived([1, 2, 3, 4].map((n) => inkCloud(seed * 7 + n)));
    const bolt = $derived(lightning(seed));
    let strike = $state(false);
    let boltX = $state(30);

    // Thunder: every so often a bolt forks down and the page flashes.
    $effect(() => {
        if (mood !== "storm" || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        let timer = 0;
        const next = () => {
            timer = window.setTimeout(() => {
                boltX = 10 + Math.random() * 75;
                strike = true;
                window.setTimeout(() => (strike = false), 700);
                next();
            }, 5000 + Math.random() * 9000);
        };
        next();
        return () => clearTimeout(timer);
    });

    /** Where the wanderer stands on screen, in scene units (900 = hero height). */
    const DEFAULT_FX = 300;
    let fx = $state(DEFAULT_FX);
    // svelte-ignore state_referenced_locally
    let pos = $state(world.start - DEFAULT_FX);
    // svelte-ignore state_referenced_locally
    let figY = $state(groundAt(world.surfaces, world.start) ?? 640);
    let pose = $state<Pose>("stand");
    let step = $state(0);

    let hero: HTMLElement;
    let resetWalk = () => {};

    // A new painting starts the walk over.
    $effect(() => {
        world;
        untrack(() => resetWalk());
    });

    const mod = (x: number, m: number) => ((x % m) + m) % m;
    // Strips hold two tiles; sliding by one tile loops back to the start.
    // One scene unit in CSS px: the hero is 900 units tall (see --k in the styles).
    const actorAt = (x: number, y: number) => `translate(calc(${(x - 110).toFixed(1)} * var(--k)), calc(${(y - 130).toFixed(1)} * var(--k)))`;
    const slide = (factor: number) => `translateX(${(-mod(pos * factor, TILE) / (2 * TILE)) * 100}%)`;

    onMount(() => {
        const shared = Number(new URL(location.href).searchParams.get("seed"));
        if (shared > 0) seed = Math.floor(shared);

        const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;

        const measure = () => {
            const box = hero.getBoundingClientRect();
            const visible = box.width / (box.height / WORLD_H);
            fx = Math.min(620, Math.max(110, visible * 0.34));
            hero.style.setProperty("--sun-x", `${Math.max(200, visible * 0.64)}px`);
        };

        // The walk: a small state machine stepping along rock tops and bridges.
        type Mode = "walk" | "wait" | "takeoff" | "jump" | "land";
        let mode: Mode = "walk";
        let timer = 0;
        let cooldown = 0;
        let jump = { from: 0, to: 0, y0: 0, y1: 0, dur: 1, t: 0 };
        const SPEED = 52;
        const POSE: Record<Mode, Pose> = { walk: "walk", wait: "wait", takeoff: "crouch", jump: "jump", land: "crouch" };

        const reset = () => {
            pos = world.start - fx;
            figY = groundAt(world.surfaces, pos + fx) ?? figY;
            mode = "walk";
            cooldown = 0;
        };
        resetWalk = reset;

        const tick = (dt: number) => {
            const feet = pos + fx;
            if (mode === "walk") {
                pos += SPEED * dt;
                step += (SPEED * dt) / 9;
                cooldown -= SPEED * dt;
                const ground = groundAt(world.surfaces, feet + 8);
                if (ground === null) {
                    // Edge of the rock: gather, then leap for the next one.
                    const land = nextLanding(world.surfaces, feet);
                    const dist = land - feet;
                    jump = { from: pos, to: pos + dist, y0: figY, y1: groundAt(world.surfaces, land) ?? figY, dur: 0.55 + dist / 380, t: 0 };
                    mode = "takeoff";
                    timer = 0.14;
                } else {
                    figY += (ground - figY) * Math.min(1, dt * 14);
                    if (cooldown <= 0 && restAhead(world.rests, feet, 4)) {
                        mode = "wait";
                        timer = 3 + Math.random() * 2.5;
                        cooldown = 400;
                    }
                }
            } else if (mode === "jump") {
                jump.t = Math.min(1, jump.t + dt / jump.dur);
                const u = jump.t;
                pos = jump.from + (jump.to - jump.from) * u;
                const arc = 36 + (jump.to - jump.from) * 0.22;
                figY = jump.y0 + (jump.y1 - jump.y0) * u - arc * Math.sin(Math.PI * u);
                if (u >= 1) {
                    mode = "land";
                    timer = 0.12;
                }
            } else {
                timer -= dt;
                if (timer <= 0) mode = mode === "takeoff" ? "jump" : "walk";
            }
            pose = POSE[mode];
        };

        measure();
        reset();
        const onResize = () => measure();
        addEventListener("resize", onResize);

        // The sun sets and the moon rises when the theme changes.
        const onTheme = (e: Event) => {
            const { phase } = (e as CustomEvent<{ phase: "set" | "rise" }>).detail;
            sunk = phase === "set";
        };
        addEventListener("ink:theme", onTheme);

        let raf = 0;
        let last = 0;
        let visible = true;
        const frame = (t: number) => {
            const dt = last ? Math.min(0.05, (t - last) / 1000) : 0;
            last = t;
            tick(dt);
            raf = requestAnimationFrame(frame);
        };
        const run = () => {
            if (calm || !visible || raf) return;
            last = 0;
            raf = requestAnimationFrame(frame);
        };
        const stop = () => {
            cancelAnimationFrame(raf);
            raf = 0;
        };
        const io = new IntersectionObserver(([entry]) => {
            visible = entry.isIntersecting;
            if (visible) run();
            else stop();
        });
        io.observe(hero);

        if (calm) {
            pose = "stand";
            hero.querySelectorAll("svg").forEach((svg) => svg.pauseAnimations?.());
        }

        return () => {
            stop();
            io.disconnect();
            removeEventListener("resize", onResize);
            removeEventListener("ink:theme", onTheme);
        };
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

<section class="hero ink-scene weather-{mood}" bind:this={hero} aria-label="An ink landscape scrolling past a wandering cultivator">
    <!-- Shared gradients and filters for every layer below. -->
    <svg class="defs" aria-hidden="true">{@html WORLD_DEFS}{@html SKY_DEFS}</svg>

    <div class="layers" class:painting>
        <svg class="sky" viewBox="0 0 3200 {WORLD_H}" preserveAspectRatio="xMinYMax slice" aria-hidden="true">
            <g class="celestial">
                <g class="vortex night-only"><g transform="translate({-SUN.x} {-SUN.y})">{@html vortex}</g></g>
                <g class="disc" class:sunk>
                    <g class="day-only">{@html sky.sun}</g>
                    <g class="night-only">{@html sky.moon}</g>
                </g>
                <g class="clouds">{@html sky.clouds}</g>
                <g class="day-only">{@html sky.cranes}</g>
                <g class="night-only">{@html sky.bats}</g>
            </g>
        </svg>

        {#if mood !== "clear"}
            <div class="overcast" aria-hidden="true">
                {#each clouds as cloud, i}
                    <div class="cloud c{i + 1}">{@html cloud}</div>
                {/each}
            </div>
        {/if}
        {#if mood === "storm"}
            <div class="bolt" class:strike style:left="{boltX}%" aria-hidden="true">{@html bolt}</div>
        {/if}

        {#each [["far", world.far], ["mid", world.mid], ["near", world.near]] as [depth, art] (depth)}
            <div class="strip {depth}" style:transform={slide(PARALLAX[depth as keyof typeof PARALLAX])}>
                <svg viewBox="0 0 {2 * TILE} {WORLD_H}" aria-hidden="true">
                    <defs><g id="tile-{depth}">{@html art}</g></defs>
                    <use href="#tile-{depth}" x={-TILE} />
                    <use href="#tile-{depth}" />
                    <use href="#tile-{depth}" x={TILE} />
                </svg>
            </div>
        {/each}

        <!-- A small box that rides on a transform: walking never repaints the scene. -->
        <svg class="actor" viewBox="-110 -130 180 140" style:transform={actorAt(fx, figY)} aria-hidden="true">
            <Wanderer x={0} y={0} {pose} {step} umbrella={wet} />
        </svg>

        <div class="mist" aria-hidden="true">
            <span></span><span></span><span></span>
        </div>
        {#if wet}
            <Rain density={mood === "storm" ? 20 : 13} heavy={mood === "storm"} land={[0.66, 0.98]} />
        {/if}
        {#if mood === "storm"}
            <div class="flash" class:strike aria-hidden="true"></div>
        {/if}
    </div>

    <div class="title">
        <h1 class="calligraphy" aria-label="lscythe">魔道</h1>
        <button class="seal" onclick={reforge} title="repaint the world" aria-label="repaint the landscape">
            <span>镰</span>
        </button>
    </div>

    <div class="caption">
        <p class="name">lscythe <em>— a wanderer of the crooked path</em></p>
        {#if weather.now && weather.now.condition !== "clear"}
            <p class="weather-now">
                Jakarta now · <span class="glyph">{weather.now.glyph}</span>
                {weather.now.label}{weather.now.temp !== null ? ` · ${weather.now.temp}°C` : ""}
            </p>
        {/if}
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
        --sun-x: 860px;
        /* Size of one scene unit: the scene is 900 units tall. */
        --k: calc(max(100svh, 560px) / 900);
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

    .defs {
        position: absolute;
        width: 0;
        height: 0;
    }

    .layers,
    .sky {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
    }

    /* The sky animates on its own layer so it never repaints the page. */
    .sky {
        will-change: transform;
    }

    .actor {
        position: absolute;
        top: 0;
        left: 0;
        width: calc(180 * var(--k));
        height: calc(140 * var(--k));
        overflow: visible;
        will-change: transform;
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

    /* Each depth is a wide strip moved only by transform, so the browser
       slides an already-painted layer instead of redrawing ink every frame. */
    .strip {
        position: absolute;
        top: 0;
        left: 0;
        height: 100%;
        aspect-ratio: 4800 / 900;
        will-change: transform;

        svg {
            display: block;
            width: 100%;
            height: 100%;
        }
    }

    .celestial {
        transform: translate(var(--sun-x), 250px);
    }

    .disc {
        transition:
            transform 0.75s cubic-bezier(0.55, 0, 0.9, 0.4),
            opacity 2s ease;

        &.sunk {
            transform: translateY(620px);
        }

        &:not(.sunk) {
            transition:
                transform 1.3s cubic-bezier(0.15, 0.6, 0.3, 1),
                opacity 2s ease;
        }
    }

    .vortex {
        :global(path) {
            fill: var(--vortex);
        }

        > g {
            transform-box: fill-box;
            transform-origin: center;
            animation: spin 240s linear infinite;
        }
    }

    .sky {
        :global(.sun) {
            fill: var(--blood);
        }

        :global(.moon) {
            fill: var(--blood);
        }

        :global(.maria) {
            fill: #000;
            opacity: 0.3;
        }

        :global(.halo path) {
            fill: var(--blood);
            opacity: 0.35;
        }

        :global(.cloud path) {
            fill: var(--ink);
            opacity: 0.16;
        }

        :global(.bird path) {
            fill: none;
            stroke: var(--ink);
            stroke-width: 1.3;
            stroke-linecap: round;
        }

        :global(.crane-body) {
            fill: var(--paper);
            stroke: var(--ink);
            stroke-width: 1.2;
        }

        :global(.crane-wing) {
            fill: var(--paper);
            stroke: var(--ink);
            stroke-width: 1.2;
        }

        :global(.crane-wing.far) {
            fill: var(--ink);
            opacity: 0.55;
        }

        :global(.crane-neck),
        :global(.crane-legs) {
            fill: none;
            stroke: var(--ink);
            stroke-width: 2;
            stroke-linecap: round;
        }

        :global(.crane-legs) {
            stroke-width: 1.1;
        }

        :global(.crane-crown) {
            fill: var(--blood);
        }

        :global(.bat) {
            fill: var(--figure);
            stroke: var(--ink-soft);
            stroke-width: 0.5;
        }
    }

    /* ---- Weather ---------------------------------------------------- */

    .weather-cloudy .disc {
        opacity: 0.7;
    }

    .weather-fog .disc {
        opacity: 0.45;
    }

    .weather-rain .disc,
    .weather-storm .disc {
        opacity: 0.22;
    }

    /* Rain darkens the sky like a wash laid over the top of the sheet. */
    .weather-rain .layers::before,
    .weather-storm .layers::before {
        content: "";
        position: absolute;
        inset: 0 0 40%;
        z-index: 1;
        background: linear-gradient(var(--ink), transparent);
        opacity: 0.1;
        pointer-events: none;
    }

    .overcast {
        position: absolute;
        inset: 0;
        overflow: hidden;
        pointer-events: none;
    }

    .cloud {
        position: absolute;
        left: 0;
        width: clamp(700px, 92vw, 1500px);
        aspect-ratio: 1000 / 560;
        will-change: transform;
        animation: cloud-pass 90s linear infinite;

        :global(svg) {
            width: 100%;
            height: 100%;
        }

        :global(.cloud-wash) {
            fill: var(--ink);
            opacity: 0.16;
        }

        :global(.cloud-line) {
            fill: var(--ink);
            opacity: 0.45;
        }

        &.c1 {
            top: -20%;
            animation-duration: 75s;
            animation-delay: -12s;
        }

        &.c2 {
            top: -8%;
            animation-duration: 105s;
            animation-delay: -60s;
            scale: 0.8;
        }

        &.c3 {
            top: -27%;
            animation-duration: 130s;
            animation-delay: -95s;
            scale: 1.25;
        }

        &.c4 {
            top: 1%;
            animation-duration: 90s;
            animation-delay: -35s;
            scale: 0.65;
        }
    }

    .weather-rain .cloud :global(.cloud-wash),
    .weather-storm .cloud :global(.cloud-wash) {
        opacity: 0.3;
    }

    .weather-fog .cloud :global(.cloud-wash) {
        opacity: 0.1;
    }

    /* Fog: the mist banks thicken and climb. */
    .weather-fog .mist span {
        height: 40vmax;
        background: radial-gradient(closest-side, var(--paper), transparent);
    }

    .weather-fog .layers::after {
        content: "";
        position: absolute;
        inset: 25% 0 0;
        background: linear-gradient(transparent, color-mix(in srgb, var(--paper) 70%, transparent) 60%);
        pointer-events: none;
    }

    .bolt {
        position: absolute;
        top: 0;
        width: clamp(70px, 9vw, 130px);
        aspect-ratio: 200 / 440;
        opacity: 0;
        pointer-events: none;

        :global(path) {
            fill: var(--ink);
        }

        &.strike {
            animation: strike 0.7s ease-out;
            filter: drop-shadow(0 0 10px var(--glow));
        }
    }

    .flash {
        position: absolute;
        inset: 0;
        background: var(--paper);
        opacity: 0;
        pointer-events: none;

        &.strike {
            animation: flash 0.7s ease-out;
        }
    }

    .weather-now {
        font-style: italic;
        color: var(--ink-soft);

        .glyph {
            font-family: var(--font-brush);
            font-style: normal;
            color: var(--blood);
        }
    }

    @keyframes cloud-pass {
        from {
            transform: translateX(100vw);
        }
        to {
            transform: translateX(-110%);
        }
    }

    @keyframes strike {
        0%,
        100% {
            opacity: 0;
        }
        8%,
        30% {
            opacity: 1;
        }
        18% {
            opacity: 0.3;
        }
    }

    @keyframes flash {
        0%,
        100% {
            opacity: 0;
        }
        8% {
            opacity: 0.55;
        }
        18% {
            opacity: 0.1;
        }
        28% {
            opacity: 0.4;
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
        .hero {
            --sun-x: 280px;
        }

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
        .vortex > g,
        .mist span,
        .descend {
            animation: none;
        }

        .disc {
            transition: none;
        }

        .cloud {
            animation: none;
        }
    }
</style>
