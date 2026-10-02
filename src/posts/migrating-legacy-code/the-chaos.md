---
title: "The Chaos"
description: "What happens when 90 modules grow without a plan"
pubDate: 2026-03-05
series: "Migrating Legacy Code"
tag: ["android", "architecture", "state-management", "jetpack-compose", "navigation"]
---

<script>
    import Diagram from "$lib/components/post/Diagram.svelte";
    import diagram1 from "./diagrams/the-chaos-1.svg?raw";
    import diagram2 from "./diagrams/the-chaos-2.svg?raw";
    import diagram3 from "./diagrams/the-chaos-3.svg?raw";
    import Stats from "$lib/components/post/Stats.svelte";
</script>

## 1. The First Week

My first week at SALT, I got assigned to BCALife NOW, the insurance app for BCA Life. “Here’s the repo”, my lead said, sliding over a Gitlab link. “Take a few days to explore it.”

I cloned the repo. Opened Android Studio. Hit “Sync Project with Gradle Files” and went to make coffee. Came back. Still syncing. Made another coffee. Watched the progress bar crawl. **60+ modules** loading, one by one. Each one pulling its own set of dependencies, each one its own little universe of code.

When the sync finally finished, I started browsing the module list. And then the package structure. And then the ViewModels. I opened one. Then another. Then a third. They were identical. Not similar. *Identical*. Copy-pasted, with only the class name and type parameters changed.

I clicked through more files. Inconsistent state management. ViewModels that did nothing but forward a single API call. Composables with 1,200+ lines of LaunchedEffect blocks. A navigation system built on string concatenation. No code documentation. No naming conventions. No architectural rules. The only documentation that existed were FSDs and TSDs for feature specs, nothing about how the code should be structured.

By Friday, I had a pretty clear picture. This wasn’t just tech debt. This was an architecture that had grown organically, sprint after sprint, without anyone stepping back to ask: “Wait, should we actually be doing it this way?”

Let me show you what I found.

## 2. The Numbers Don’t Lie

Before we dive into the code, let’s just look at the raw numbers. These aren’t estimates. I counted them.

<Stats items={[{"value": "60+", "label": "Gradle Modules"}, {"value": "248", "label": "ViewModels"}, {"value": "93", "label": "VMs in ONE module"}, {"value": "2", "label": "Legacy State Patterns"}]} />

Let that sink in. **248 ViewModels** and 93 of those (more than a third) lived inside a single module. We’ll get to why in a minute.

But first, let me show you what the module dependency graph looked like. Fair warning: it’s not pretty.

<Diagram svg={diagram1} label={"Diagram: "} />

The actual module dependency graph. Every line is a real dependency.
See all those lines crossing in the dependency graph? That’s not an artistic choice. Modules depended on each other in every direction: up, down, sideways. `core-polis-impl` knew about `bcalife-ui-polis`. UI modules depended on other UI modules. Implementation modules reached across domain boundaries like they were grabbing snacks from a neighbor’s desk.

There was no layering. No separation of concerns at the module level. Just a flat web of 60+ nodes, all tangled together.

---

## 3. The Copy-Paste Army

Here’s the pattern that created 248 ViewModels. I call it the **1-UseCase-per-ViewModel** pattern, and once you see it, you can’t unsee it.

Every API call got its own ViewModel. Not every screen. Not every feature. Every. Single. API. Call.

Let me show you two real examples, side by side:

```kotlin
class GetPolisViewModel(private val usecase: GetPolis) : ViewModel() {
    private val _getPolisResponse = mutableStateOf<ResultOf<GetPolisResponse>?>(null)
    val getPolisResponse: State<REsultOf<GetPolisResponse>?> get() = _getPolisResponse
    
    fun getPolis(parameter: GetPolisParameter) {
        viewModelScope.launch {
            usecase(parameter).collect { _getPolisResponse.value = it }
        }
    }
    
    fun clearData() { _getPolisResponse.value = null }
}
```

