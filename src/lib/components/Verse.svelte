<script lang="ts">
    let { text, author }: { text: string; author: string } = $props();
</script>

<figure>
    <span class="mark" aria-hidden="true">「</span>
    <blockquote>{text}</blockquote>
    <figcaption>
        <span class="seal" aria-hidden="true">言</span>
        {author}
    </figcaption>
</figure>

<style>
    figure {
        position: relative;
        margin: 0;
        padding: var(--space-lg) 0 var(--space-lg) clamp(1.5rem, 6vw, 5rem);
        border-left: 2px solid var(--blood);
    }

    .mark {
        position: absolute;
        top: -0.2em;
        left: -0.1em;
        font-family: var(--font-brush);
        font-size: clamp(5rem, 14vw, 10rem);
        line-height: 1;
        color: var(--blood);
        opacity: 0.18;
    }

    blockquote {
        margin: 0;
        font-family: var(--font-serif);
        font-style: italic;
        font-size: clamp(1.6rem, 3.6vw, 2.8rem);
        line-height: 1.2;
        max-width: 30ch;
    }

    figcaption {
        display: flex;
        align-items: center;
        gap: var(--space-sm);
        margin-top: var(--space-lg);
        font-size: var(--font-sm);
        letter-spacing: 0.2em;
        text-transform: uppercase;
        color: var(--ink-soft);
    }

    .seal {
        display: inline-grid;
        place-items: center;
        width: 1.9rem;
        height: 1.9rem;
        background: var(--blood);
        color: var(--seal-text);
        font-family: var(--font-brush);
        font-size: 1.2rem;
        letter-spacing: 0;
        border-radius: 3px;
    }
</style>
