---
title: "The Catalyst"
description: "Why the legacy patterns broke down, and what finally made me act"
pubDate: 2026-03-03
series: "Migrating Legacy Code"
tag: ["android", "architecture", "state-management", "jetpack-compose", "navigation"]
---

<script>
    import Diagram from "$lib/components/post/Diagram.svelte";
    import diagram1 from "./diagrams/the-catalyst-1.svg?raw";
    import diagram2 from "./diagrams/the-catalyst-2.svg?raw";
    import diagram3 from "./diagrams/the-catalyst-3.svg?raw";
    import diagram4 from "./diagrams/the-catalyst-4.svg?raw";
    import Stats from "$lib/components/post/Stats.svelte";
    import { CodePanels, CodePanel } from "$lib/components/post";
</script>

## 1. The Golden Hammer

“When all you is a hammer, everything looks like a nail.”

In this codebase, the hammer was a single rule: **1 UseCase = 1 ViewModel**. Somewhere early in the project’s life, someone decided that every use case, every single API call, every database read, every tiny unit of business logic, deserved its own ViewModel. And honestly? For the first few screens, it probably felt *great*.

“It’s clean! Each ViewModel does one thing!” That’s what you’d hear if you asked why. And for a login screen or a settings page, sure, it wokrs. One call, one result, one ViewModel. Easy to reason about. Easy to test. Easy to explain to a new hire.

The problem is that nobody revisited the rule when the feature count went from 5 to 50. What started as a clean convention turned into a golden hammer antipattern, a solution applied so reflexively that nobody questioned whether it still fit the problem.

I noticed it within my first week at SALT. I was onboarding onto the BCALife NOW app, tracing the flow of a claim submission screen, and I kept opening file after file after file. `GetPoliciesViewModel`, `GetClaimTypeVieModel`, `GetCausesViewModel` … each one basically a thin wrapper around a use case that was *itself* a thin wrapper around a repository call. I remember thinking: “Okay, where’s the screen-level ViewModel that ties all of this together?” There wasn’t one. The Composable was doing all the coordination. Sixteen ViewModels, zero cohesion.

<Diagram svg={diagram1} label={"Diagram: "} />

“1 UseCase = 1 ViewModel” - applied to Simple Queries, From Screens, Complex Flows, and Timer Logic alike.

---

## 2. The Scaling Problem

Let me show you exactly how this scales. Consider one of the more complex screens in the app: the claim submission flow. A user fills out a form, select policies, picks claim types and causes, uploads documents, and submits. Under the 1-UseCase-1-ViewModel rule, every one of those operations gets its own ViewModel.

Here’s the actual dependency list for that single screen:

- `GetPoliciesUseCase` -> `GetPoliciesViewModel`
- `GetClaimTypeUseCase` -> `GetClaimTypeViewModel`
- `GetCausesUseCase` -> `GetCausesViewModel`
- `GetSubCausesUseCase` -> `GetSubCausesViewModel`
- `DoCreateSubmissionUseCase` -> `DoCreateSubmissionViewModel`
- `DoUpdateSubmissionUseCase` -> `DoUpdateSubmissionViewModel`
- `GetSubmissionUseCase` -> `GetSubmissionViewModel`
- `GetPolisTokenUseCase` -> `GetPolisTokenViewModel`
- `GetProfileMeUseCase` -> `GetProfileMeViewModel`
- `GetSubmissionFormUseCase` -> `GetSubmissionFormViewModel`
- `GetClaimTnCUseCase` -> `GetClaimTnCViewModel`
- `DoSaveSubmissionDraftUseCase` -> `DoSaveSubmissionDraftViewModel`
- `DoUpdateSubmissionDraftUseCase` -> `DoUpdateSubmissionDraftViewModel`
- `GetClaimSubmissionTncCheckUseCase` -> `GetClaimSubmissionTncCheckViewModel`
- `GetClaimSubmissionEmailUseCase` -> `GetClaimSubmissionEmailViewModel`
- `GetInsuredNamesUseCase` -> `GetInsuredNamesViewModel`

That’s **16 ViewModels for one screen**. In any standard architecture, it would be 1.

<Diagram svg={diagram2} label={"Diagram: "} />

