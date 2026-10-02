<script lang="ts">
    let { status = 404, message = "" }: { status?: number; message?: string } = $props();
</script>

<div class="container deviation">
    <div class="glyphs" aria-hidden="true">
        <span>走</span><span>火</span><span>入</span><span>魔</span>
    </div>
    <div>
        <span class="eyebrow">qi deviation · {status}</span>
        <h1>You strayed from the path.</h1>
        <p>
            {message || "The meridians you followed lead nowhere. This page does not exist, or it was destroyed in a past life."}
        </p>
        <p><a href="/">return to the mountain gate</a></p>
    </div>
</div>

<style>
    .deviation {
        display: grid;
        grid-template-columns: auto 1fr;
        gap: var(--space-xl);
        align-items: center;
        min-height: 80svh;
    }

    .glyphs {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        font-family: var(--font-brush);
        font-size: clamp(4rem, 13vw, 10rem);
        line-height: 1;
        writing-mode: vertical-rl;

        span:last-child {
            color: var(--blood);
            animation: tremble 0.18s steps(2) infinite;
        }
    }

    @keyframes tremble {
        50% {
            transform: translate(2px, -1px) rotate(1deg);
            text-shadow: -3px 0 var(--ink-faint);
        }
    }

    @media (width < 700px) {
        .deviation {
            grid-template-columns: 1fr;
        }
    }

    @media (prefers-reduced-motion: reduce) {
        .glyphs span:last-child {
            animation: none;
        }
    }
</style>
