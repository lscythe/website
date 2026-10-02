---
title: "Why Re-Learn Fundamentals in 2026?"
pubDate: 2026-02-19
series: "Rebooting Android Basics"
tag: ["android", "fundamentals"]
---

Going back to the roots. Why revisiting Android fundamentals still
matters, even after years of building apps.

We've spent the last few years sprinting. We mastered Jetpack Compose,
fell in love with State Hoisting, and swapped messy RxJava streams for
Flows.

But lately, there's a common hesitation in the modern workflow.

We can build a beautiful, adaptive UI in a single morning. But if you're
asked exactly why a `LocalContext.current` might pin an entire Activity
in memory, or how `repeatOnLifecycle` actually stops a "zombie"
Coroutine during a config change, most of us pause longer than we'd like
to admit.

The truth? We've gotten so good at the high-level abstractions that
we've started to forget the machinery underneath. Whether you're just
starting your first professional role or you're leading a platform team,
these basics are where the most expensive bugs hide.

### The Reality Check

The OS continues to evolve with stricter privacy and background
constraints, but the skeleton hasn't changed:

-   Activities still host your windows.
-   Lifecycles still decide if your app lives or dies in the background.
-   Context is still the "God Object" that can leak your memory into
    oblivion if mishandled.

Compose is a magnificent steering wheel, but the Android OS is still the
engine. If you don't know how the engine works, you're just a driver
waiting for a breakdown.

## The Master Roadmap

This reboot is broken into four phases. We aren't just looking at
documentation, we're looking at architectural scars.

### Phase 1: The Roots

-   The Context Tree: Application vs Activity Context.
-   The Modern Activity: In a single activity world, what's actually
    left to manage?
-   Lifecycle Re-Mastered: `repeatOnLifecycle` vs old-school observers.
-   The Fragment Bridge: When to use them and when to run away.

### Phase 2: The Wiring

-   Intents & Deep Links
-   The Result API
-   Background Evolution
-   State vs Persistence

### Phase 3: UI Evolution & Phase 4: Performance

-   The Interop Secret
-   Memory Leak Hunting
-   Threading 101

## The "Dev-to-Dev" Template

> The History: "We used to do it like this: manually starting a
> background service that would run forever until the OS killed it (or
> the battery died)."
>
> The Modern Way: "Now we do this: we use WorkManager for deferrable
> tasks and Foreground Services only for things the user is actively
> aware of."
>
> The "Junior" Gotcha: "Watch out for this common mistake: trying to run
> heavy database sync inside a simple Coroutine scope in your ViewModel.
> If the user swipes the app away, that work might never finish. Use
> WorkManager for the 'guaranteed' stuff."

## The Workbench

This series assumes:

-   Target SDK: Latest Stable.
-   Min SDK: 26.
-   UI: Pure Jetpack Compose with Material 3.

``` toml
[versions]
composeBom = "..."
lifecycle = "..."
work = "..."

[libraries]
compose-bom = { module = "androidx.compose:compose-bom", version.ref = "composeBom" }
lifecycle-runtime-compose = { module = "androidx.lifecycle:lifecycle-runtime-compose", version.ref = "lifecycle" }
navigation-compose = { module = "androidx.navigation:navigation-compose" }
work-runtime-ktx = { module = "androidx.work:work-runtime-ktx", version.ref = "work" }
```

## The Goal

The aim is to sharpen our collective intuition. We want to spot a
threading bug before hitting "Run" and understand the why so the how
becomes second nature again.
