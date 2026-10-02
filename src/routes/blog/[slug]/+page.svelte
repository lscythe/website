<script lang="ts">
    import Seo from "$lib/components/Seo.svelte";

    let { data } = $props();
    const Content = $derived(data.content);
</script>

<Seo title={data.meta.title} description={data.meta.description} image={data.meta.heroImage} />

<article class="container">
    <header>
        <span class="eyebrow">
            <time datetime={data.meta.pubDate}>{new Date(data.meta.pubDate).toDateString()}</time>
            {#each data.meta.tag ?? [] as tag}<span class="tag">#{tag}</span>{/each}
        </span>
        <h1>{data.meta.title}</h1>
        <p class="lede">{data.meta.description}</p>
    </header>
    <div class="prose">
        <Content />
    </div>
</article>

<style>
    header {
        margin-bottom: var(--space-xl);
    }

    .tag {
        margin-left: var(--space-md);
        color: var(--blood);
    }

    .lede {
        font-family: var(--font-serif);
        font-style: italic;
        font-size: var(--font-xl);
        color: var(--ink-soft);
    }

    .prose {
        max-width: 72ch;

        :global(pre) {
            padding: var(--space-md);
            overflow-x: auto;
            background: var(--paper-raised);
            border-left: 3px solid var(--blood);
        }

        :global(blockquote) {
            margin-left: 0;
            padding-left: var(--space-md);
            border-left: 2px solid var(--blood);
            font-family: var(--font-serif);
            font-style: italic;
            font-size: var(--font-xl);
        }

        :global(img) {
            max-width: 100%;
            height: auto;
        }
    }
</style>
