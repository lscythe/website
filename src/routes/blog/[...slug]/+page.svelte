<script lang="ts">
    import Seo from "$lib/components/Seo.svelte";

    let { data } = $props();
    const Content = $derived(data.content);

    const fmt = (d: string) =>
        new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
</script>

<Seo title={data.meta.title} description={data.meta.description} image={data.meta.heroImage} />

<!-- Shared by every diagram on the page: gives drawn lines a wavering brush edge. -->
<svg class="filters" aria-hidden="true">
    <filter id="diagram-ink" x="-5%" y="-5%" width="110%" height="110%">
        <feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="2" seed="4" result="n" />
        <feDisplacementMap in="SourceGraphic" in2="n" scale="2.6" />
    </filter>
</svg>

<article class="container">
    <header>
        <a class="back" href="/blog">← Writings</a>
        {#if data.series}
            <p class="series">
                <span class="seal" aria-hidden="true">卷</span>
                {data.series.name} · part {data.series.part} of {data.series.total}
            </p>
        {/if}
        <h1>{data.meta.title}</h1>
        <p class="meta">
            <time datetime={data.meta.pubDate}>{fmt(data.meta.pubDate)}</time>
            {#each data.meta.tag ?? [] as tag}<span class="tag">#{tag}</span>{/each}
        </p>
    </header>

    <div class="prose">
        <Content />
    </div>

    {#if data.series && (data.series.prev || data.series.next)}
        <nav class="turn" aria-label="Series navigation">
            {#if data.series.prev}
                <a class="prev" href="/blog/{data.series.prev.slug}">
                    <span class="dir">← previous</span>
                    <span class="name">{data.series.prev.title}</span>
                </a>
            {:else}<span></span>{/if}
            {#if data.series.next}
                <a class="next" href="/blog/{data.series.next.slug}">
                    <span class="dir">next →</span>
                    <span class="name">{data.series.next.title}</span>
                </a>
            {/if}
        </nav>
    {/if}
</article>

<style>
    article {
        max-width: 860px;
    }

    .filters {
        position: absolute;
        width: 0;
        height: 0;
    }

    header {
        margin-bottom: var(--space-xl);

        h1 {
            margin: var(--space-sm) 0 var(--space-md);
            font-size: clamp(2.2rem, 6vw, 4rem);
        }
    }

    .back {
        font-style: italic;
        text-decoration: none;
        color: var(--ink-soft);
        background: none;

        &:hover {
            color: var(--blood);
        }
    }

    .series {
        display: flex;
        align-items: center;
        gap: var(--space-sm);
        margin: var(--space-lg) 0 0;
        font-style: italic;
        color: var(--ink-soft);
    }

    .seal {
        display: grid;
        place-items: center;
        width: 1.6rem;
        height: 1.6rem;
        flex: none;
        background: var(--blood);
        color: var(--seal-text);
        font-family: var(--font-brush);
        font-style: normal;
        border-radius: 2px;
    }

    .meta {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-xs) var(--space-md);
        font-size: var(--font-sm);
        font-style: italic;
        color: var(--ink-soft);
    }

    .tag {
        color: var(--blood);
    }

    /* ---- Article body (rendered markdown) ---- */
    .prose {
        font-size: 1.2rem;
        line-height: 1.7;

        :global(h2) {
            margin: var(--space-xl) 0 var(--space-md);
            font-size: clamp(1.7rem, 4vw, 2.4rem);
        }

        :global(h3) {
            margin: var(--space-lg) 0 var(--space-sm);
            font-size: clamp(1.35rem, 3vw, 1.7rem);
        }

        :global(h2)::before {
            content: "◆ ";
            font-size: 0.5em;
            vertical-align: middle;
            color: var(--blood);
        }

        :global(ul),
        :global(ol) {
            padding-left: 1.3em;
        }

        :global(li) {
            margin-bottom: var(--space-xs);
        }

        :global(li::marker) {
            color: var(--blood);
        }

        :global(:not(pre) > code) {
            font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
            font-size: 0.82em;
            padding: 0.1em 0.35em;
            background: color-mix(in srgb, var(--ink) 8%, transparent);
            border-radius: 3px;
            overflow-wrap: anywhere;
        }

        :global(pre) {
            margin: var(--space-lg) 0;
            padding: var(--space-md) var(--space-lg);
            overflow-x: auto;
            font-size: 0.85rem;
            line-height: 1.6;
            background: var(--paper-raised);
            border-left: 3px solid var(--blood);
            tab-size: 4;
        }

        :global(pre code) {
            font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
        }

        :global(blockquote) {
            margin: var(--space-lg) 0;
            padding-left: var(--space-md);
            border-left: 2px solid var(--blood);
            font-family: var(--font-serif);
            font-style: italic;
            font-size: var(--font-xl);
            color: var(--ink-soft);
        }

        :global(table) {
            display: block;
            max-width: 100%;
            overflow-x: auto;
            margin: var(--space-lg) 0;
            border-collapse: collapse;
            font-size: 1rem;
        }

        :global(th),
        :global(td) {
            padding: var(--space-sm) var(--space-md);
            text-align: left;
            vertical-align: top;
            border-bottom: 1px solid color-mix(in srgb, var(--ink) 15%, transparent);
        }

        :global(th) {
            font-family: var(--font-serif);
            font-weight: 600;
            border-bottom: 2px solid var(--blood);
        }

        :global(img) {
            max-width: 100%;
            height: auto;
        }

        /* Syntax colours (Prism tokens), kept to ink, ash and blood. */
        :global(.token.comment),
        :global(.token.prolog) {
            color: var(--ink-faint);
            font-style: italic;
        }

        :global(.token.keyword),
        :global(.token.boolean),
        :global(.token.tag) {
            color: var(--blood);
        }

        :global(.token.string),
        :global(.token.char),
        :global(.token.attr-value) {
            color: var(--string);
        }

        :global(.token.number),
        :global(.token.annotation),
        :global(.token.attr-name) {
            color: var(--number);
        }

        :global(.token.function),
        :global(.token.class-name) {
            font-weight: 600;
        }

        :global(.token.punctuation),
        :global(.token.operator) {
            color: var(--ink-soft);
        }
    }

    /* ---- Previous / next part ---- */
    .turn {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--space-md);
        margin-top: var(--space-xl);
        padding-top: var(--space-lg);
        border-top: 1px solid color-mix(in srgb, var(--ink) 15%, transparent);

        a {
            display: flex;
            flex-direction: column;
            gap: var(--space-xs);
            padding: var(--space-md);
            text-decoration: none;
            background: var(--paper-raised);
            border: 1px solid transparent;
            transition: border-color 0.2s;

            &:hover {
                color: var(--ink);
                background: var(--paper-raised);
                border-color: var(--blood);
            }
        }

        .next {
            text-align: right;
            grid-column: 2;
        }
    }

    .dir {
        font-size: var(--font-sm);
        font-style: italic;
        color: var(--blood);
    }

    .name {
        font-family: var(--font-serif);
        font-size: var(--font-lg);
        line-height: 1.25;
    }

    @media (width < 600px) {
        .prose {
            font-size: 1.1rem;

            :global(pre) {
                margin-inline: calc(-1 * var(--space-md));
                padding: var(--space-md);
                font-size: 0.78rem;
            }
        }

        .turn {
            grid-template-columns: 1fr;

            .next {
                grid-column: 1;
            }
        }
    }
</style>
