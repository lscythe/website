<script lang="ts">
    let { children } = $props();
</script>

<!-- Side-by-side code, used to compare files. Stacks on narrow screens. -->
<div class="panels">{@render children()}</div>

<style>
    .panels {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(min(100%, 18rem), 1fr));
        gap: var(--space-md);
        margin: var(--space-lg) 0;

        :global(pre) {
            margin: 0;
            height: 100%;
        }
    }
</style>
