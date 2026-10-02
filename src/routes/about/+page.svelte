<script lang="ts">
    import Seo from "$lib/components/Seo.svelte";
    import HangingScroll from "$lib/components/HangingScroll.svelte";

    let { data } = $props();
</script>

<Seo title="about" />

<div class="container folio">
    <div class="folio-mark" aria-hidden="true">吾名</div>
    <div>
        <div class="portrait">
            <HangingScroll seed={data.seed} caption="The wanderer — painted anew with every build." />
            <a href="/resume.pdf" data-sveltekit-reload>View Resume</a>
        </div>

        <div class="content">
            <h1>Howdy!</h1>
            <p class="lede">
                I'm Rendra. I'm <strong>Software Engineer</strong> dedicated to crafting things for
                mobile through coding.
            </p>
            <p>
                Welcome to my spot on the web for writing, projects, tutorials, and anything else I
                want to put out there.
            </p>
            <p>
                My site has
                <span class="vow">no ads</span>,
                <span class="vow">no AI-generated content</span>,
                <span class="vow">no affiliate links</span>,
                <span class="vow">no sponsored posts</span>, <span class="vow">and no paywall</span>.
                It's a space for self-expression and to share what I've learned with the world. I
                hope I can inspire others to make their own creative corner on the web in the uphill
                battle against the
                <a href="https://en.wikipedia.org/wiki/Enshittification">enshittification</a> of the
                internet.
            </p>
            <p>
                I wrote my first lines of code back in 2013 of HTML and CSS using notepad. Like many
                people I graduated a few years later and since then I've been on this adventure into
                the world of programming.
            </p>
            <p>
                I don't have "favorites", but i like to code on Java, Kotlin and I'm starting to
                tiker with Golang. I also like to think outside of coding, such prioritizing
                tasks/features, doing reviews and providing the good practices, fundamentals, and
                consistency throughout the code.
            </p>
            <p>I've worked on Android (Kotlin), iOS(Flutter) and backend.</p>
            <p>Personally, I'm into computers, playing video games, and reading.</p>
        </div>
    </div>
</div>

<style>
    .portrait {
        display: flex;
        flex-wrap: wrap;
        align-items: flex-end;
        gap: var(--space-lg);
        margin: 0 0 var(--space-xl);
    }

    .content h1 {
        margin-top: 0;
    }

    .lede {
        font-family: var(--font-serif);
        font-size: clamp(1.3rem, 2.5vw, 1.8rem);
        line-height: 1.35;
    }

    .vow {
        text-decoration: underline wavy var(--blood);
        text-underline-offset: 0.25em;
    }
</style>
