<script lang="ts">
    let { items }: { items: { value: string; label: string }[] } = $props();
</script>

<dl class="stats">
    {#each items as item}
        <div>
            <dt>{item.label}</dt>
            <dd>{item.value}</dd>
        </div>
    {/each}
</dl>

<style>
    .stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr));
        gap: var(--space-sm);
        margin: var(--space-lg) 0;

        div {
            display: flex;
            flex-direction: column-reverse;
            padding: var(--space-md);
            background: var(--paper-raised);
            border-top: 2px solid var(--blood);
        }
    }

    dd {
        margin: 0;
        font-family: var(--font-serif);
        font-size: clamp(2rem, 5vw, 2.8rem);
        font-weight: 600;
        line-height: 1;
        color: var(--blood);
    }

    dt {
        margin-top: var(--space-xs);
        font-size: var(--font-sm);
        font-style: italic;
        color: var(--ink-soft);
    }
</style>
