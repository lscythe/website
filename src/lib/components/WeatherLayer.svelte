<script lang="ts">
    import { onMount } from "svelte";
    import { afterNavigate } from "$app/navigation";
    import { xiangyun } from "$lib/ink/sky";
    import { fall } from "$lib/ink/drops";
    import { weather } from "$lib/weather.svelte";
    import Rain from "./Rain.svelte";

    // The weather across the whole site, kept behind the text:
    //  cloudy/fog: big faint clouds slide across the paper;
    //  rain:       a light ink drizzle, and drops that fall and splash in the
    //              margins (one lands as each new page opens);
    //  storm:      heavier rain and the odd flash.
    const mood = $derived(weather.now?.condition ?? "clear");
    const wet = $derived(mood === "rain" || mood === "storm");
    const clouds = [xiangyun(901, { width: 600, banks: 3 }), xiangyun(902, { width: 520 })];

    let layer: HTMLElement;
    let flash = $state(false);
    let calm = true;

    function dropAt(x: number, y: number, size: number, peak: number) {
        if (calm || !layer) return;
        fall(layer, x, y, size, peak);
    }

    function marginDrop() {
        const wide = innerWidth > 1100;
        const x = wide
            ? Math.random() < 0.5
                ? Math.random() * innerWidth * 0.15
                : innerWidth * (0.85 + Math.random() * 0.15)
            : Math.random() * innerWidth;
        dropAt(x, innerHeight * (0.2 + Math.random() * 0.7), 70 + Math.random() * 90, wide ? 0.12 : 0.06);
    }

    onMount(() => {
        calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
    });

    // While it rains, drops keep falling into the margins.
    $effect(() => {
        if (!wet || calm) return;
        let timer = 0;
        const next = () => {
            timer = window.setTimeout(() => {
                if (document.visibilityState === "visible") marginDrop();
                next();
            }, (mood === "storm" ? 1800 : 3200) + Math.random() * 3000);
        };
        next();
        return () => clearTimeout(timer);
    });

    // A storm flashes the whole page now and then.
    $effect(() => {
        if (mood !== "storm" || calm) return;
        let timer = 0;
        const next = () => {
            timer = window.setTimeout(() => {
                flash = true;
                window.setTimeout(() => (flash = false), 700);
                next();
            }, 9000 + Math.random() * 12000);
        };
        next();
        return () => clearTimeout(timer);
    });

    // An ink drop falls onto each new page while it rains.
    afterNavigate(({ from }) => {
        if (!from || !wet) return;
        const x = innerWidth * (0.2 + Math.random() * 0.6);
        dropAt(x, innerHeight * (0.3 + Math.random() * 0.3), 180 + Math.random() * 80, 0.1);
    });
</script>

<div class="weather {mood}" bind:this={layer} aria-hidden="true">
    {#if mood !== "clear"}
        {#each clouds as cloud, i}
            <div class="cloud c{i + 1}">{@html cloud}</div>
        {/each}
    {/if}
    {#if wet}
        <Rain density={mood === "storm" ? 7 : 4} heavy={mood === "storm"} land={[0.15, 1]} splash={false} opacity={0.22} />
    {/if}
</div>

{#if mood === "storm"}
    <div class="flash" class:on={flash} aria-hidden="true"></div>
{/if}

<style>
    /* Behind everything, like weather seen through the paper. */
    .weather {
        position: fixed;
        inset: 0;
        z-index: -1;
        pointer-events: none;
        overflow: hidden;
    }

    .cloud {
        position: absolute;
        left: 0;
        width: max(55vw, 520px);
        will-change: transform;
        opacity: 0.3;
        animation: pass 140s linear infinite;

        :global(svg) {
            display: block;
            width: 100%;
            height: auto;
        }

        &.c1 {
            top: 8%;
            animation-delay: -40s;
        }

        &.c2 {
            top: 52%;
            animation-duration: 190s;
            animation-delay: -150s;
            scale: 0.8;
        }
    }

    .rain .cloud,
    .storm .cloud {
        opacity: 0.42;
    }

    .flash {
        position: fixed;
        inset: 0;
        z-index: 55;
        background: var(--paper);
        opacity: 0;
        pointer-events: none;

        &.on {
            animation: flash 0.7s ease-out;
        }
    }

    @keyframes pass {
        from {
            transform: translateX(100vw);
        }
        to {
            transform: translateX(-110%);
        }
    }

    @keyframes flash {
        0%,
        100% {
            opacity: 0;
        }
        8% {
            opacity: 0.18;
        }
        20% {
            opacity: 0.04;
        }
        30% {
            opacity: 0.14;
        }
    }

    @media (prefers-reduced-motion: reduce) {
        .cloud {
            animation: none;
        }
    }
</style>
