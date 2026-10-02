---
title: "The Context"
description: "What this series is about and why I wrote it."
pubDate: 2026-03-01
series: "Migrating Legacy Code"
tag: ["android", "architecture", "migration"]
---

<script>
    import Diagram from "$lib/components/post/Diagram.svelte";
    import diagram1 from "./diagrams/the-context-1.svg?raw";
    import Stats from "$lib/components/post/Stats.svelte";
</script>

This is a story about inheriting a codebase that had grown faster than anyone could maintain it, and the nearly two-year effort to fix it from the inside.

The app is **BCALife NOW**, the mobile insurance platform for BCA Life, one of Indonesia’s major insurance providers. Hundreds of thousands of users rely on it to manage policies, submit claims, find hospitals, and handle everything else that comes with life insurance. It is a production app with real users, real money, and real deadlines.

And when I first opened the project, the architecture was in trouble.

---

## 1. The App

BCALife NOW is not a small app. The first commit was May 2022. By the time I joined in June 2024, two years of development had produced:

<Stats items={[{"value": "60+", "label": "Gradle Modules"}, {"value": "248", "label": "ViewModels"}, {"value": "150+", "label": "Screens"}]} />

It handles policy management, claim submission with document uploads, user profiles, notifications, and more. It is built with Jetpack Compose, uses Koin for dependency injection, and communicates with a backend API over Ktor.

The features work. Users can do what they need to do. From the outside, it looks fine.

From the inside, it was a different story.

---

## 2. Who I Am

I joined SALT as an Android developer in June 2024 and was assigned to the BCALife NOW team. Within my first week, I could see the problems: 248 ViewModels with most of them being copy-pasted wrappers, inconsistent state management, navigation held together with string concatenation, and modules that depended on each other in every direction.

I spent the first few months building trust and gathering evidence. I documented every architectural problem I found, tracked the cost of each one, and built the case that things needed to change.

Then I started building the new standard. The legacy codebase had no `feature/`, `domain/`, `data/`, or `core/` module structure. Just a flat tangle of 60+ modules with no layering. It had conventions of a sort, shared root-level `.gradle` files like `test.gradle`, `impl.gradle`, and `ui.gradle` that modules applied with `apply from`, but nothing resembling a real build system or architectural layering. I replaced all of that with proper Gradle convention plugins in `build-logic/`, designed the module architecture, introduced the contract pattern, and wrote the `BaseViewModel` with Event, State, and Effect in `core:ui`, and overhauled the Gradle build configuration in `gradle.properties` with proper JVM arguments, parallel builds, build caching, and configuration caching.

Not everyone agreed. Another developer didn’t want to use the SideEffect pattern, so they created a second `BaseViewModel` in `core:common` with only two type parameters, effectively deprecating mine. For a while, we had two competing base classes with the same name in the same project. That kind of friction is part of the story too.

The migration has been mostly my effort, done alongside normal feature work. No dedicated sprint. No special permission. Just steady, feature-by-feature progress over the better part of two years.

> This series is the documentation of that process. Not the sanitized conference-talk version. The real version, with the messy parts left in.

---

## 3. Who This Is For

If you are an Android developer who has ever:

- Opened a project and wondered why there are 100+ ViewModels in a single module
- Tried to trace a feature’s data flow across 4 different ViewModels and a 1,200-line Composable
- Wanted to write a unit test but gave up because the setup required 16 mocks
- Inherited a codebase with 3 different error handling patterns and no documentation on which one to use
- Been told “we’ve always done it this way” when you asked why
- Built something better and then watched someone else build a competing version right next to it

Then this series is for you. It is not about theory. It is about what actually worked, in a real production app, under real constraints.

---

## 4. What You Will Read

This series has four parts. You’re reading the first one.

<Diagram svg={diagram1} label={"Diagram: "} />

**Part 1: The Chaos** is a deep dive into what the legacy codebase actually looked like. The copy-paste ViewModel army. The coexisting state management patterns. The 37-field monster ViewModel. The navigation system built on string concatenation. Everything I found when I first opened the project, with real code examples.

**Part 2: The Catalyst** explains *why* those patterns broke down at scale. The golden hammer antipattern. The testing nightmare. The onboarding tax. The god modules. And the conversation that finally kicked off the migration.

**Part 3: The Cure** is the prescription. The target architecture I built: Clean Architecture with feature-domain-data modules, the contract pattern (Event + State + Effect), one ViewModel per screen, type-safe navigation, and the incremental migration strategy that made it all possible without a big bang rewrite.

---

## 5. What This Is Not

This is not a tutorial. I will not walk you through setting up a project from scratch or explain what a ViewModel is. I assume you know Android development.

This is not criticism of the original team. They built a working app under real deadlines. The problems I describe are the natural result of growth without architectural investment. Every team accumulates this kind of debt. The only question is whether you address it or let it compound.

And this is not a story with a clean ending. The migration is ongoing. Every module I finish is one less source of friction, but the work continues. What I can share is the approach, the patterns, and the evidence that it works.

---

> If you have ever looked at a codebase and thought “someone should fix this,” this is the story of what happens when you decide that someone is you.