```kotlin
class DoVerificationDOBViewModel(private val usecase: DoVerificationDOB) : ViewModel() {
    private val _doVerificationDOBResponse = mutableStateOf<ResultOf<DoVerificationDOBResponse>?>(null)
    val doVerificationDOBResponse: State<ResultOf<DoVerificationDOBResponse>?> get() = _doVerificationDOBResponse

    fun doVerificationDOB(parameter: DoVerificationDOBParameter) {
        viewModelScope.launch {
            usecase(parameter).collect { _doVerificationDOBResponse.value = it }
        }
    }
    fun clearData() { _doVerificationDOBResponse.value = null }
}
```

Spot the difference? **There isn’t one**. The structure is identical. The only things that change are the class name, the UseCase type, and the response type. Everything else (the mutableStateOf, the viewModelScope.launch, the collect, the clearData) is a character-for-character copy.

This pattern was copy-pasted **70+** times. Here’s just a sample of the naming convention:

- `DoAddPolisViewModel`
- `DoRefreshPolisViewModel`
- `DoDeleteBeneficiaryViewModel`
- `GetAddressProvinceViewModel`
- `GetAddressDistrictViewModel`
- `GetAddressWardViewModel`
- `GetAddressCityViewModel`
- `GetCountNotificaitonViewModel`
- `DoSubmitClaimViewModel`
- `DoUploadDocumentViewModel`

You see the pattern? `Do[Action]ViewModel` and `Get[Thing]ViewModel`. Each one wrapping exactly one API call. Each one its own file. Each one injected via Koin into whatever Composable needed it.

The result? A screen that needs 3 API calls doesn’t get one ViewModel with 3 functions. It gets **3 separate ViewModels**, all injected at the top, all managing their own independent state, all completely unaware of each other. Coordinating between them? That’s the Composable’s problem now.

In a well-architected app, the ViewModel count grows roughly linearly with the number of screens. In this codebase, it grew linearly with the number of *API endpoints*. Add a new endpoint? Create a new ViewModel. That’s how you get to 248.

<Diagram svg={diagram2} label={"Diagram: ViewModel Growth: Legacy vs Modern"} />

---

## 4. Pick Your Fighter: 2 State Patterns

It gets worse. Not only were there 248 ViewModels, but they didn’t even agree on *how to manage state*. Two different patterns coexisted in the same file.

### Pattern A: Compose mutableStateOf (55%+ of VMs)

The most common pattern. The copy-paste army from Section 3 uses this one. It puts a **Compose runtime dependency directly inside the ViewModel**:

```kotlin
// Direct Compose runtime dependency in ViewModel
private val _getPolisResponse = mutableStateOf<ResultOf<GetPolisResponse>?>(null)
val getPolisResponse: State<ResultOf<GetPolisResponse>?> get() = _getPolisResponse
```

`mutableStateOf` is from `androidx.compose.runtime`. It’s designed for use inside Composable functions, not ViewModels. Using it in a ViewModel means your ViewModel has a hard dependency on the Compose runtime. You can’t unit test it without pulling in the entire Compose testing framework.

### Pattern B: Individual MutableStateFlow fields

Some Viewmodels used the more standard `MutableStateFlow` approach. But instead of grouping related state into a single data class, they declared **every single field** as its own independent flow:

```kotlin
private val _claimEmail = MutableStateFlow("")
private val _isShowTermCondition = MutableStateFlow(false)
private val _isShowDraftPopup = MutableStateFlow(false)
private val _isWhatsAppNumberLengthError = MutableStateFlow(false)
private val _isWhatsAppNumberError = MutableStateFlow(false)
private val _isEmailError = MutableStateFlow(false)
private val _expandPolicyNumber = MutableStateFlow(false)
private val _selectedPolicyNumber = MutableStateFlow<PolicyEntity?>(null)
// ... 29 more fields
```

