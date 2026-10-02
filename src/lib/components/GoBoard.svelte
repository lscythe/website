<script lang="ts">
    import { createRand } from "$lib/ink/random";

    const SIZE = 19;
    const GAP = 20;
    const PAD = 10;
    const STAR = [3, 9, 15];

    type Stone = { x: number; y: number; side: "you" | "demon"; fresh?: boolean };

    let { seed }: { seed: number } = $props();

    // An unfinished game, laid out the same way for a given seed.
    function opening(seed: number): Stone[] {
        const rand = createRand(seed);
        const stones: Stone[] = [];
        for (let i = 0; i < 26; i++) {
            const x = Math.floor(rand() * SIZE);
            const y = Math.floor(rand() * SIZE);
            if (!stones.some((s) => s.x === x && s.y === y))
                stones.push({ x, y, side: i % 2 ? "demon" : "you" });
        }
        return stones;
    }

    // svelte-ignore state_referenced_locally
    let stones = $state<Stone[]>(opening(seed));
    let thinking = $state(false);

    const taken = (x: number, y: number) => stones.some((s) => s.x === x && s.y === y);
    const at = (i: number) => PAD + i * GAP;

    function place(x: number, y: number) {
        if (thinking || taken(x, y)) return;
        stones.push({ x, y, side: "you", fresh: true });
        thinking = true;

        // The demon answers close by, pressing against your stone.
        setTimeout(() => {
            const near: [number, number][] = [];
            for (let r = 1; r < SIZE && near.length === 0; r++) {
                for (let dx = -r; dx <= r; dx++) {
                    for (let dy = -r; dy <= r; dy++) {
                        const nx = x + dx;
                        const ny = y + dy;
                        if (nx >= 0 && ny >= 0 && nx < SIZE && ny < SIZE && !taken(nx, ny)) near.push([nx, ny]);
                    }
                }
            }
            if (near.length) {
                const [nx, ny] = near[Math.floor(Math.random() * near.length)];
                stones.push({ x: nx, y: ny, side: "demon", fresh: true });
            }
            thinking = false;
        }, 450);
    }
</script>

<div class="table">
    <svg
        class="board"
        viewBox="0 0 {PAD * 2 + GAP * (SIZE - 1)} {PAD * 2 + GAP * (SIZE - 1)}"
        role="img"
        aria-label="A Go board with an unfinished game. Click an intersection to place a stone."
    >
        {#each { length: SIZE } as _, i}
            <line x1={at(0)} y1={at(i)} x2={at(SIZE - 1)} y2={at(i)} />
            <line x1={at(i)} y1={at(0)} x2={at(i)} y2={at(SIZE - 1)} />
        {/each}
        {#each STAR as sx}
            {#each STAR as sy}
                <circle class="star" cx={at(sx)} cy={at(sy)} r="2" />
            {/each}
        {/each}

        {#each stones as stone (stone.x * SIZE + stone.y)}
            <g class="stone {stone.side}" class:fresh={stone.fresh} transform="translate({at(stone.x)} {at(stone.y)})">
                <ellipse rx="8.6" ry="7.6" transform="rotate({(stone.x * 37 + stone.y * 11) % 180})" />
            </g>
        {/each}

        {#each { length: SIZE } as _, x}
            {#each { length: SIZE } as _, y}
                <rect
                    class="hit"
                    x={at(x) - GAP / 2}
                    y={at(y) - GAP / 2}
                    width={GAP}
                    height={GAP}
                    onclick={() => place(x, y)}
                    role="presentation"
                />
            {/each}
        {/each}
    </svg>
</div>

<style>
    .table {
        perspective: 1100px;
        margin-top: -6rem;
        overflow: hidden;
    }

    .board {
        display: block;
        width: min(100%, 640px);
        margin: 0 auto;
        transform: rotateX(48deg) rotateZ(-10deg);
        transform-origin: 50% 60%;
        background:
            radial-gradient(circle at 40% 30%, color-mix(in srgb, var(--blood) 14%, transparent), transparent 60%),
            var(--paper-raised);
        box-shadow:
            0 40px 60px -20px rgb(0 0 0 / 0.5),
            0 0 0 1px color-mix(in srgb, var(--ink) 20%, transparent);
        transition: transform 0.8s cubic-bezier(0.7, 0, 0.2, 1);

        &:hover {
            transform: rotateX(36deg) rotateZ(-6deg);
        }
    }

    line {
        stroke: var(--ink);
        stroke-width: 0.7;
        opacity: 0.55;
    }

    .star {
        fill: var(--ink);
        opacity: 0.7;
    }

    .stone.you ellipse {
        fill: var(--ink);
        filter: drop-shadow(0 0 3px color-mix(in srgb, var(--ink) 60%, transparent));
    }

    .stone.demon ellipse {
        fill: var(--blood);
        filter: drop-shadow(0 0 4px var(--glow));
    }

    .stone {
        transform-box: fill-box;
        transform-origin: center;
    }

    .stone.fresh {
        animation: land 0.5s cubic-bezier(0.2, 1.6, 0.4, 1) both;
    }

    .hit {
        fill: transparent;
        cursor: crosshair;

        &:hover {
            fill: color-mix(in srgb, var(--blood) 25%, transparent);
        }
    }

    @keyframes land {
        from {
            opacity: 0;
            scale: 2.2;
        }
    }

    @media (prefers-reduced-motion: reduce) {
        .stone.fresh {
            animation: none;
        }

        .board {
            transition: none;
        }
    }
</style>
