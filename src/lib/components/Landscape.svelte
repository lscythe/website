<script lang="ts">
    import { onMount, untrack } from "svelte";
    import Wanderer from "./Wanderer.svelte";
    import Rain from "./Rain.svelte";
    import { paintVortex, randomSeed, SUN } from "$lib/ink/landscape";
    import { lightning, paintSky, xiangyun } from "$lib/ink/sky";
    import { breathe, palette, rasterize } from "$lib/ink/raster";
    import { isDarkNow, theme, type ThemeEvent } from "$lib/theme.svelte";
    import { weather } from "$lib/weather.svelte";
    import {
        BANDS,
        groundAt,
        nextLanding,
        paintWorld,
        PARALLAX,
        restAhead,
        TILE,
        WORLD_DEFS,
        WORLD_H,
        type Pose,
        type World,
    } from "$lib/ink/world";

    let { seed: initialSeed, start, startY }: { seed: number; start: number; startY: number } = $props();

    // svelte-ignore state_referenced_locally
    let seed = $state(initialSeed);
    let painting = $state(false);
    let sunk = $state(false);

    // Generated in the browser only after first paint; until then the
    // build-time picture of the same world shows (see $lib/ink/stills).
    let world = $state.raw<World | null>(null);
    const sky = $derived(paintSky(seed));
    const vortex = $derived(paintVortex(seed));
    const wisps = $derived([1, 2].map((n) => xiangyun(seed * 13 + n, { width: 360, banks: 2 })));

    // Jakarta's weather decides the mood: clear skies leave the painting alone.
    const mood = $derived(weather.now?.condition ?? "clear");
    const wet = $derived(mood === "rain" || mood === "storm");
    const clouds = $derived([1, 2, 3, 4].map((n) => xiangyun(seed * 7 + n, { width: 560, banks: 3, heavy: wet })));
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
    let pos = $state(start - DEFAULT_FX);
    // svelte-ignore state_referenced_locally
    let figY = $state(startY);
    let pose = $state<Pose>("stand");
    let step = $state(0);

    let hero: HTMLElement;
    let canvas: HTMLCanvasElement;
    /** The canvas has a painted scene; until then the SVG painting shows. */
    let ready = $state(false);
    /** Off screen: every loop in the hero is paused. */
    let asleep = $state(false);
    let resetWalk = () => {};
    let repaint: (dark?: boolean) => void = () => {};

    // A new world starts the walk over and is painted afresh.
    $effect(() => {
        if (!world) return;
        untrack(() => {
            resetWalk();
            repaint();
        });
    });

    const mod = (x: number, m: number) => ((x % m) + m) % m;
    // One scene unit in CSS px: the hero is 900 units tall (see --k in the styles).
    const actorAt = (x: number, y: number) => `translate(calc(${(x - 110).toFixed(1)} * var(--k)), calc(${(y - 130).toFixed(1)} * var(--k)))`;

    /* ---- Rendering ----------------------------------------------------
       Each depth is rasterised once per theme into a bitmap holding one tile
       (only the rows that carry ink). Every frame then costs six drawImage
       calls: two copies of each layer, slid by its own parallax.          */

    type Layer = "far" | "mid" | "near";
    const LAYERS: Layer[] = ["far", "mid", "near"];
    /** Hazy layers need fewer pixels. */
    const DETAIL: Record<Layer, number> = { far: 0.55, mid: 0.85, near: 1 };

    interface Painted {
        layers: Record<Layer, HTMLCanvasElement>;
        dark: boolean;
        scale: number;
    }

    async function paintLayers(w: World | null, scale: number, dark: boolean): Promise<Painted> {
        if (!w) throw new Error("no world yet");
        const p = palette(dark);
        const layers = {} as Record<Layer, HTMLCanvasElement>;
        for (const l of LAYERS) {
            layers[l] = await rasterize(w[l], WORLD_DEFS, TILE, BANDS[l], scale * DETAIL[l], p, w.splashes[l]);
            await breathe();
        }
        return { layers, dark, scale };
    }

    onMount(() => {
        const shared = Number(new URL(location.href).searchParams.get("seed"));
        if (shared > 0) seed = Math.floor(shared);
        // Build the world once the page has shown, not during hydration.
        const grow = () => (world = paintWorld(seed));
        if ("requestIdleCallback" in window) requestIdleCallback(grow, { timeout: 600 });
        else setTimeout(grow, 50);

        const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
        const ctx = canvas.getContext("2d")!;
        const DPR = Math.min(devicePixelRatio || 1, 1.5);
        let painted: Painted | null = null;
        let pending: Painted | null = null;
        let job = 0;

        const scale = () => canvas.height / WORLD_H;

        const draw = () => {
            if (!painted) return;
            const S = scale();
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            for (const l of LAYERS) {
                const [y0, y1] = BANDS[l];
                const x = -mod(pos * PARALLAX[l], TILE) * S;
                const w = TILE * S;
                const h = (y1 - y0) * S;
                ctx.drawImage(painted.layers[l], x, y0 * S, w, h);
                ctx.drawImage(painted.layers[l], x + w, y0 * S, w, h);
            }
        };

        repaint = async (dark = isDarkNow()) => {
            if (!world) return;
            const id = ++job;
            pending = null;
            const next = await paintLayers(world, scale(), dark);
            if (id !== job) return;
            painted = next;
            ready = true;
            painting = false;
            draw();
            prewarm(id);
        };

        // Once things are quiet, paint the other theme too, so switching finds
        // it ready. Skipped where memory is tight.
        const roomy = ((navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4) > 2;
        const prewarm = (id: number) => {
            if (!roomy) return;
            setTimeout(async () => {
                if (id !== job || !painted || pending) return;
                const other = await paintLayers(world, scale(), !painted.dark);
                if (id === job && !pending) pending = other;
            }, 4000);
        };

        const measure = () => {
            const box = hero.getBoundingClientRect();
            canvas.width = Math.round(box.width * DPR);
            canvas.height = Math.round(box.height * DPR);
            const visible = box.width / (box.height / WORLD_H);
            fx = Math.min(620, Math.max(110, visible * 0.34));
            hero.style.setProperty("--sun-u", String(Math.max(200, visible * 0.64)));
            // Repaint if the size changed enough for the bitmaps to look soft.
            if (painted && Math.abs(scale() / painted.scale - 1) > 0.2) repaint(painted.dark);
            else draw();
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
            if (!world) return;
            pos = world.start - fx;
            figY = groundAt(world.surfaces, pos + fx) ?? figY;
            mode = "walk";
            cooldown = 0;
            draw();
        };
        resetWalk = reset;

        const tick = (dt: number) => {
            if (!world) return;
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
        const ro = new ResizeObserver(() => measure());
        ro.observe(hero);

        // Theme change: the sun sets while the other palette is painted, so the
        // swap under the ink wash is instant.
        const onTheme = (e: Event) => {
            const { phase, dark, ready: wait } = (e as CustomEvent<ThemeEvent>).detail;
            sunk = phase === "set";
            if (phase === "set") {
                if (!world || painted?.dark === dark || pending?.dark === dark) return;
                const prep = paintLayers(world, scale(), dark).then((p) => (pending = p));
                wait.push(prep);
            } else if (pending?.dark === dark) {
                // Keep the old palette as the new "other", ready to switch back.
                [painted, pending] = [pending, painted];
                draw();
            } else if (painted && painted.dark !== dark) {
                repaint(dark);
            }
        };
        addEventListener("ink:theme", onTheme);
        // A theme change that didn't come through setTheme (the device's own
        // light/dark switch): swap if prepared, else repaint.
        followSystem = () => {
            const dark = isDarkNow();
            if (painted?.dark === dark) return;
            if (pending?.dark === dark) {
                [painted, pending] = [pending, painted];
                draw();
            } else repaint(dark);
        };

        let raf = 0;
        let last = 0;
        let visible = true;
        const frame = (t: number) => {
            const dt = last ? Math.min(0.05, (t - last) / 1000) : 0;
            last = t;
            tick(dt);
            draw();
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
        // Off screen (or tab hidden): stop the walk, the CSS loops and the
        // SMIL flock, so the hero costs nothing while you read below it.
        const flock = hero.querySelector<SVGSVGElement>("svg.flock");
        const io = new IntersectionObserver(([entry]) => {
            visible = entry.isIntersecting;
            asleep = !visible;
            if (visible) {
                run();
                if (!calm) flock?.unpauseAnimations();
            } else {
                stop();
                flock?.pauseAnimations();
            }
        });
        io.observe(hero);

        if (calm) {
            pose = "stand";
            hero.querySelectorAll("svg").forEach((svg) => svg.pauseAnimations?.());
        }

        return () => {
            stop();
            io.disconnect();
            ro.disconnect();
            removeEventListener("ink:theme", onTheme);
        };
    });

    // The device switched light/dark while following the system theme.
    $effect(() => {
        theme.dark;
        untrack(() => {
            if (ready) followSystem();
        });
    });
    let followSystem = () => {};

    function reforge() {
        painting = true;
        // Let the fade-out start before the main thread is busy painting;
        // the fade lifts once the new world has been painted.
        setTimeout(() => {
            seed = randomSeed();
            world = paintWorld(seed);
            const url = new URL(location.href);
            url.searchParams.set("seed", String(seed));
            history.replaceState(history.state, "", url);
        }, 260);
    }
</script>

<section class="hero weather-{mood}" class:asleep bind:this={hero} aria-label="An ink landscape scrolling past a wandering cultivator">
    <div class="layers" class:painting>
        <!-- Sky: each piece is a picture painted once and only ever moved. -->
        <div class="celestial" aria-hidden="true">
            <div class="vortex night-only">
                <svg viewBox="-900 -560 1800 1120"><g transform="translate({-SUN.x} {-SUN.y})">{@html vortex}</g></svg>
            </div>
            <div class="disc" class:sunk>
                <div class="day-only">{@html sky.sun}</div>
                <div class="night-only">{@html sky.moon}</div>
            </div>
            <svg class="flock" viewBox="-1500 -450 3000 900">
                <g class="day-only">{@html sky.cranes}</g>
                <g class="night-only">{@html sky.bats}</g>
            </svg>
        </div>

        <div class="wisps" aria-hidden="true">
            {#each wisps as cloud, i}
                <div class="wisp w{i + 1}">{@html cloud}</div>
            {/each}
        </div>

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

        <!-- The mountains: drawn into this canvas from pre-painted bitmaps. -->
        <canvas class="scene" bind:this={canvas} aria-hidden="true"></canvas>

        <!-- Before script runs (or without it), a build-time picture of the
             same painting. Hidden pictures with loading=lazy aren't fetched. -->
        {#if !ready}
            <img class="still day-only" src="/scene/home-light.svg" alt="" width={TILE} height={WORLD_H} loading="lazy" />
            <img class="still night-only" src="/scene/home-dark.svg" alt="" width={TILE} height={WORLD_H} loading="lazy" />
        {/if}

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
        --sun-u: 860;
        /* Size of one scene unit: the scene is 900 units tall. */
        --k: calc(max(100svh, 560px) / 900);
        position: relative;
        height: 100svh;
        min-height: 560px;
        overflow: hidden;
        isolation: isolate;
    }

    .asleep :global(*) {
        animation-play-state: paused !important;
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
    .scene,
    .still {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
    }

    /* Same framing as the canvas: full height, anchored bottom-left. */
    .still {
        object-fit: cover;
        object-position: 0 100%;
    }

    .layers {
        transition: opacity 0.26s;

        &.painting {
            opacity: 0;
        }
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

    /* ---- Sky: positioned around the sun, in scene units ---------------- */

    .celestial {
        position: absolute;
        left: calc(var(--sun-u) * var(--k));
        top: calc(250 * var(--k));
        width: 0;
        height: 0;
    }

    .disc {
        position: absolute;
        left: calc(-200 * var(--k));
        top: calc(-200 * var(--k));
        width: calc(400 * var(--k));
        height: calc(400 * var(--k));
        will-change: transform;
        transition:
            transform 0.75s cubic-bezier(0.55, 0, 0.9, 0.4),
            opacity 2s ease;

        > div,
        :global(svg) {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
        }

        &.sunk {
            transform: translateY(calc(640 * var(--k)));
        }

        &:not(.sunk) {
            transition:
                transform 1.3s cubic-bezier(0.15, 0.6, 0.3, 1),
                opacity 2s ease;
        }

        :global(.sun),
        :global(.moon) {
            fill: var(--blood);
        }

        :global(.blood) {
            stop-color: var(--blood);
        }

        :global(.maria) {
            fill: #000;
            opacity: 0.3;
        }

        :global(.halo path) {
            fill: var(--blood);
            opacity: 0.35;
        }
    }

    /* Rotated as a whole element, so the GPU spins it without repainting. */
    .vortex {
        position: absolute;
        left: calc(-900 * var(--k));
        top: calc(-560 * var(--k));
        width: calc(1800 * var(--k));
        height: calc(1120 * var(--k));
        will-change: transform;
        animation: spin 240s linear infinite;

        svg {
            width: 100%;
            height: 100%;
        }

        :global(path) {
            fill: var(--vortex);
        }
    }

    .flock {
        position: absolute;
        left: calc(-1500 * var(--k));
        top: calc(-450 * var(--k));
        width: calc(3000 * var(--k));
        height: calc(900 * var(--k));
        overflow: visible;

        :global(.bird path) {
            fill: none;
            stroke: var(--ink);
            stroke-width: 1.3;
            stroke-linecap: round;
        }

        :global(.crane-body),
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

    /* A couple of small clouds always drift by. */
    .wisps {
        position: absolute;
        inset: 0;
        overflow: hidden;
        pointer-events: none;
    }

    .wisp {
        position: absolute;
        left: 0;
        width: clamp(240px, 28vw, 440px);
        will-change: transform;
        opacity: 0.85;
        animation: cloud-pass 120s linear infinite;

        :global(svg) {
            display: block;
            width: 100%;
            height: auto;
        }

        &.w1 {
            top: 18%;
            animation-delay: -30s;
        }

        &.w2 {
            top: 34%;
            animation-duration: 170s;
            animation-delay: -110s;
            scale: 0.75;
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
        width: clamp(420px, 62vw, 1000px);
        will-change: transform;
        animation: cloud-pass 90s linear infinite;

        :global(svg) {
            display: block;
            width: 100%;
            height: auto;
        }

        &.c1 {
            top: 2%;
            animation-duration: 75s;
            animation-delay: -12s;
        }

        &.c2 {
            top: 12%;
            animation-duration: 105s;
            animation-delay: -60s;
            scale: 0.8;
        }

        &.c3 {
            top: -3%;
            animation-duration: 130s;
            animation-delay: -95s;
            scale: 1.25;
        }

        &.c4 {
            top: 22%;
            animation-duration: 90s;
            animation-delay: -35s;
            scale: 0.65;
        }
    }

    .weather-fog .cloud {
        opacity: 0.6;
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

    /* Phones and tablets: a lighter sky. The vortex stays still and one
       mist bank and one wisp are enough. */
    @media (pointer: coarse) {
        .vortex {
            animation: none;
        }

        .mist span:nth-child(3),
        .wisp.w2 {
            display: none;
        }
    }

    @media (prefers-reduced-motion: reduce) {
        .vortex,
        .wisp,
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
