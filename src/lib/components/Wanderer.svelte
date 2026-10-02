<svelte:options namespace="svg" />

<script lang="ts">
    // A wandering cultivator in a bamboo hat, cloak and ribbons torn by the wind,
    // a sword across the back. Feet sit at (x, y); the figure faces the sun.
    import type { Pose } from "$lib/ink/world";

    let {
        x,
        y,
        scale = 1.25,
        pose = "stand",
        step = 0,
        umbrella = false,
    }: { x: number; y: number; scale?: number; pose?: Pose; step?: number; umbrella?: boolean } = $props();

    // A red oil-paper umbrella: scalloped canopy, bamboo ribs, crooked handle.
    const ribs = [-24, -12, 0, 12, 24, 36].map((x) => `M6 -100L${x} -78`).join("");

    // Legs swing from the hip; the body bobs with each stride.
    const legs = $derived.by(() => {
        if (pose === "walk") {
            const a = Math.sin(step) * 26;
            return { back: a, front: -a, lift: -Math.abs(Math.cos(step)) * 1.6 };
        }
        if (pose === "jump") return { back: 34, front: -40, lift: -2 };
        if (pose === "crouch") return { back: 20, front: -24, lift: 4 };
        return { back: 11, front: -13, lift: 0 };
    });
    // While waiting the wanderer lifts their head toward the sky.
    const look = $derived(pose === "wait" ? -9 : 0);

    const wind = (a: string, b: string) => `${a};${b};${a}`;
    // Toes point forward (right), the way the wanderer faces and walks.
    const LEG = "M2.8 -31L3.4 -14 4 -1.2 9.6 -0.6 9.6 1.4-3.4 1.4-3.2 -1-1.8 -1.8-2 -14-3.2 -31Z";

    const ribbonA = [
        "M-13 -64C-24 -71-35 -57-52 -66-60 -70-66 -64-74 -67-64 -61-55 -63-46 -60-31 -56-23 -64-13 -62Z",
        "M-13 -64C-25 -66-36 -66-53 -58-61 -54-68 -59-76 -55-66 -52-56 -50-46 -53-31 -59-24 -60-13 -62Z",
    ];
    const ribbonB = [
        "M-11 -63C-19 -63-27 -55-38 -57-44 -58-49 -54-55 -55-47 -51-39 -53-31 -52-23 -51-18 -60-11 -61Z",
        "M-11 -63C-20 -60-28 -61-39 -53-45 -49-50 -52-56 -48-48 -46-40 -46-32 -49-24 -53-18 -59-11 -61Z",
    ];
    const cloak = [
        "M4 -57C-6 -58-14 -52-22 -44-30 -36-40 -30-54 -26L-45 -24-57 -18-44 -17-51 -10-38 -13-41 -5-30 -11-27 -3-20 -13C-14 -24-10 -36-8 -48Z",
        "M4 -57C-6 -58-15 -53-24 -47-33 -41-44 -37-58 -35L-48 -31-60 -27-47 -24-54 -18-40 -19-43 -11-31 -15-27 -6-20 -15C-14 -25-10 -36-8 -48Z",
    ];
    const cloakShadow = [
        "M2 -56C-10 -56-22 -48-34 -40-44 -34-56 -32-68 -33L-58 -28-66 -22-53 -21-58 -14-45 -17-34 -24C-22 -32-12 -42-6 -50Z",
        "M2 -56C-10 -57-23 -51-36 -45-46 -41-58 -40-70 -42L-60 -36-69 -31-55 -29-60 -23-46 -24-35 -29C-23 -36-12 -44-6 -50Z",
    ];
    const sash = [
        "M-8 -36C-14 -35-18 -30-25 -31-21 -28-14 -29-8 -33Z",
        "M-8 -36C-14 -37-19 -34-26 -36-21 -32-14 -31-8 -33Z",
    ];
    const hair = [
        ["M-3 -62C-10 -60-16 -64-25 -60", "M-3 -62C-11 -63-17 -59-26 -62"],
        ["M-3 -60C-12 -57-18 -60-28 -55", "M-3 -60C-12 -59-19 -55-29 -57"],
        ["M-2 -58C-9 -54-14 -55-20 -50", "M-2 -58C-9 -56-15 -52-21 -53"],
    ];
    const tassel = [
        "M12 -70C9 -74 4 -71 0 -75-2 -72 4 -69 11 -68Z",
        "M12 -70C8 -72 3 -73-1 -71 2 -69 6 -68 11 -68Z",
    ];
</script>

