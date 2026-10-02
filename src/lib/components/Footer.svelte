<script lang="ts">
    import { onMount } from "svelte";

    const inceptionYear = 2025;
    const THEMES = [
        { value: "light", glyph: "墨", label: "Paper" },
        { value: "dark", glyph: "魔", label: "Night" },
        { value: "system", glyph: "自", label: "As your device" },
    ];

    let years = $state(`${inceptionYear}`);
    let theme = $state("system");

    onMount(() => {
        const current = new Date().getFullYear();
        if (current > inceptionYear) years = `${inceptionYear}–${current}`;
        theme = localStorage.getItem("theme") || "system";
    });

    function setTheme(value: string) {
        theme = value;
        document.documentElement.setAttribute("theme", value);
        localStorage.setItem("theme", value);
    }
</script>

<footer>
    <div class="brush" aria-hidden="true">一剑霜寒</div>
    <div class="rows">
        <div class="top">
            <span>&copy; {years} Rendra Prasetia</span>
            <span class="dot">·</span>
            <a href="/privacy-policy">Privacy</a>
            <span class="dot">·</span>
            <a href="/LICENSE" data-sveltekit-reload>License</a>
            <span class="dot">·</span>
            <a href="/rss.xml" data-sveltekit-reload>RSS</a>
        </div>
        <div class="bottom">
            <div class="themes" role="group" aria-label="Colour theme">
                {#each THEMES as t}
                    <button
                        type="button"
                        aria-pressed={theme === t.value}
                        title={t.label}
                        onclick={() => setTheme(t.value)}
                    >
                        <span class="glyph" aria-hidden="true">{t.glyph}</span>
                        {t.label}
                    </button>
                {/each}
            </div>
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

    footer::before {
        content: "";
        position: absolute;
        inset: 0 var(--space-lg) auto;
        height: 2px;
        background: linear-gradient(90deg, transparent, var(--blood) 20%, var(--blood) 60%, transparent);
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

    .themes {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-sm);
    }

    button {
        all: unset;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 0.4em;
        padding: 0.15em 0.7em 0.15em 0.2em;
        border: 1px solid color-mix(in srgb, var(--ink) 20%, transparent);
        border-radius: 3px;
        font-style: italic;
        color: var(--ink-soft);
        transition: color 0.2s, border-color 0.2s;

        &:hover {
            color: var(--ink);
        }

        &:focus-visible {
            outline: 2px dashed var(--blood);
            outline-offset: 3px;
        }

        &[aria-pressed="true"] {
            color: var(--ink);
            border-color: var(--blood);
        }

        &[aria-pressed="true"] .glyph {
            background: var(--blood);
            color: var(--seal-text);
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

    .credit {
        font-style: italic;
    }
</style>
