<script lang="ts">
    import Seo from "$lib/components/Seo.svelte";
    import Landscape from "$lib/components/Landscape.svelte";
    import Verse from "$lib/components/Verse.svelte";
    import { NUMERALS, SOCIALS } from "$lib/site";

    let { data } = $props();
</script>

<Seo />

<Landscape seed={data.seed} start={data.start} startY={data.startY} />

<div class="container chapters">
    <section id="prelude" class="chapter">
        <header>
            <span class="num">
                <span class="ink-splash blood" data-ink aria-hidden="true"></span>
                {NUMERALS[0]}
            </span>
            <span class="eyebrow">prelude</span>
        </header>
        <div>
            <h2>Hello World!</h2>
            <p class="lede">
                Welcome to my humble website, feel free to explore as much as you want.
            </p>
            <p>
                I'm Rendra Prasetia a <strong>Software Engineer</strong>. Heavy focused on mobile
                development, currently looking into learning new things.
            </p>
        </div>
    </section>

    <hr class="ink-rule" data-ink />

    <section class="chapter">
        <header>
            <span class="num">
                <span class="ink-splash two" data-ink aria-hidden="true"></span>
                {NUMERALS[1]}
            </span>
            <span class="eyebrow">a verse</span>
        </header>
        <Verse text={data.quote.text} author={data.quote.author} />
    </section>

    <hr class="ink-rule alt" data-ink />

    <section class="chapter">
        <header>
            <span class="num">
                <span class="ink-splash three blood" data-ink aria-hidden="true"></span>
                {NUMERALS[2]}
            </span>
            <span class="eyebrow">paths to reach me</span>
        </header>
        <ol class="paths">
            {#each SOCIALS as social, i}
                <li>
                    <a href={social.href} target="_blank" rel="noopener noreferrer">
                        <span class="index">{NUMERALS[i]}</span>
                        <span class="label">{social.label}</span>
                        <span class="arrow" aria-hidden="true">↗</span>
                    </a>
                </li>
            {/each}
        </ol>
    </section>
</div>

<style>
    .chapter {
        display: grid;
        grid-template-columns: minmax(4rem, 9rem) 1fr;
        gap: var(--space-lg);
        padding: var(--space-xl) 0;


        header {
            display: flex;
            gap: var(--space-sm);
            align-items: flex-start;
        }

        h2 {
            margin-top: 0;
        }
    }

    .num {
        position: relative;
        isolation: isolate;

        .ink-splash {
            --size: 9rem;
            left: 50%;
            top: 50%;
            margin: calc(var(--size) / -2) 0 0 calc(var(--size) / -2);
            z-index: -1;
        }

        font-family: var(--font-brush);
        font-size: clamp(3rem, 7vw, 5rem);
        line-height: 1;
        color: var(--blood);
    }

    .eyebrow {
        writing-mode: vertical-rl;
    }

    .lede {
        font-family: var(--font-serif);
        font-size: clamp(1.3rem, 2.5vw, 1.8rem);
        line-height: 1.35;
        font-style: italic;
    }

    .paths {
        list-style: none;
        margin: 0;
        padding: 0;

        li + li {
            border-top: 1px solid color-mix(in srgb, var(--ink) 12%, transparent);
        }

        a {
            display: grid;
            grid-template-columns: 3rem 1fr auto;
            align-items: baseline;
            padding: var(--space-md) var(--space-sm);
            text-decoration: none;
            font-family: var(--font-serif);
            font-size: clamp(1.8rem, 5vw, 3.4rem);
            line-height: 1.1;

            &:hover .arrow {
                transform: translate(4px, -4px) rotate(8deg);
            }

            &:hover .index {
                color: var(--seal-text);
            }
        }
    }

    .index {
        font-family: var(--font-brush);
        font-size: var(--font-xl);
        color: var(--blood);
        transition: color 0.2s;
    }

    .arrow {
        font-size: var(--font-xl);
        transition: transform 0.3s;
    }

    .chapters {
        padding-top: var(--space-lg);
    }

    @media (width < 600px) {
        .chapters {
            padding-top: 0;
        }

        .chapter {
            grid-template-columns: 1fr;
            gap: var(--space-md);
            padding: var(--space-lg) 0;
        }

        .paths a {
            padding: var(--space-sm) 0;
        }

        .eyebrow {
            writing-mode: horizontal-tb;
            align-self: center;
        }
    }
</style>
