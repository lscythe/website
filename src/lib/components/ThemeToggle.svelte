<script lang="ts">
    import { onMount } from "svelte";
    import { theme, toggleTheme } from "$lib/theme.svelte";

    // A tiny horizon: the sun sets below the line, the moon rises over it.
    let sunk = $state(false);

    onMount(() => {
        const onTheme = (e: Event) => {
            sunk = (e as CustomEvent<{ phase: "set" | "rise" }>).detail.phase === "set";
        };
        addEventListener("ink:theme", onTheme);
        return () => removeEventListener("ink:theme", onTheme);
    });

    function onclick(e: MouseEvent) {
        const box = (e.currentTarget as HTMLElement).getBoundingClientRect();
        toggleTheme({ x: box.left + box.width / 2, y: box.top + box.height / 2 });
    }
</script>

<button
    class="toggle"
    type="button"
    {onclick}
    aria-label={theme.dark ? "Switch to paper (day)" : "Switch to night"}
    title={theme.dark ? "Let the sun rise" : "Let the sun set"}
>
    <svg viewBox="0 0 40 40" aria-hidden="true">
        <defs>
            <clipPath id="toggle-sky"><rect x="0" y="0" width="40" height="27" /></clipPath>
        </defs>
        <g clip-path="url(#toggle-sky)">
            <g class="disc" class:sunk>
                <circle class="sun day-only" cx="20" cy="17" r="8" />
                <g class="night-only">
                    <circle class="moon" cx="20" cy="17" r="8" />
                    <circle class="bite" cx="24" cy="14" r="6.5" />
                </g>
            </g>
        </g>
        <path class="horizon" d="M4 27.5C10 26.4 15 27.8 20 27 25 26.3 31 27.6 36 27.2L36 28.6C30 29.2 25 27.9 20 28.6 15 29.4 9 28 4 29Z" />
        <path class="hill" d="M6 33C11 32 14 31 19 32.5 24 34 29 32 34 33" />
    </svg>
</button>

<style>
    .toggle {
        all: unset;
        cursor: pointer;
        display: grid;
        place-items: center;
        width: 2.4rem;
        height: 2.4rem;
        border-radius: 50%;
        transition: background 0.2s;

        &:hover {
            background: color-mix(in srgb, var(--blood) 12%, transparent);
        }

        &:focus-visible {
            outline: 2px dashed var(--blood);
            outline-offset: 2px;
        }
    }

    svg {
        width: 2.2rem;
        height: 2.2rem;
    }

    .disc {
        transition: transform 0.75s cubic-bezier(0.55, 0, 0.9, 0.4);

        &.sunk {
            transform: translateY(16px);
        }

        &:not(.sunk) {
            transition: transform 1.2s cubic-bezier(0.15, 0.6, 0.3, 1);
        }
    }

    .sun {
        fill: var(--blood);
    }

    .moon {
        fill: var(--ink);
    }

    /* The shadow that carves the crescent is the page colour. */
    .bite {
        fill: var(--paper);
    }

    .horizon {
        fill: var(--ink);
    }

    .hill {
        fill: none;
        stroke: var(--ink-soft);
        stroke-width: 1.2;
        stroke-linecap: round;
    }

    @media (prefers-reduced-motion: reduce) {
        .disc {
            transition: none !important;
        }
    }
</style>