Every new feature requirement on that screen means another UseCase, another ViewModel , another DI binding, another mock in tests, another thing for a new developer to understand. It doesn’t scale linearly. It scales *combinatorially*.

---

## 3. The Testing Nightmare

“Just write unit tests.” Sure. Let me show you what it takes to set up *one* test for the `SubmissionViewModel` under this architecture.

The `SubmissionViewModel` was the exception to the 1-UseCase-1ViewModel rule. It *did* aggregate multiple use cases, because at some point even the most rigid adherents realized that coordinating 16 ViewModels from a Composable was untenable. But instead of rethinking the pattern, they just crammed all 16 use cases into one ViewModel’s constructor.

```kotlin
// Setting up ONE test for SubmissionViewModel
@Test
fun `test submission saves draft`() {
    val getPoliciesUseCase = mockk<GetPoliciesUseCase>()
    val getClaimTypeUseCase = mockk<GetClaimTypeUseCase>()
    val getCausesUseCase = mockk<GetCausesUseCase>()
    val getSubCausesUseCase = mockk<GetSubCausesUseCase>()
    val doCreateSubmissionUseCase = mockk<DoCreateSubmissionUseCase>()
    val doUpdateSubmissionUseCase = mockk<DoUpdateSubmissionUseCase>()
    val getSubmissionUseCase = mockk<GetSubmissionUseCase>()
    val getPolisToken = mockk<GetPolisToken>()
    val getProfileMe = mockk<GetProfileMe>()
    val getSubmissionFormUseCase = mockk<GetSubmissionFormUseCase>()
    val getTnCUseCase = mockk<GetClaimTnCUseCase>()
    val getClaimSubmissionTncCheckUseCase = mockk<GetClaimSubmissionTncCheckUseCase>()
    val doSaveSubmissionDraftUseCase = mockk<DoSaveSubmissionDraftUseCase>()
    val doUpdateSubmissionDraftUseCase = mockk<DoUpdateSubmissionDraftUseCase>()
    val getClaimSubmissionEmailUseCase = mockk<GetClaimSubmissionEmailUseCase>()
    val getInsuredNames = mockk<GetInsuredNames>()

    val viewModel = SubmissionViewModel(
        getPoliciesUseCase, getClaimTypeUseCase, getCausesUseCase,
        getSubCausesUseCase, doCreateSubmissionUseCase, doUpdateSubmissionUseCase,
        getSubmissionUseCase, getPolisToken, getProfileMe,
        getSubmissionFormUseCase, getTnCUseCase, getClaimSubmissionTncCheckUseCase,
        doSaveSubmissionDraftUseCase, doUpdateSubmissionDraftUseCase,
        getClaimSubmissionEmailUseCase, getInsuredNames
    )
    // NOW we can actually write the test...
}
```

**16 mocks just to instantiate the ViewModel**. We haven’t even written the assertion yet. That’s just the *constructor*.

> The real cost of this pattern isn’t the boilerplate. It’s that **people stop writing tests entirely**. When the setup is this painful, developers skip it. They test manually, ship it, and move on. Test coverage in the claim module was effectively zero.

---

## 4. The Onboarding Tax

Want to know the real price of architectural debt? Watch a new developer try to understand the codebase.

Here’s what that experience looked like at SALT. I know because I lived it:

<Diagram svg={diagram3} label={"Diagram: "} />

