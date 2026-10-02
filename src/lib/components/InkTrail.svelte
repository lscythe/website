<script lang="ts">
    import { onMount } from "svelte";

    let canvas: HTMLCanvasElement;

    // Blood-ink droplets that follow a fine pointer and bleed away.
    onMount(() => {
        const fine = matchMedia("(pointer: fine)").matches;
        const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (!fine || calm) return;

        const ctx = canvas.getContext("2d")!;
        const dpr = Math.min(devicePixelRatio, 2);
        let drops: { x: number; y: number; r: number; life: number }[] = [];
        let last: { x: number; y: number } | null = null;
        let raf = 0;
        let colour = "";

        const resize = () => {
            canvas.width = innerWidth * dpr;
            canvas.height = innerHeight * dpr;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            // --blood is a light-dark() pair; let CSS resolve it to a real colour.
            colour = getComputedStyle(canvas).color;
        };

        const move = (e: PointerEvent) => {
            const p = { x: e.clientX, y: e.clientY };
            if (last) {
                const dist = Math.hypot(p.x - last.x, p.y - last.y);
                const steps = Math.min(8, Math.ceil(dist / 6));
                for (let i = 0; i < steps; i++) {
                    const t = i / steps;
                    drops.push({
                        x: last.x + (p.x - last.x) * t + (Math.random() - 0.5) * 3,
                        y: last.y + (p.y - last.y) * t + (Math.random() - 0.5) * 3,
                        r: 1 + Math.random() * Math.min(4, dist / 10),
                        life: 1,
                    });
                }
            }
            last = p;
            if (!raf) raf = requestAnimationFrame(tick);
        };

        const tick = () => {
            ctx.clearRect(0, 0, innerWidth, innerHeight);
            ctx.fillStyle = colour;
            for (const d of drops) {
                d.life -= 0.022;
                d.y += 0.15;
                ctx.globalAlpha = Math.max(0, d.life) * 0.55;
                ctx.beginPath();
                ctx.arc(d.x, d.y, d.r * (1.4 - d.life * 0.4), 0, Math.PI * 2);
                ctx.fill();
            }
            drops = drops.filter((d) => d.life > 0);
            raf = drops.length ? requestAnimationFrame(tick) : 0;
        };

        const themeObserver = new MutationObserver(resize);
        themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["theme"] });

        resize();
        addEventListener("resize", resize);
        addEventListener("pointermove", move, { passive: true });
        return () => {
            cancelAnimationFrame(raf);
            themeObserver.disconnect();
            removeEventListener("resize", resize);
            removeEventListener("pointermove", move);
        };
    });
</script>

<canvas bind:this={canvas} aria-hidden="true"></canvas>

<style>
    canvas {
        position: fixed;
        inset: 0;
        width: 100vw;
        height: 100vh;
        pointer-events: none;
        z-index: 60;
        color: var(--blood);
    }
</style>
