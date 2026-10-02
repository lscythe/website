<script lang="ts">
    import { page } from "$app/state";
    import Seo from "$lib/components/Seo.svelte";
    import Deviation from "$lib/components/Deviation.svelte";
</script>

<Seo title={String(page.status)} />
<Deviation status={page.status} message={page.status === 404 ? "" : page.error?.message} />
