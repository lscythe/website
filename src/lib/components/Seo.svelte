<script lang="ts">
    import { page } from "$app/state";
    import { SITE_DESCRIPTION, SITE_TAGLINE, SITE_TITLE, SITE_URL } from "$lib/site";

    // Pages pass their own name ("About"); the home page passes nothing.
    let {
        title,
        description = SITE_DESCRIPTION,
        image = "/og.jpg",
    }: { title?: string; description?: string; image?: string } = $props();

    const fullTitle = $derived(title ? `${title} · ${SITE_TITLE}` : `${SITE_TITLE} · ${SITE_TAGLINE}`);

    const canonical = $derived(new URL(page.url.pathname, SITE_URL).href);
    const imageUrl = $derived(new URL(image, SITE_URL).href);
</script>

<svelte:head>
    <title>{fullTitle}</title>
    <link rel="canonical" href={canonical} />
    <meta name="title" content={fullTitle} />
    <meta name="description" content={description} />

    <meta property="og:type" content="website" />
    <meta property="og:url" content={canonical} />
    <meta property="og:title" content={fullTitle} />
    <meta property="og:description" content={description} />
    <meta property="og:image" content={imageUrl} />
    {#if image === "/og.jpg"}
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
    {/if}

    <meta property="twitter:card" content="summary_large_image" />
    <meta property="twitter:url" content={canonical} />
    <meta property="twitter:title" content={fullTitle} />
    <meta property="twitter:description" content={description} />
    <meta property="twitter:image" content={imageUrl} />

    <link rel="alternate" type="application/rss+xml" title={SITE_TITLE} href="{SITE_URL}/rss.xml" />
</svelte:head>
