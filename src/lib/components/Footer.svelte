<script lang="ts">
    import { onMount } from "svelte";

    const inceptionYear = 2025;
    const commitHash = import.meta.env.VITE_GIT_COMMIT ?? "dev";
    const gitUrl = `https://git.lscythe.dev/lscythe/website/commit/${commitHash}`;

    let years = $state(`${inceptionYear}`);
    let theme = $state("system");

    onMount(() => {
        const current = new Date().getFullYear();
        if (current > inceptionYear) years = `${inceptionYear} - ${current}`;
        theme = localStorage.getItem("theme") || "system";
    });

    function setTheme() {
        document.documentElement.setAttribute("theme", theme);
        localStorage.setItem("theme", theme);
    }
</script>

<footer>
    <div class="brush" aria-hidden="true">一剑霜寒</div>
    <div class="rows">
        <div class="top">
            <span>&copy; {years}</span>
            <a href="/">lscythe.dev</a>
            <span class="dot">·</span>
            <a href="/privacy-policy">privacy policy</a>
            <span class="dot">·</span>
            <a href="/LICENSE" data-sveltekit-reload>license</a>
            <span class="dot">·</span>
            <a href="/rss.xml" data-sveltekit-reload>rss</a>
        </div>
        <div class="bottom">
            <span>written in ink &amp; blood on commit: <a href={gitUrl}>{commitHash}</a></span>
            <label>
                path [
                <select name="theme" bind:value={theme} onchange={setTheme}>
                    <option value="system">system</option>
                    <option value="dark">魔 night</option>
                    <option value="light">墨 paper</option>
                </select>
                ]
            </label>
            <span class="credit">
                mountains grown after <a href="https://github.com/LingDong-/shan-shui-inf">shan-shui-inf</a>
            </span>
        </div>
    </div>
</footer>

<style>
    footer {
        position: relative;
        display: flex;
        flex-direction: column;
        gap: var(--space-md);
        max-width: var(--max-content-width);
        margin: 0 auto;
        padding: var(--space-xl) var(--space-lg) var(--space-lg);
        font-size: var(--font-sm);
        color: var(--ink-soft);
        overflow: hidden;
    }

    footer::before {
        content: "";
        position: absolute;
        inset: 0 var(--space-lg) auto;
        height: 2px;
        background: linear-gradient(90deg, transparent, var(--blood) 20%, var(--blood) 60%, transparent);
    }

    .brush {
        font-family: var(--font-brush);
        font-size: clamp(3rem, 12vw, 8rem);
        line-height: 1;
        color: var(--ink);
        opacity: 0.08;
        white-space: nowrap;
        user-select: none;
    }

    .rows {
        display: flex;
        flex-direction: column;
        gap: var(--space-sm);
    }

    .top,
    .bottom {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-sm) var(--space-md);
        align-items: center;
    }

    .dot {
        color: var(--blood);
    }

    a {
        color: var(--ink);
    }

    select {
        background: none;
        color: var(--blood);
        border: none;
        padding: 0;
        font-family: inherit;
        font-size: inherit;
        cursor: pointer;
    }

    option {
        background: var(--paper);
        color: var(--ink);
    }
</style>
