<script lang="ts">
    import { page } from "$app/state";
    import { NAV_LINKS } from "$lib/site";

    let hidden = $state(false);
    let atTop = $state(true);
    let menu: HTMLElement | undefined = $state();
    let lastY = 0;

    const current = (href: string) => page.url.pathname.startsWith(href);

    function onScroll() {
        const y = window.scrollY;
        if (Math.abs(y - lastY) > 3) hidden = y > lastY && y > 80;
        atTop = y < 40;
        lastY = Math.max(0, y);
        menu?.hidePopover();
    }
</script>

<svelte:window onscroll={onScroll} />

<header class:hidden class:at-top={atTop}>
    <a href="/" class="mark" aria-label="lscythe, home">
        <span class="seal" aria-hidden="true">镰</span>
        <span class="word">lscythe</span>
    </a>

    <button popovertarget="nav-mobile" title="menu" aria-label="toggle navigation">
        <span aria-hidden="true">道</span>
    </button>
    <nav popover id="nav-mobile" bind:this={menu}>
        {#each NAV_LINKS as link}
            <a href={link.href} aria-current={current(link.href) ? "page" : undefined}>
                <span class="glyph" aria-hidden="true">{link.glyph}</span>{link.label}
            </a>
        {/each}
    </nav>

    <nav class="desktop">
        {#each NAV_LINKS as link}
            <a href={link.href} aria-current={current(link.href) ? "page" : undefined}>
                <span class="glyph" aria-hidden="true">{link.glyph}</span>
                <span>{link.label}</span>
            </a>
        {/each}
    </nav>
</header>

<style>
    header {
        position: fixed;
        inset: 0 0 auto;
        z-index: 40;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--space-md) var(--space-lg);
        background: color-mix(in srgb, var(--paper) 82%, transparent);
        backdrop-filter: blur(6px);
        border-bottom: 1px solid color-mix(in srgb, var(--ink) 14%, transparent);
        transition:
            transform 0.35s cubic-bezier(0.7, 0, 0.2, 1),
            background 0.3s,
            border-color 0.3s;

        &.hidden {
            transform: translateY(-100%);
        }

        &.at-top {
            background: transparent;
            backdrop-filter: none;
            border-color: transparent;
        }
    }

    a {
        background: none;
        text-decoration: none;

        &:hover {
            color: var(--blood);
        }
    }

    .mark {
        display: flex;
        align-items: center;
        gap: var(--space-sm);

        &:hover {
            color: var(--ink);
        }

        &:hover .seal {
            transform: rotate(-8deg);
        }
    }

    .seal {
        display: grid;
        place-items: center;
        width: 1.9rem;
        height: 1.9rem;
        background: var(--blood);
        color: var(--seal-text);
        font-family: var(--font-brush);
        font-size: 1.3rem;
        line-height: 1;
        border-radius: 3px;
        transform: rotate(3deg);
        transition: transform 0.3s;
    }

    .word {
        font-family: var(--font-serif);
        font-size: var(--font-xl);
        font-style: italic;
        font-weight: 600;
    }

    .glyph {
        font-family: var(--font-brush);
        color: var(--blood);
        margin-right: 0.35em;
        font-size: 1.15em;
    }

    .desktop {
        display: none;
        gap: var(--space-lg);
        font-family: var(--font-serif);
        font-size: var(--font-lg);
        font-style: italic;

        a[aria-current="page"] {
            color: var(--blood);
        }
    }

    button {
        all: unset;
        cursor: pointer;
        font-family: var(--font-brush);
        font-size: var(--font-xl);
        line-height: 1;
        width: 2.2rem;
        height: 2.2rem;
        display: grid;
        place-items: center;
        background: var(--blood);
        color: var(--seal-text);
        border-radius: 3px;
        transform: rotate(-4deg);
    }

    #nav-mobile:popover-open {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: var(--space-md);
        inset: 4rem 0 auto auto;
        margin: 0;
        padding: var(--space-lg);
        width: 100%;
        background: var(--paper);
        color: var(--ink);
        border: none;
        border-bottom: 2px solid var(--blood);
        font-size: var(--font-lg);
    }

    @media (width < 768px) {
        header {
            padding: var(--space-sm) var(--space-md);
        }
    }

    @media (width >= 768px) {
        button,
        #nav-mobile {
            display: none;
        }

        .desktop {
            display: flex;
        }
    }
</style>
