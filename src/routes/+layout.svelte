<script lang="ts">
    import "@fontsource/eb-garamond/400.css";
    import "@fontsource/eb-garamond/400-italic.css";
    import "@fontsource/eb-garamond/600.css";
    import "@fontsource/cormorant-garamond/400.css";
    import "@fontsource/cormorant-garamond/600.css";
    import "@fontsource/cormorant-garamond/400-italic.css";
    import "@fontsource/cormorant-garamond/500-italic.css";
    import "@fontsource/ma-shan-zheng/400.css";
    import "$lib/styles/global.css";
    import Nav from "$lib/components/Nav.svelte";
    import Footer from "$lib/components/Footer.svelte";
    import InkTrail from "$lib/components/InkTrail.svelte";

    let { children } = $props();
</script>

<a class="skip" href="#main">skip to content</a>
<Nav />
<main id="main">
    {@render children()}
</main>
<Footer />
<InkTrail />

<style>
    main {
        min-height: 70svh;
    }

    .skip {
        position: absolute;
        left: -999px;
        z-index: 100;

        &:focus {
            left: var(--space-md);
            top: var(--space-md);
        }
    }
</style>
