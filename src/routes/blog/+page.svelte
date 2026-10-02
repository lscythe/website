<script lang="ts">
    import Seo from "$lib/components/Seo.svelte";
    import { NUMERALS } from "$lib/site";

    let { data } = $props();

    const fmt = (d: string) =>
        new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    const span = (posts: { pubDate: string }[]) => {
        const month = (d: string) => new Date(d).toLocaleDateString("en-GB", { month: "short", year: "numeric" });
        const first = month(posts[0].pubDate);
        const last = month(posts[posts.length - 1].pubDate);
        return first === last ? first : `${first} – ${last}`;
    };
    const empty = $derived(data.series.length === 0 && data.loose.length === 0);
</script>

<Seo title="writings" description="Series and notes on Android, architecture and the craft." />

<div class="container folio">
    <div class="folio-mark" aria-hidden="true">手记</div>
    <div>
        <span class="eyebrow">scrolls &amp; notes</span>
        {#if empty}
            <h1>Hey, I'm working on it alright.</h1>
            <p>Sometimes i write down my thoughts and experience on various topics.</p>
            <p class="hint">The ink is not yet dry.</p>
        {:else}
            <h1>Writings</h1>
            <p>Sometimes i write down my thoughts and experience on various topics.</p>

            {#each data.series as series, i}
                <section class="series">
                    <header>
                        <span class="num" aria-hidden="true">{NUMERALS[i]}</span>
                        <div>
                            <h2>{series.name}</h2>
                            <p class="meta">{series.posts.length} parts · {span(series.posts)}</p>
                        </div>
                    </header>
                    <ol class="parts">
                        {#each series.posts as post, part}
                            <li>
                                <a href="/blog/{post.slug}">
                                    <span class="part">{String(part + 1).padStart(2, "0")}</span>
                                    <span class="title">{post.title}</span>
                                    <time datetime={post.pubDate}>{fmt(post.pubDate)}</time>
                                </a>
                                {#if post.description}<p class="desc">{post.description}</p>{/if}
                            </li>
                        {/each}
                    </ol>
                </section>
            {/each}

            {#if data.loose.length}
                <section class="series">
                    <header>
                        <span class="num" aria-hidden="true">散</span>
                        <h2>Loose leaves</h2>
                    </header>
                    <ol class="parts">
                        {#each data.loose as post}
                            <li>
                                <a href="/blog/{post.slug}">
                                    <span class="part">·</span>
                                    <span class="title">{post.title}</span>
                                    <time datetime={post.pubDate}>{fmt(post.pubDate)}</time>
                                </a>
                                {#if post.description}<p class="desc">{post.description}</p>{/if}
                            </li>
                        {/each}
                    </ol>
                </section>
            {/if}
        {/if}
        <p class="rss">You can also view my posts via <a href="/rss.xml" data-sveltekit-reload>RSS</a></p>
    </div>
</div>

<style>
    .hint {
        font-family: var(--font-serif);
        font-style: italic;
        color: var(--ink-soft);
    }

    .series {
        margin-top: var(--space-xl);

        header {
            display: flex;
            align-items: center;
            gap: var(--space-md);
            margin-bottom: var(--space-md);
        }

        h2 {
            margin: 0;
            font-style: italic;
            font-weight: 500;
        }
    }

    .num {
        font-family: var(--font-brush);
        font-size: clamp(2.6rem, 6vw, 3.6rem);
        line-height: 1;
        color: var(--blood);
    }

    .meta {
        margin: var(--space-xs) 0 0;
        font-style: italic;
        color: var(--ink-soft);
    }

    .parts {
        list-style: none;
        margin: 0;
        padding: 0;
        border-top: 1px solid color-mix(in srgb, var(--ink) 15%, transparent);

        li {
            border-bottom: 1px solid color-mix(in srgb, var(--ink) 10%, transparent);
        }

        a {
            display: grid;
            grid-template-columns: 2.5rem 1fr auto;
            gap: var(--space-md);
            align-items: baseline;
            padding: var(--space-sm) var(--space-sm);
            text-decoration: none;

            &:hover .part,
            &:hover time {
                color: var(--seal-text);
            }
        }
    }

    .part {
        font-family: var(--font-serif);
        font-style: italic;
        color: var(--blood);
        transition: color 0.2s;
    }

    .title {
        font-family: var(--font-serif);
        font-size: var(--font-xl);
        line-height: 1.25;
    }

    time {
        font-size: var(--font-sm);
        font-style: italic;
        color: var(--ink-soft);
        white-space: nowrap;
        transition: color 0.2s;
    }

    .desc {
        margin: calc(-1 * var(--space-xs)) 0 var(--space-sm) calc(2.5rem + var(--space-md) + var(--space-sm));
        font-style: italic;
        color: var(--ink-soft);
    }

    .rss {
        margin-top: var(--space-xl);
    }

    @media (width < 600px) {
        .parts a {
            grid-template-columns: 1.8rem 1fr;
            gap: 0 var(--space-sm);
            padding-inline: 0;
        }

        time {
            grid-column: 2;
        }

        .desc {
            margin-left: calc(1.8rem + var(--space-sm));
        }
    }
</style>
