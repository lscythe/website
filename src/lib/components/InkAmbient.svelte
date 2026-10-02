<script lang="ts">
    import { onMount } from "svelte";
    import { afterNavigate } from "$app/navigation";

    // Three quiet effects, all decoration (aria-hidden, no pointer events):
    //  1. brush rules and splashes marked [data-ink] paint in as they scroll into view;
    //  2. now and then a drop of ink blooms in the page margins and dries away;
    //  3. a click leaves a small splash of blood-red ink.
    let field: HTMLElement;

    const SHAPES = ["/ink/splash-1.svg", "/ink/splash-2.svg", "/ink/splash-3.svg"];
    const pick = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)];

    function drop(x: number, y: number, size: number, tone: "ink" | "blood", life: number, peak: number, layer: HTMLElement) {
        const el = document.createElement("span");
        el.className = `drop ${tone}`;
        el.style.cssText = `left:${x - size / 2}px;top:${y - size / 2}px;width:${size}px;height:${size}px;--peak:${peak};--life:${life}ms;mask-image:url(${pick(SHAPES)});rotate:${Math.round(Math.random() * 360)}deg`;
        layer.append(el);
        setTimeout(() => el.remove(), life + 100);
    }

    onMount(() => {
        const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;

        // 1. Scroll reveals.
        const io = new IntersectionObserver(
            (entries) => {
                for (const e of entries) {
                    if (!e.isIntersecting) continue;
                    e.target.classList.remove("ink-pending");
                    io.unobserve(e.target);
                }
            },
            { rootMargin: "0px 0px -12% 0px" },
        );
        const watch = () => {
            if (calm) return;
            document.querySelectorAll<HTMLElement>("[data-ink]:not(.ink-seen)").forEach((el) => {
                el.classList.add("ink-seen");
                const box = el.getBoundingClientRect();
                // Already on screen at load: show it, don't make the reader wait.
                if (box.top < innerHeight * 0.85) return;
                el.classList.add("ink-pending");
                io.observe(el);
            });
        };
        watch();
        afterNavigate(() => requestAnimationFrame(watch));

        if (calm) return () => io.disconnect();

        // 2. Ambient blooms, mostly in the margins so text stays clean.
        let timer = 0;
        const bloom = () => {
            if (document.visibilityState === "visible" && field.childElementCount < 2) {
                const wide = innerWidth > 1100;
                const side = Math.random() < 0.5;
                const x = wide ? (side ? Math.random() * innerWidth * 0.14 : innerWidth * (0.86 + Math.random() * 0.14)) : Math.random() * innerWidth;
                const y = innerHeight * (0.15 + Math.random() * 0.75);
                const size = (wide ? 140 : 90) + Math.random() * 140;
                drop(x, y, size, Math.random() < 0.3 ? "blood" : "ink", 11000, wide ? 0.09 : 0.05, field);
            }
            timer = window.setTimeout(bloom, 7000 + Math.random() * 8000);
        };
        timer = window.setTimeout(bloom, 2500);

        // 3. A splash where you click (not on links or controls).
        const splashes = document.createElement("div");
        splashes.className = "ink-splashes";
        splashes.setAttribute("aria-hidden", "true");
        document.body.append(splashes);
        const onDown = (e: PointerEvent) => {
            if ((e.target as Element).closest("a, button, input, select, textarea, label, .hit")) return;
            drop(e.clientX, e.clientY, 34 + Math.random() * 30, "blood", 1600, 0.45, splashes);
        };
        addEventListener("pointerdown", onDown, { passive: true });

        return () => {
            io.disconnect();
            clearTimeout(timer);
            removeEventListener("pointerdown", onDown);
            splashes.remove();
        };
    });
</script>

<div class="field" bind:this={field} aria-hidden="true"></div>

<style>
    /* Behind all content: blooms show only on bare paper. */
    .field {
        position: fixed;
        inset: 0;
        z-index: -1;
        pointer-events: none;
        overflow: hidden;
    }

    :global(.ink-splashes) {
        position: fixed;
        inset: 0;
        z-index: 70;
        pointer-events: none;
    }

    :global(.drop) {
        position: absolute;
        background: var(--ink);
        mask-repeat: no-repeat;
        mask-size: contain;
        mask-position: center;
        opacity: 0;
        animation: drop-life var(--life) cubic-bezier(0.2, 0.7, 0.3, 1) forwards;
    }

    :global(.drop.blood) {
        background: var(--blood);
    }

    @keyframes -global-drop-life {
        0% {
            opacity: 0;
            transform: scale(0.2);
        }
        18% {
            opacity: var(--peak);
            transform: scale(1);
        }
        60% {
            opacity: var(--peak);
        }
        100% {
            opacity: 0;
            transform: scale(1.06);
        }
    }
</style>
