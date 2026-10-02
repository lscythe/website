<script lang="ts">
    import { onMount } from "svelte";
    import { setTheme, theme } from "$lib/theme.svelte";
    import { weather } from "$lib/weather.svelte";

    const inceptionYear = 2025;

    let years = $state(`${inceptionYear}`);

    onMount(() => {
        const current = new Date().getFullYear();
        if (current > inceptionYear) years = `${inceptionYear}–${current}`;
    });
</script>

<footer>
    <div class="brush" aria-hidden="true">一剑霜寒</div>
    <div class="rows">
        <span>&copy; {years} Rendra Prasetia</span>
        <div class="top">
            <a href="/privacy-policy">Privacy</a>
            <span class="dot">·</span>
            <a href="/LICENSE" data-sveltekit-reload>License</a>
            <span class="dot">·</span>
            <a href="/rss.xml" data-sveltekit-reload>RSS</a>
        </div>
        <div class="bottom">
            {#if theme.choice !== "system"}
                <button type="button" class="follow" onclick={() => setTheme("system")}>
                    <span class="glyph" aria-hidden="true">自</span> Follow my device's light
                </button>
            {/if}
            {#if weather.now}
                <span class="weather">
                    Jakarta now · <span class="glyph" aria-hidden="true">{weather.now.glyph}</span>
                    {weather.now.label}{weather.now.temp !== null ? ` · ${weather.now.temp}°C` : ""}
                </span>
            {/if}
            <span class="credit">
                Mountains grown after <a href="https://github.com/LingDong-/shan-shui-inf">shan-shui-inf</a>
            </span>
        </div>
    </div>
</footer>

<style>
    footer {
        position: relative;
        display: flex;
        flex-direction: column;
        gap: var(--space-md);
        max-width: var(--max-content-width);
        margin: 0 auto;
        padding: var(--space-xl) var(--space-lg) var(--space-lg);
        color: var(--ink-soft);
        overflow: hidden;
    }

    @media (width < 768px) {
        footer {
            padding: var(--space-lg) var(--space-md) var(--space-md);
        }

        footer::before {
            inset-inline: var(--space-md);
        }
    }

    /* A single loaded stroke of blood-red ink across the top. */
    footer::before {
        content: "";
        position: absolute;
        inset: 0 var(--space-lg) auto;
        height: 0.8rem;
        background: var(--blood);
        opacity: 0.85;
        mask: url("/ink/stroke-1.svg") no-repeat left center / 100% 100%;
    }

    .brush {
        font-family: var(--font-brush);
        font-size: clamp(3rem, 12vw, 8rem);
        line-height: 1;
        color: var(--ink);
        opacity: 0.08;
        white-space: nowrap;
        user-select: none;
    }

    .rows {
        display: flex;
        flex-direction: column;
        gap: var(--space-sm);
    }

    .top,
    .bottom {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-sm) var(--space-md);
        align-items: center;
    }

    .dot {
        color: var(--blood);
    }

    a {
        color: var(--ink);
    }

    .follow {
        all: unset;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 0.4em;
        font-style: italic;
        color: var(--ink-soft);

        &:hover {
            color: var(--ink);
        }

        &:focus-visible {
            outline: 2px dashed var(--blood);
            outline-offset: 3px;
        }
    }

    .glyph {
        display: grid;
        place-items: center;
        width: 1.5em;
        height: 1.5em;
        font-family: var(--font-brush);
        font-style: normal;
        color: var(--blood);
        border-radius: 2px;
        transition: background 0.2s, color 0.2s;
    }

    .weather {
        display: inline-flex;
        align-items: center;
        gap: 0.35em;
        font-style: italic;

        .glyph {
            font-family: var(--font-brush);
            font-style: normal;
            color: var(--blood);
        }
    }

    .credit {
        font-style: italic;
    }

</style>
