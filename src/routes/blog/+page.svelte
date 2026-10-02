<script lang="ts">
    import Seo from "$lib/components/Seo.svelte";
    import { NUMERALS } from "$lib/site";

    let { data } = $props();

    const fmt = (d: string) =>
        new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
</script>

<Seo title="blog" />

<div class="container folio">
    <div class="folio-mark" aria-hidden="true">手记</div>
    <div>
        <span class="eyebrow">scrolls &amp; notes</span>
        {#if data.posts.length === 0}
            <h1>Hey, I'm working on it alright.</h1>
            <p>Sometimes i write down my thoughts and experience on various topics.</p>
            <div class="empty" aria-hidden="true">
                <span>墨</span>
                <span>未</span>
                <span>干</span>
            </div>
            <p class="hint">The ink is not yet dry.</p>
        {:else}
            <h1>Sometimes i write down my thoughts.</h1>
            <ol class="posts">
                {#each data.posts as post, i}
                    <li>
                        <a href="/blog/{post.slug}">
                            <span class="index">{NUMERALS[i] ?? i + 1}</span>
                            <span class="title">{post.title}</span>
                            <time datetime={post.pubDate}>{fmt(post.pubDate)}</time>
                        </a>
                        <p>{post.description}</p>
                    </li>
                {/each}
            </ol>
        {/if}
        <p>You can also view my posts via <a href="/rss.xml" data-sveltekit-reload>RSS</a></p>
    </div>
</div>

<style>
    .empty {
        display: flex;
        gap: var(--space-md);
        margin: var(--space-xl) 0 var(--space-sm);
        font-family: var(--font-brush);
        font-size: clamp(4rem, 14vw, 9rem);
        line-height: 1;

        span {
            opacity: 0.12;
            animation: dry 6s ease-in-out infinite;
        }

        span:nth-child(2) {
            animation-delay: 0.6s;
        }

        span:nth-child(3) {
            color: var(--blood);
            opacity: 0.6;
            animation-delay: 1.2s;
        }
    }

    .hint {
        font-family: var(--font-serif);
        font-style: italic;
        color: var(--ink-soft);
    }

    @keyframes dry {
        50% {
            filter: blur(2px);
            transform: translateY(4px);
        }
    }

    .posts {
        list-style: none;
        padding: 0;

        li {
            padding: var(--space-md) 0;
            border-top: 1px solid color-mix(in srgb, var(--ink) 12%, transparent);
        }

        a {
            display: grid;
            grid-template-columns: 3rem 1fr auto;
            align-items: baseline;
            gap: var(--space-sm);
            text-decoration: none;
        }

        p {
            margin: var(--space-xs) 0 0 3.5rem;
            color: var(--ink-soft);
        }
    }

    .index {
        font-family: var(--font-brush);
        color: var(--blood);
        font-size: var(--font-xl);
    }

    .title {
        font-family: var(--font-serif);
        font-size: var(--font-2xl);
    }

    time {
        font-size: var(--font-sm);
        color: var(--ink-soft);
    }

    @media (prefers-reduced-motion: reduce) {
        .empty span {
            animation: none;
        }
    }
</style>