Thirty-seven `MutableStateFlow` fields. Each one with its own backing property. Each one emitting independently.

**Two patterns. Same project. No documentation on which one to use**. A new developer joining the team had no way to know which pattern to follow. So they’d look at the file next to theirs, copy it, and the cycle continued.

---

## 5. The 37-Field Monster

Let’s talk about `SubmissionViewModel.kt`. 906 lines. 37 individually declared `MutableStateFlow` fields. This is what happens when Pattern B meets a complex form screen and nobody stops to think about state grouping.

<Diagram svg={diagram3} label={"Diagram: "} />

Look at that tree. There are clear clusters of related state here: policy selection, claim type, causes, validation, form data, UI toggles. In a modern architecture, these would be grouped into data classes.

Instead, they’re **37 flat, independent flows**. Every single one declared as:

```kotlin
private val _fieldName = MutableStateFlow(defaultValue)
val fieldName: StateFlow<Type> = _fieldName.asStateFlow()
```

Want to write a unit test for this ViewModel? You need to:

1. Set up mocks for every dependency (use cases, repositories)
2. Understand how 37 state fields interact with each other
3. Track which fields get updated by which functions
4. Assert against 37 individual flow emissions

In practice, **nobody tested it**. The SubmissionViewModel had zero unit tests. Not because the team was lazy, but because testing it was genuinely impractical. When your ViewModel has 37 independently-mutating state fields and 906 lines of business logic, writing meaningful tests becomes a Herculean effort.

And that’s the real cost of poor architecture. It’s not just ugly code. It’s code that *can’t be safely changed* because there’s no test safety net, and there’s no test safety net because the code is untestable.

---

## 6. When Composable Become ViewModels

So the ViewModels were a mess. But it gets better. The Composables were *also* doing ViewModel work. The boundary between “UI” and “logic” had completely dissolved.

### Exhibit A: The 1,234-Line LaunchedEffect Handler

`HandlerSubmissionV3.kt`, 1,234 lines. Not a ViewModel. Not a repository. A *Composable function*. Its entire body was a chain of `LaunchedEffect` blocks, each one watching a different piece of state and triggering side effects.

These `LaunchedEffect` blocks were acting as mini-ViewModels embedded directly in the UI layer. It was a ViewModel wearing a Composable’s trench coat.

### Exhibit B: 8 ViewModels, 1 Screen

Remember the 1-UseCase-per-ViewModel pattern? Here’s what it looks like at the screen level. The home screen injected **eight ViewModels**:

```kotlin
homeArticleViewModel: HomeArticleViewModel = koinViewModel(),
homePromoViewModel: HomePromoViewModel = koinViewModel(),
homeScreenViewModel: HomeScreenViewModel = koinViewModel(),
homeScreenDataViewModel: HomeScreenDataViewModel = koinViewModel(),
notificationViewModel: GetCountNotificationViewModel = koinViewModel(),
homeMenuViewModel: HomeMenuViewModel = koinViewModel(),
viewModel: HomeViewModel = koinViewModel(),
getProfileMeViewModel: GetProfileMeViewModel = koinViewModel(),
```

Eight ViewModels for one screen. Each one managing its own slice of state. None of them coordinating with each other. The Composable itself becomes the orchestration layer.

That’s not a Composable. That’s a state machine with a `@Composable` annotation.

### Exhibit C: State Objects in the Composable

And then there’s `ScreenSubmissionV3`, which gave up on ViewModels entirely for some of its state:

```kotlin
val policyState by remember { mutableStateOf(SubmissionClaimPolicyState()) }
val claimTypeState by remember { mutableStateOf(SubmissionClaimTypeState()) }
val causeOfTreatmentState by remember { mutableStateOf(SubmissionClaimCausesState(CAUSE_OF_TREATMENT)) }
val causeOfDeathState by remember { mutableStateOf(SubmissionClaimCausesState(CAUSE_OF_DEATH)) }
val causeOfDefectState by remember { mutableStateOf(SubmissionClaimCausesState(CAUSE_OF_DEFECT)) }
// ... and more
```

