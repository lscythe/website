<script lang="ts">
    import { onMount } from "svelte";

    // Ink rain: slanted streaks that break into tiny splashes where they land.
    // `density` is drops per 100k px²; `land` is how far down (0..1) drops may
    // strike, so in the hero they hit the rocks rather than the sky.
    let {
        density = 14,
        land = [0.55, 1],
        splash = true,
        heavy = false,
        opacity = 0.45,
    }: { density?: number; land?: [number, number]; splash?: boolean; heavy?: boolean; opacity?: number } = $props();

    let canvas: HTMLCanvasElement;

    onMount(() => {
        if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        const ctx = canvas.getContext("2d")!;
        const dpr = Math.min(devicePixelRatio, 2);
        let w = 0;
        let h = 0;
        let colour = "";
        type Drop = { x: number; y: number; len: number; speed: number; stop: number };
        type Splash = { x: number; y: number; life: number };
        let drops: Drop[] = [];
        let splashes: Splash[] = [];
        const wind = heavy ? -0.32 : -0.22;

        const spawn = (anywhere: boolean): Drop => ({
            x: Math.random() * (w + h * 0.4),
            y: anywhere ? Math.random() * h : -40 - Math.random() * 80,
            len: (heavy ? 18 : 12) + Math.random() * 16,
            speed: (heavy ? 900 : 650) + Math.random() * 300,
            stop: h * (land[0] + Math.random() * (land[1] - land[0])),
        });

        const resize = () => {
            const box = canvas.getBoundingClientRect();
            w = box.width;
            h = box.height;
            canvas.width = w * dpr;
            canvas.height = h * dpr;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            // --ink is a light-dark() pair; let CSS resolve it.
            colour = getComputedStyle(canvas).color;
            const count = Math.round(((w * h) / 100000) * density * (heavy ? 1.8 : 1));
            drops = Array.from({ length: count }, () => spawn(true));
        };

        let raf = 0;
        let last = 0;
        const frame = (t: number) => {
            const dt = last ? Math.min(0.05, (t - last) / 1000) : 0;
            last = t;
            ctx.clearRect(0, 0, w, h);
            ctx.strokeStyle = colour;
            ctx.lineCap = "round";
            ctx.lineWidth = heavy ? 1.6 : 1.2;
            ctx.beginPath();
            for (const d of drops) {
                d.y += d.speed * dt;
                d.x += d.speed * dt * wind;
                if (d.y > d.stop) {
                    if (splash) splashes.push({ x: d.x, y: d.stop, life: 1 });
                    Object.assign(d, spawn(false));
                    continue;
                }
                ctx.moveTo(d.x, d.y);
                ctx.lineTo(d.x - d.len * wind, d.y - d.len);
            }
            ctx.stroke();
            // Splashes: a pair of tiny arcs that spread and fade.
            ctx.lineWidth = 1;
            for (const s of splashes) {
                s.life -= dt * 3.2;
                const spread = (1 - s.life) * 6;
                ctx.globalAlpha = Math.max(0, s.life);
                ctx.beginPath();
                ctx.arc(s.x, s.y, spread, Math.PI * 1.1, Math.PI * 1.45);
                ctx.moveTo(s.x + spread * Math.cos(Math.PI * 1.55), s.y + spread * Math.sin(Math.PI * 1.55));
                ctx.arc(s.x, s.y, spread, Math.PI * 1.55, Math.PI * 1.9);
                ctx.stroke();
            }
            ctx.globalAlpha = 1;
            splashes = splashes.filter((s) => s.life > 0);
            raf = requestAnimationFrame(frame);
        };

        const start = () => {
            if (raf) return;
            last = 0;
            raf = requestAnimationFrame(frame);
        };
        const stop = () => {
            cancelAnimationFrame(raf);
            raf = 0;
        };

        // Only rain while on screen and the tab is visible.
        const io = new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop()));
        io.observe(canvas);
        const ro = new ResizeObserver(resize);
        ro.observe(canvas);
        const themeObserver = new MutationObserver(() => (colour = getComputedStyle(canvas).color));
        themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["theme"] });
        resize();

        return () => {
            stop();
            io.disconnect();
            ro.disconnect();
            themeObserver.disconnect();
        };
    });
</script>

<canvas bind:this={canvas} style:opacity aria-hidden="true"></canvas>

<style>
    canvas {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        color: var(--ink);
    }
</style>