You open `core-polis-impl` and you;re staring at **91 ViewModel files**. You find `SubmissionViewModel`. 906 lines. Then you discover there are also 12 thin `Do*ViewModel` and `Get*ViewModel* classes for the same feature. Some logic lives in the big ViewModel. Some lives in the thin ones. Some is duplicated across both.

There’s no code documentation. No naming convention guide. No architectural rules written down anywhere. The only docs are FSDs and TSDs for feature requirements, nothing about how the code should be structured or which patterns to follow.

So you try to add a feature. A small one. You don’t know which pattern to follow, so you ask the developer next to you. And you get the answer that kills codebases more reliably than any antipattern ever could:

> “We’ve always done it this way.”

That answer doesn’t mean the pattern is correct. It means nobody has the context to explain *why* it’s done that way. The institutional knowledge has been replaced by intertia.

---

## 5. God Modules & God DI

The 1-UseCase-1-ViewModel rule had a downstream effect that nobody anticipated: the DI modules become enormous.

Meet `ClaimModule.kt`. 362 lines. 78 use cases. 34 ViewModels. One single file responsible for the entire dependency graph of the claim feature.

```kotlin
val moduleClaim = module {
    single<IRemoteClaimDataSource> { RemoteClaim(get()) }
    single<IRemoteClaimDataSourceV2> { RemoteClaimDataSourceV2(get()) }
    single<IRemoteClaimSubmission> { RemoteClaimSubmission(get()) }

    single<IClaimRepository> { ClaimRepository(get(), get(named("io"))) }
    single<IClaimRepositoryV2> { ClaimRepositoryV2(get(), get(named("io")), get()) }

    // Usecase - 78 of them
    factory { GetClaim(get()) }
    factory { DoDeleteClaim(get()) }
    // ... 76 more ...

    // ViewModel - 34 of them
    viewModel { GetClaimViewModel(get()) }
    viewModel { DoDeleteClaimViewModel(get()) }
    // ... 32 more ...

    viewModel {
        SubmissionViewModel(
            get(), get(), get(), get(), get(), get(), get(), get(),
            get(), get(), get(), get(), get(), get(), get(), get()
        )
    }  // 16 get() calls!
}
```

Look at that last binding. `SubmissionViewModel` with 16 `get()` calls. No named parameters. No way to tell which dependency is which without opening the ViewModel’s constructor and counting positions. Koin resolves by type so the ordering doesn’t matter here, but try reading that line in a code review and understanding what’s being injected. It’s a wall of `get()` that tells you nothing.

And the `PolisVerificationModule` solved the “which dependency is which” problem by introducing string-based named qualifiers. Lots of them:

```kotlin
private const val pin_verification_ds = "pin_verification_ds"
private const val pin_verification_repository = "pin_verification_repository"
private const val pin_verification_usecase = "pin_verification_usecase"
const val pin_verification_viewmodel = "pin_verification_viewmodel"
const val pin_verification_send_otp_viewmodel = "pin_verification_send_otp_viewmodel"
private const val add_polis_verification_ds = "add_polis_verification_ds"
private const val add_polis_verification_repository = "add_polis_verification_repository"
private const val add_polis_verification_usecase = "add_polis_verification_usecase"
const val add_polis_verification_viewmodel = "add_polis_verification_viewmodel"
// ... more magic strings
```

> If you need a string lookup table to understand your DI graph, something went wrong. Dependency Injection is supposed to *reduce* coupling, not create a parallel universe of string-based coupling that’s invisible to the compiler.

---

## 6. The Duplicate Repository Problem

Remember those two data source interfaces in `ClaimModule.kt`? `IRemoteClaimDataSource` and `IRemoteClaimDataSourceV2`? That “V2” suffix told you that someone had tried to improve a pattern, but instead of migrating the existing code, they built a parallel version alongside it.

<Stats items={[{"value": "260", "label": "lines in ClaimRepository.kt"}, {"value": "792", "label": "lines in ClaimRepositoryV2.kt"}]} />

`ClaimRepository` uses Kotlin Flow with `catch` for error handling. `ClaimRepositoryV2` uses try-catch with status code checks. Both are active. Both are injected into different parts of the claim feature. Neither is documented as the “correct” approach.

Across the codebase, I found **three distinct error handling patterns**:

```kotlin
// Pattern 1 - Flow + catch
flow { emit(ResultOf.Success(remote.getClaim(param))) }
    .catch { emit(ResultOf.Failure(e)) }

// Pattern 2 - try-catch + status code
try {
    if (result.statusCode == 200) ResultOf.Success(result.value)
    else ResultOf.Failure(Throwable(result.statusMessage))
} catch (e: Exception) { ResultOf.Failure(e) }