These aren’t simple UI toggles. These are **domain-level state objects**: policy data, claim types, cause classifications. Business logic state, living inside a Composable, dying on every configuration change.

---

## 7. Navigation by String Concatenation

Last one. I promise. But this one really drove the point home for me.

To be fair, this one isn’t the team’s fault. Type-safe navigation in Jetpack Compose only hit its first alpha in May 2024, right before I joined. Before that, string-based routes were the industry standard, and the team followed the best practices of the time to the letter:

- **Sealed classes** for route definitions
- **Constant keys** for argument names
- `navArgument()` for explicit type declarations

### The Implementation

On paper, it looked organized:

```kotlin
sealed class ScreenPolis(val route: String = "") {
    object Polismu : ScreenPolis("polis-polismu")
    object Polis : ScreenPolis("polis-polis")
    object Detail : ScreenPolis("polis-detail")
    object Verification : ScreenPolis("polis-verification-otp")
    // ...
}
```

```kotlin
object NavArgsPolis {
    const val policyNumber = "polis_number"
    const val type = "type"
    const val email = "email"
    const val date = "date"
    const val optionalArgs = "?args="
    // ...
}
```

In practice, it was a string-concatenation minefield:

```kotlin
composable(
    route = routeVerification +
        "/{${NavArgsPolis.policyNumber}}" +
        "?type={${NavArgsPolis.type}}" +
        "?date={${NavArgsPolis.date}}" +
        "&email={${NavArgsPolis.email}}",
)
```

```kotlin
navController.navigate(
    routeVerification +
        "/${args.polisNumber}" +
        "?type=${args.type}" +
        "?date=${args.date}" +
        "&email=${args.email}",
)
```

### The “Best Practice” Trap

The irony is that the more organized the team tried to be, the more obscured the logic became. By using constants and sealed classes, they created an illusion of type safety that didn’t actually exist at runtime.

The compiler is completely blind here. It sees two strings being built. It doesn’t know, and doesn’t care, if they match. This led to three distinct silent killers:

1. **The Character-Level Dependency**. The route definition and the navigate call need to match character-for-character: same argument names, same ordering, same delimiters. Miss one character and the app crashes. The compiler says “LGTM!” while the runtime throws an `IllegalArgumentException`.
2. **The Silent Mismatch**. Swap the order of two arguments and the app won’t crash, but your `policyNumber` will suddenly contain the `email`. No warning. No error. Just wrong data flowing through the entire claim flow.
3. **The Refactoring Ghost**. Rename a constant key for clarity? The string concatenation still compiles, but the NavGraph can no longer find the destination. The breakage only surfaces when a user taps that specific button, in that specific flow, with that specific set of arguments.

The team did everything right for the tooling that existed, yet they ended up with a system where a single typo in a string could take down an entire flow. Architectural patterns can’t save you if the underlying infrastructure is fundamentally untyped.

---

> I want to be clear about something: this wasn’t built by bad developers. It was built by a team under pressure, deadline after deadline, sprint after sprint. When you’re shipping features every two weeks and there’s no time budgeted for architecture, you do what works. You copy the file next to yours. You add another ViewModel. You string-concatenate another route. And it ships. It works. The users don’t know the difference.
>
> Until they do.
>
> Until adding a new feature takes three weeks instead of three days because nobody can figure out which of the 8 ViewModels is responsible for the bug. Until a simple refactor breaks navigation because a string was wrong. Until a new developer joins and spends their entire first sprint just trying to understand the module graph.
>
> This codebase was a house of cards. And adding a new window cost more than building a new wall.
>
> Something had to change. And in Part 2, I’ll tell you about the moment it did.
