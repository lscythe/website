<script lang="ts">
    import Seo from "$lib/components/Seo.svelte";

    const cfPolicy =
        "https://developers.cloudflare.com/fundamentals/reference/policies-compliances/cloudflare-cookies/";
</script>

<Seo title="Privacy policy" />

<div class="container folio">
    <div class="folio-mark" aria-hidden="true">戒律</div>
    <div>
        <span class="eyebrow">the precepts</span>
        <h1>Site information</h1>
        <hr />
        <dl>
            <dt>Owner</dt>
            <dd>Rendra Prasetia</dd>
            <dt>Site URI</dt>
            <dd>https://lscythe.dev</dd>
        </dl>
        <p>
            This website does not collect any personally identifiable information. It is hosted and
            served via Cloudflare Workers. Cloudflare may collect end-user IP addresses and basic
            request metadata (such as browser type or country) for security, analytics, and
            performance optimization purposes.
        </p>
        <p>
            The weather painted across the site is Jakarta's current weather from
            <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">Open-Meteo</a>. It is
            fetched by this site's own server every ten minutes, so your browser never contacts Open-Meteo and
            nothing about you is sent to it.
        </p>
        <p>
            <a href={cfPolicy} target="_blank" rel="noopener noreferrer">read more on cloudflare</a>
        </p>
    </div>
</div>

<style>
    dl {
        display: grid;
        grid-template-columns: max-content 1fr;
        gap: var(--space-xs) var(--space-lg);
        margin: var(--space-lg) 0;
    }

    dt {
        color: var(--blood);
    }

    dd {
        margin: 0;
    }
</style>
