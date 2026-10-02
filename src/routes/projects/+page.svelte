<script lang="ts">
    import Seo from "$lib/components/Seo.svelte";
    import GoBoard from "$lib/components/GoBoard.svelte";

    let { data } = $props();
</script>

<Seo title="Projects" />

<div class="container folio">
    <div class="folio-mark" aria-hidden="true">残局</div>
    <div>
        <span class="eyebrow">an unfinished game</span>
        <h1>Projects? This website is!</h1>
        <p>
            I actually discard a lot of side projects because of the inadequate effort i put, but
            this time, its <i>different.</i>
        </p>
        <p>Expect more projects here sooner or later...</p>

        <GoBoard seed={data.seed} />
        <p class="caption">
            Every stone is a project I started. Place one of yours; something on the other side
            will answer.
        </p>
    </div>
</div>

<style>
    .caption {
        margin: var(--space-lg) auto 0;
        text-align: center;
        font-family: var(--font-serif);
        font-style: italic;
        font-size: var(--font-lg);
        color: var(--ink-soft);
    }
</style>
