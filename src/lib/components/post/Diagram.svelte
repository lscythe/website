<script lang="ts">
    // A Mermaid diagram saved as SVG; its colours are CSS variables mapped below,
    // so it follows the paper / night theme.
    let { svg, label }: { svg: string; label: string } = $props();
</script>

<figure class="diagram" role="img" aria-label={label}>
    {@html svg}
</figure>

<style>
    .diagram {
        --d-bg: var(--paper-raised);
        --d-bg-soft: color-mix(in srgb, var(--paper-raised) 50%, transparent);
        --d-surface: color-mix(in srgb, var(--ink) 28%, var(--paper));
        --d-text: var(--ink);
        --d-sub: var(--ink-soft);
        /* Muted greys for borders, axes and de-emphasised nodes: lighter than
           the page's --ink-faint so they stay legible on the night background. */
        --d-line: light-dark(#6f665e, #9a9087);
        --d-red: var(--blood);
        --d-yellow: var(--string);
        --d-blue: light-dark(#2f5d7c, #8fb3d9);
        --d-mauve: light-dark(#6b4a8a, #c3a6e6);
        --d-green: light-dark(#3f6b3a, #9fcf98);
        --d-teal: light-dark(#2f6f68, #8ccfc3);
        --d-font: ui-monospace, "SF Mono", Menlo, Consolas, monospace;

        margin: var(--space-lg) 0;
        padding: var(--space-md);
        overflow-x: auto;
        background: var(--paper-raised);
        border-left: 3px solid var(--blood);

        :global(svg) {
            display: block;
            min-width: 520px;
            max-width: 100%;
            height: auto;
            margin: 0 auto;
        }
    }
</style>
