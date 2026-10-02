<script lang="ts">
    import { page } from "$app/state";
    import { SITE_DESCRIPTION, SITE_TITLE, SITE_URL } from "$lib/site";

    let {
        title,
        description = SITE_DESCRIPTION,
        image = "/og.jpg",
    }: { title: string; description?: string; image?: string } = $props();

    const canonical = $derived(new URL(page.url.pathname, SITE_URL).href);
    const imageUrl = $derived(new URL(image, SITE_URL).href);
</script>

<svelte:head>
    <title>{title}</title>
    <link rel="canonical" href={canonical} />
    <meta name="title" content={title} />
    <meta name="description" content={description} />

    <meta property="og:type" content="website" />
    <meta property="og:url" content={canonical} />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:image" content={imageUrl} />

    <meta property="twitter:card" content="summary_large_image" />
    <meta property="twitter:url" content={canonical} />
    <meta property="twitter:title" content={title} />
    <meta property="twitter:description" content={description} />
    <meta property="twitter:image" content={imageUrl} />

    <link rel="alternate" type="application/rss+xml" title={SITE_TITLE} href="{SITE_URL}/rss.xml" />
</svelte:head>
