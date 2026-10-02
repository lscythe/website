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
        /* Mermaid's hand-drawn hatching becomes faint dry-brush shading. */
        --d-bg: color-mix(in srgb, var(--ink) 9%, var(--paper-raised));
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
        --d-font: var(--font-body);

        position: relative;
        isolation: isolate;
        margin: var(--space-lg) 0;
        padding: var(--space-lg) var(--space-md);
        overflow-x: auto;
        background: var(--paper-raised);

        /* A splash of red ink bleeding into the corner of the sheet. */
        &::before {
            content: "";
            position: absolute;
            top: -3rem;
            right: -3rem;
            width: 14rem;
            height: 14rem;
            z-index: -1;
            background: var(--blood);
            opacity: 0.1;
            mask: url("/ink/splash-3.svg") no-repeat center / contain;
            pointer-events: none;
        }

        /* Brushed edges: everything drawn passes through a wobble filter. */
        :global(.rough-node path),
        :global(.cluster path),
        :global(.flowchart-link),
        :global(.arrowMarkerPath),
        :global(.plot path),
        :global(.axis-line),
        :global(.axisl-line) {
            filter: url(#diagram-ink);
        }

        :global(.rough-node path:last-child),
        :global(.cluster path:last-child) {
            stroke-width: 2.2px !important;
            stroke-linejoin: round;
        }

        :global(.flowchart-link) {
            stroke-width: 1.8px !important;
            stroke-linecap: round;
        }

        :global(.plot path) {
            stroke-width: 4px !important;
            stroke-linecap: round;
            stroke-linejoin: round;
        }

        :global(.nodeLabel),
        :global(.label) {
            font-family: var(--font-body) !important;
            font-size: 16.5px !important;
        }

        /* Charts sit directly on the sheet rather than on their own box. */
        :global(.background) {
            fill: transparent !important;
        }

        :global(.chart-title text),
        :global(.title text) {
            font-family: var(--font-serif) !important;
            font-style: italic;
            font-weight: 600;
        }

        :global(svg) {
            display: block;
            min-width: 520px;
            max-width: 100%;
            height: auto;
            margin: 0 auto;
        }
    }
</style>
