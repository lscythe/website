<script lang="ts">
    import Seo from "$lib/components/Seo.svelte";
    import { EXPERIENCE, EXPERIENCE_INTRO } from "$lib/experience";
    import { NUMERALS } from "$lib/site";

    // Split on `backticks` so recovered text can carry inline code safely.
    const parts = (text: string) =>
        text.split("`").map((value, i) => ({ value, code: i % 2 === 1 }));
</script>

<Seo title="Experience" description="Professional experience and selected projects" />

{#snippet rich(text: string)}
    {#each parts(text) as part}{#if part.code}<code>{part.value}</code>{:else}{part.value}{/if}{/each}
{/snippet}

<div class="container folio">
    <div class="folio-mark" aria-hidden="true">履历</div>
    <div>
        <span class="eyebrow">the path walked so far</span>
        <h1>Experience</h1>
        <p class="intro">{EXPERIENCE_INTRO}</p>

        <ol class="roles">
            {#each EXPERIENCE as role, i}
                <li class="role">
                    <div class="marker" aria-hidden="true">
                        <span class="num">{NUMERALS[i]}</span>
                    </div>
                    <article>
                        <header>
                            <p class="period">{role.period}</p>
                            <h2>{role.role}</h2>
                            <p class="company">{role.company}</p>
                        </header>

                        <ul class="points">
                            {#each role.points as point}
                                <li>{@render rich(point)}</li>
                            {/each}
                        </ul>

                        <div class="projects">
                            {#each role.projects as project}
                                <section class="project">
                                    <h3>
                                        {#if project.url}
                                            <a href={project.url} target="_blank" rel="noopener noreferrer">{project.name} <span aria-hidden="true">↗</span></a>
                                        {:else}
                                            {project.name}
                                        {/if}
                                        {#if project.status}<span class="status">{project.status}</span>{/if}
                                    </h3>
                                    <ul class="tech" aria-label="Tech used">
                                        {#each project.tech as tech}<li>{tech}</li>{/each}
                                    </ul>
                                    <ul class="points">
                                        {#each project.points as point}
                                            <li>{@render rich(point)}</li>
                                        {/each}
                                    </ul>
                                </section>
                            {/each}
                        </div>
                    </article>
                </li>
            {/each}
        </ol>
    </div>
</div>

<style>
    .intro {
        font-family: var(--font-serif);
        font-style: italic;
        font-size: var(--font-xl);
        color: var(--ink-soft);
    }

    .project h3 a {
        text-decoration: none;

        span {
            font-size: 0.6em;
            vertical-align: super;
            color: var(--blood);
        }
    }

    .roles {
        list-style: none;
        margin: var(--space-xl) 0 0;
        padding: 0;
    }

    .role {
        display: grid;
        grid-template-columns: 4.5rem 1fr;
        gap: var(--space-lg);
        padding-bottom: var(--space-xl);

        /* The ink thread joining one chapter to the next. */
        .marker {
            position: relative;
            display: flex;
            justify-content: center;

            &::after {
                content: "";
                position: absolute;
                top: 4.5rem;
                bottom: calc(-1 * var(--space-xl));
                left: 50%;
                width: 2px;
                background: linear-gradient(var(--blood), color-mix(in srgb, var(--blood) 10%, transparent));
            }
        }

        &:last-child .marker::after {
            display: none;
        }
    }

    .num {
        position: sticky;
        top: 5rem;
        height: fit-content;
        font-family: var(--font-brush);
        font-size: 3.5rem;
        line-height: 1;
        color: var(--blood);
    }

    header {
        margin-bottom: var(--space-md);

        h2 {
            margin: 0;
        }
    }

    .period {
        margin: 0 0 var(--space-xs);
        font-style: italic;
        color: var(--ink-soft);
    }

    .company {
        margin: var(--space-xs) 0 0;
        font-family: var(--font-serif);
        font-style: italic;
        font-size: var(--font-xl);
        color: var(--blood);
    }

    .points {
        margin: 0;
        padding-left: 1.1em;
        max-width: 68ch;

        li {
            padding-left: 0.3em;
            margin-bottom: var(--space-xs);
        }

        li::marker {
            content: "◆";
            font-size: 0.55em;
            color: var(--blood);
        }
    }

    .projects {
        display: grid;
        gap: var(--space-md);
        margin-top: var(--space-lg);
    }

    .project {
        padding: var(--space-md) var(--space-lg);
        background: var(--paper-raised);
        border-left: 2px solid var(--blood);

        h3 {
            display: flex;
            flex-wrap: wrap;
            align-items: baseline;
            gap: var(--space-sm);
            margin: 0 0 var(--space-sm);
            font-size: var(--font-2xl);
        }
    }

    .status {
        font-family: var(--font-body);
        font-size: var(--font-sm);
        font-weight: 400;
        font-style: italic;
        color: var(--ink-soft);
        border: 1px solid color-mix(in srgb, var(--ink) 25%, transparent);
        border-radius: 3px;
        padding: 0 0.5em;
    }

    .tech {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-xs);
        list-style: none;
        margin: 0 0 var(--space-md);
        padding: 0;

        li {
            padding: 0 0.55em;
            font-size: var(--font-sm);
            color: var(--ink);
            background: color-mix(in srgb, var(--blood) 12%, transparent);
            border-radius: 2px;
        }
    }

    code {
        font-family: inherit;
        font-style: italic;
        padding: 0 0.15em;
        background: color-mix(in srgb, var(--ink) 8%, transparent);
        border-radius: 2px;
    }

    /* Phones: one column; the numeral sits beside the dates instead. */
    @media (width < 600px) {
        .role {
            grid-template-columns: 1fr;
            gap: 0;
            padding-bottom: var(--space-lg);
            border-bottom: 1px solid color-mix(in srgb, var(--ink) 12%, transparent);
            margin-bottom: var(--space-lg);

            .marker {
                justify-content: flex-start;

                &::after {
                    display: none;
                }
            }
        }

        .num {
            position: static;
            font-size: 2.4rem;
        }

        .points {
            padding-left: 0.9em;
            line-height: 1.5;
        }

        .project {
            margin-inline: calc(-1 * var(--space-md));
            padding: var(--space-md);

            h3 {
                font-size: var(--font-xl);
            }
        }

        .tech li {
            font-size: var(--font-xs);
        }
    }
</style>
