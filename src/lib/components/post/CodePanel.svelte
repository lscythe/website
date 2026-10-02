<script lang="ts">
    let { label, children }: { label: string; children: import("svelte").Snippet } = $props();
</script>

<div class="panel">
    <span class="label">{label}</span>
    {@render children()}
</div>

<style>
    .panel {
        display: flex;
        flex-direction: column;
        min-width: 0;
    }

    .label {
        align-self: flex-start;
        padding: 0.1em 0.6em;
        font-size: var(--font-sm);
        font-style: italic;
        color: var(--seal-text);
        background: var(--blood);
    }
</style>