<g class="wanderer" transform="translate({x} {y}) scale({scale})">
<g transform="translate(0 {legs.lift})">
    <!-- Behind the body: wash-toned underlayer of the cloak, ribbons, hair. -->
    <path class="shade" d={cloakShadow[0]}>
        <animate attributeName="d" dur="3.8s" repeatCount="indefinite" values={wind(cloakShadow[0], cloakShadow[1])} />
    </path>
    <path class="blood" d={ribbonA[0]}>
        <animate attributeName="d" dur="2.4s" repeatCount="indefinite" values={wind(ribbonA[0], ribbonA[1])} />
    </path>
    <path class="blood deep" d={ribbonB[0]}>
        <animate attributeName="d" dur="2s" begin="-0.7s" repeatCount="indefinite" values={wind(ribbonB[0], ribbonB[1])} />
    </path>
    {#each hair as strand, i}
        <path class="strand" d={strand[0]}>
            <animate attributeName="d" dur="{2.2 + i * 0.3}s" repeatCount="indefinite" values={wind(strand[0], strand[1])} />
        </path>
    {/each}
    <path class="figure" d={cloak[0]}>
        <animate attributeName="d" dur="3.2s" repeatCount="indefinite" values={wind(cloak[0], cloak[1])} />
    </path>

    <!-- Sword across the back, hilt over the right shoulder. -->
    <path class="blade" d="M-13 -27L10 -64" />
    <path class="figure" d="M8.4 -61.6L13.4 -70.2 15 -69.3 10 -60.7ZM5.9 -63.6L12.3 -59.6 11.6 -58.4 5.2 -62.4Z" />
    <path class="blood" d={tassel[0]}>
        <animate attributeName="d" dur="1.8s" repeatCount="indefinite" values={wind(tassel[0], tassel[1])} />
    </path>

    <!-- Legs and boots, each pivoting at the hip. -->
    <g transform="translate(-2.5 0) rotate({legs.back} 0 -30)">
        <path class="figure" d={LEG} />
    </g>
    <g transform="translate(2.5 0) rotate({legs.front} 0 -30)">
        <path class="figure" d={LEG} />
    </g>
    <!-- Robe, split skirt flaring in the wind. -->
    <path class="figure" d="M-9 -55C-10 -48-9 -42-8 -36L-13 -19-4 -23 0 -29 5 -22 13 -18 8 -36C9 -42 10 -48 9 -55Q0 -59-9 -55Z" />
    <path class="blood" d="M-8.6 -38.5L8.6 -38.5 8.3 -34.6-8.3 -34.6Z" />
    <path class="blood" d={sash[0]}>
        <animate attributeName="d" dur="2.6s" repeatCount="indefinite" values={wind(sash[0], sash[1])} />
    </path>
    <!-- Front sleeve, hand resting near the belt. -->
    <path class="figure" d="M5 -55C12 -52 15 -45 14 -38L9.5 -35.5C10 -41 9 -47 4 -50Z" />
    <!-- Fold lines catching the light. -->
    <path class="fold" d="M-4 -50C-8 -44-12 -38-18 -30M0 -52C-4 -46-6 -40-6 -36M2 -32C3 -28 4 -25 6 -22M10 -50C12 -46 12 -42 11 -39" />

    <!-- Head under a wide bamboo hat (douli). -->
    <g class="head" transform="rotate({look} 1 -58)">
    <circle class="figure" cx="1" cy="-61" r="4.3" />
    <path class="figure" d="M-22 -62.6Q-10 -66.6 1 -73.2Q12 -66.6 24 -61.8Q12 -63.6 1 -63.4Q-10 -63.8-22 -62.6Z" />
    <path class="figure" d="M-1.6 -72L1 -77.2 3.6 -72Z" />
    <path class="rim" d="M-20 -62.9Q-9 -64.2 1 -64.2Q12 -64 22 -62.2" />
    <path class="rim" d="M-12 -65.6Q-4 -69 1 -71.6" />
    </g>
    {#if umbrella}
        <g class="umbrella" transform="rotate(10 12 -38)">
            <path class="shaft" d="M12 -38L6 -100M12 -38Q13 -33 9.5 -33" />
            <path class="canopy" d="M-29 -78Q6 -116 41 -78Q36 -82 30 -77Q24 -82 18 -77Q12 -82 6 -77Q0 -82-6 -77Q-12 -82-18 -77Q-24 -82-29 -78Z" />
            <path class="ribs" d={ribs} />
            <circle class="figure" cx="6" cy="-101" r="1.6" />
        </g>
    {/if}
</g>
</g>

<style>
    /* A thin rim light so the figure reads at night. Drawn as a stroke under
       each shape (paint-order) rather than a drop-shadow filter, which would
       re-run on every frame of the walk. */
    .figure {
        fill: var(--figure);
        stroke: var(--figure-edge);
        stroke-width: 0.9;
        paint-order: stroke;
        stroke-linejoin: round;
    }

    .head {
        transition: transform 0.6s ease;
    }

    .shade {
        fill: var(--wash);
        opacity: 0.55;
    }

    .blood {
        fill: var(--blood);
    }

    .deep {
        fill: var(--blood-deep);
    }

    .strand {
        fill: none;
        stroke: var(--figure);
        stroke-width: 0.9;
        stroke-linecap: round;
    }

    .blade {
        fill: none;
        stroke: var(--figure);
        stroke-width: 1.3;
    }

    .canopy {
        fill: var(--blood);
        stroke: var(--figure);
        stroke-width: 0.8;
        stroke-linejoin: round;
    }

    .ribs {
        fill: none;
        stroke: var(--blood-deep);
        stroke-width: 0.7;
    }

    .shaft {
        fill: none;
        stroke: var(--figure);
        stroke-width: 1.3;
        stroke-linecap: round;
    }

    .fold,
    .rim {
        fill: none;
        stroke: var(--figure-light);
        stroke-width: 0.5;
        stroke-linecap: round;
    }
</style>