// Pattern 3 - Flow + status code + catch
flow {
    if (result.statusCode == 200) emit(Success(result))
    else emit(Failure(Exception(result.statusMessage)))
}.catch { emit(Failure(e)) }
```

Three patterns. Same team. Same feature domain. Same type of operation. The choice of which pattern to use was determined entirely by which file the developer happened to copy from.

And the duplication reached into the smallest details. Constants were duplicated across ViewModels:

<CodePanels>
<CodePanel label={"SubmissionViewModel.kt"}>

```kotlin
companion object {
    const val HEIR = "Ahli Waris"
    const val GUARDIAN_OF_HEIR =
        "Wali Ahli Waris"
}
```

</CodePanel>
<CodePanel label={"PaymentInformationViewModel.kt"}>

```kotlin
companion object {
    const val HEIR = "Ahli Waris"
    const val GUARDIAN_OF_HEIR =
        "Wali Ahli Waris"
}
```

</CodePanel>
</CodePanels>

Exact same constants. Copy-pasted into two ViewModels. This is what entropy looks like in a codebase.

---

## 7. Getting Buy-In

I saw all of this within my first week. The golden hammer. The god modules. The duplicate repositories. The testing void. It was glaringly obvious that the architecture needed serious work. But here’s the thing about being the new person on the team: you can’t just walk in on day 5 and say “let’s rewrite everything”.

Not because you’re wrong. You might be completely right. But being right is the easy part. Getting people to act on it is the hard part.

> The first conversation I had with the mobile lead about the architecture was careful. Not “this is broken and we need to fix it”. More like “I’m trying to understand the patterns here. Can you walk me through the history?” The answer was illuminating. They didn’t see it as a problem. The team had wanted to implement Clean Architecture, but without considering the best practices or norms in Android development. The 1-UseCase-1-ViewModel rule wasn’t a compromise under pressur. It was the intended design.
>
> And even after I identified the problems, we didn’t have the badwidth to fix them. There were only two Android developers: one assigned to new features, one to maintaining production. Every sprint was either shipping something new or fixing a production bug. There was no room for architectural work. Any migration I did had to happen alongside regular feature delivery.

So I spent months building the cae. Not with opinions, with evidence. Every time I added a new feature and an unrelated bug appeared, I noted it. Every time I fixed a bug and it created another bug somewhere else, I documented it. I counted the duplicate ViewModels. I measured the module that took the longest to compile. The codebase was so fragile that touching one thing reliablu broke something else.

The migration started last year. Not with a big rewrite announcement. Just a quiet agreement between me and the head engineer that I would build the new standard, prove it worked on one feature, and then expand from there.

<Diagram svg={diagram4} label={"Diagram: Cost of Change Over Time"} />

The longer you wait, the more expensive the change. Migration started before the curve got vertical.
The critical decision was to build the migration on **separate branch** rather than refactoring the main branch in-place. There two practical reasons:

- **The existing app can’t break**. It’s in production. Users depend on it. QA has regression suites against it. You can’t pause feature development for 6 monts while you rewire the architecture.
- **QA needs to test collaboratively**. With a separate branch, QA can test the new architecture module by module while the old code continues to ship on main.

Then came the push for full scale. The Android 17 (SDK 37) announcement finally killed the “portrait-only” crutch we’d been leaning on.

Google’s new policy for SDK 37 is absolute: for any device with a smallest screen width greater than 600dp (tables, foldables, desktop modes) the system now ignores `screenOrientation`, `resizeableActivity`, `minAspectRatio`, `maxAspectRatio`, and even the runtime `setRequestedOrientation()` API. All of them. Games get an exemption via `android:appCategory`, but insurance apps don’t. The developer opt-outs that existed in SDK 36 are gone, and apps targeting SDK 37 must comply by August 2027 for Google Play distribution.

This was a code red for our architecture. The legacy setup was a house of cards:

- **Volatile UI**. State was trapped in Composables using `remember`, meaning a simple deviec fold would wipe the screen.
- **Fragmented logic**. State was scattered across dozens of ViewModels with no centralized source of truth.
- **Zero persistence**. No structured state restoration. No `SavedStateHandle` implementation.

Under SDK 37, a configuration change like rotation or folding isn’t just layout change. It’s a full Activity recreation that effectively factory-resets the user’s progress. I used this technical mandate to escalate the conversation with the head engineer. This isn’t a “clean code” project anymore. It’s a prerequisite for PLay Store compliance and foldable-device survival

---

> The codebase didn’t fail overnight. It failed one copy-paste at a time, one “just ship it” at a time. The incremental migration started last year. The full-scale migration starts now.
