---
title: "The Chaos"
description: "What happens when 90 modules grow without a plan"
pubDate: 2026-03-05
series: "Migrating Legacy Code"
tag: ["android", "architecture", "state-management", "jetpack-compose", "navigation"]
---

What happens when 90 modules grow without a plan

## 1. The First Week

My first week at SALT, I got assigned to BCALife NOW, the insurance app
for BCA Life. "Here's the repo", my lead said, sliding over a Gitlab
link. "Take a few days to explore it."

I cloned the repo. Opened Android Studio. Hit "Sync Project with Gradle
Files" and went to make coffee. Came back. Still syncing. Made another
coffee. Watched the progress bar crawl. 60+ modules loading, one by one.
Each one pulling its own set of dependencies, each one its own little
universe of code.

When the sync finally finished, I started browsing the module list. And
then the package structure. And then the ViewModels. I opened one. Then
another. Then a third. They were identical. Not similar. Identical.
Copy-pasted, with only the class name and type parameters changed.

I clicked through more files. Inconsistent state management. ViewModels
that did nothing but forward a single API call. Composables with 1,200+
lines of LaunchedEffect blocks. A navigation system built on string
concatenation. No code documentation. No naming conventions. No
architectural rules. The only documentation that existed were FSDs and
TSDs for feature specs, nothing about how the code should be structured.

By Friday, I had a pretty clear picture. This wasn't just tech debt.
This was an architecture that had grown organically, sprint after
sprint, without anyone stepping back to ask: "Wait, should we actually
be doing it this way?"

Let me show you what I found.

## 2. The Numbers Don't Lie

Before we dive into the code, let's just look at the raw numbers. These
aren't estimates. I counted them.

-   60+ Gradle Modules
-   248 ViewModels
-   93 VMs in ONE module
-   2 Legacy State Patterns

Let that sink in. 248 ViewModels and 93 of those (more than a third)
lived inside a single module.

The actual module dependency graph was a flat web of dependencies.
Modules depended on each other in every direction: up, down, sideways.
`core-polis-impl` knew about `bcalife-ui-polis`. UI modules depended on
other UI modules. Implementation modules reached across domain
boundaries.

There was no layering. No separation of concerns at the module level.
Just a flat web of 60+ nodes, all tangled together.

## 3. The Copy-Paste Army

Here's the pattern that created 248 ViewModels. I call it the
1-UseCase-per-ViewModel pattern.

Every API call got its own ViewModel. Not every screen. Not every
feature. Every single API call.

``` kotlin
class GetPolisViewModel(private val usecase: GetPolis) : ViewModel() {
    private val _getPolisResponse = mutableStateOf<ResultOf<GetPolisResponse>?>(null)
    val getPolisResponse: State<ResultOf<GetPolisResponse>?> get() = _getPolisResponse

    fun getPolis(parameter: GetPolisParameter) {
        viewModelScope.launch {
            usecase(parameter).collect { _getPolisResponse.value = it }
        }
    }

    fun clearData() { _getPolisResponse.value = null }
}
```

``` kotlin
class DoVerificationDOBViewModel(private val usecase: DoVerificationDOB) : ViewModel() {
    private val _doVerificationDOBResponse =
        mutableStateOf<ResultOf<DoVerificationDOBResponse>?>(null)
    val doVerificationDOBResponse: State<ResultOf<DoVerificationDOBResponse>?>
        get() = _doVerificationDOBResponse

    fun doVerificationDOB(parameter: DoVerificationDOBParameter) {
        viewModelScope.launch {
            usecase(parameter).collect { _doVerificationDOBResponse.value = it }
        }
    }

    fun clearData() { _doVerificationDOBResponse.value = null }
}
```

The structure is identical. The only things that change are the class
name, UseCase type, and response type.

This pattern was copy-pasted 70+ times:

-   `DoAddPolisViewModel`
-   `DoRefreshPolisViewModel`
-   `DoDeleteBeneficiaryViewModel`
-   `GetAddressProvinceViewModel`
-   `GetAddressDistrictViewModel`
-   `GetAddressWardViewModel`
-   `GetAddressCityViewModel`
-   `GetCountNotificaitonViewModel`
-   `DoSubmitClaimViewModel`
-   `DoUploadDocumentViewModel`

A screen needing 3 API calls got 3 separate ViewModels, all managing
independent state. Coordinating between them became the Composable's
problem.

## 4. Pick Your Fighter: 2 State Patterns

Two different patterns coexisted in the same project.

### Pattern A: Compose mutableStateOf

``` kotlin
private val _getPolisResponse = mutableStateOf<ResultOf<GetPolisResponse>?>(null)
val getPolisResponse: State<ResultOf<GetPolisResponse>?> get() = _getPolisResponse
```

`mutableStateOf` comes from `androidx.compose.runtime`, creating a
Compose runtime dependency directly inside the ViewModel.

### Pattern B: Individual MutableStateFlow fields

``` kotlin
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

Thirty-seven `MutableStateFlow` fields. Each one emitting independently.

Two patterns. Same project. No documentation on which one to use. New
developers copied whatever file was next to theirs, and the cycle
continued.

## 5. The 37-Field Monster

`SubmissionViewModel.kt`: 906 lines and 37 individually declared
`MutableStateFlow` fields.

There were clear clusters of related state: policy selection, claim
type, causes, validation, form data, UI toggles. In a modern
architecture these would be grouped into data classes. Instead, they
were flat independent flows.

``` kotlin
private val _fieldName = MutableStateFlow(defaultValue)
val fieldName: StateFlow<Type> = _fieldName.asStateFlow()
```

To test the ViewModel you needed to set up mocks for every dependency,
understand how 37 state fields interacted, track which functions updated
which fields, and assert against individual emissions.

In practice, nobody tested it. The SubmissionViewModel had zero unit
tests. Not because the team was lazy, but because testing it was
genuinely impractical.

That's the real cost of poor architecture. It's not just ugly code. It's
code that can't be safely changed because there's no test safety net,
and there's no test safety net because the code is untestable.

## 6. When Composables Become ViewModels

The boundary between UI and logic had dissolved.

### Exhibit A: The 1,234-Line LaunchedEffect Handler

`HandlerSubmissionV3.kt`, 1,234 lines. A Composable function whose body
was a chain of `LaunchedEffect` blocks watching state and triggering
side effects.

These blocks were acting as mini-ViewModels embedded directly in the UI
layer.

### Exhibit B: 8 ViewModels, 1 Screen

``` kotlin
homeArticleViewModel: HomeArticleViewModel = koinViewModel(),
homePromoViewModel: HomePromoViewModel = koinViewModel(),
homeScreenViewModel: HomeScreenViewModel = koinViewModel(),
homeScreenDataViewModel: HomeScreenDataViewModel = koinViewModel(),
notificationViewModel: GetCountNotificationViewModel = koinViewModel(),
homeMenuViewModel: HomeMenuViewModel = koinViewModel(),
viewModel: HomeViewModel = koinViewModel(),
getProfileMeViewModel: GetProfileMeViewModel = koinViewModel(),
```

Eight ViewModels for one screen. Each managed its own slice of state.
None coordinated with each other. The Composable itself became the
orchestration layer.

### Exhibit C: State Objects in the Composable

``` kotlin
val policyState by remember { mutableStateOf(SubmissionClaimPolicyState()) }
val claimTypeState by remember { mutableStateOf(SubmissionClaimTypeState()) }
val causeOfTreatmentState by remember {
    mutableStateOf(SubmissionClaimCausesState(CAUSE_OF_TREATMENT))
}
val causeOfDeathState by remember {
    mutableStateOf(SubmissionClaimCausesState(CAUSE_OF_DEATH))
}
val causeOfDefectState by remember {
    mutableStateOf(SubmissionClaimCausesState(CAUSE_OF_DEFECT))
}
```

These were domain-level state objects living inside a Composable and
dying on configuration change.

## 7. Navigation by String Concatenation

Type-safe navigation in Jetpack Compose only hit its first alpha in May
2024, right before I joined. Before that, string-based routes were the
industry standard.

The implementation used sealed classes and constants:

``` kotlin
sealed class ScreenPolis(val route: String = "") {
    object Polismu : ScreenPolis("polis-polismu")
    object Polis : ScreenPolis("polis-polis")
    object Detail : ScreenPolis("polis-detail")
    object Verification : ScreenPolis("polis-verification-otp")
}
```

``` kotlin
object NavArgsPolis {
    const val policyNumber = "polis_number"
    const val type = "type"
    const val email = "email"
    const val date = "date"
    const val optionalArgs = "?args="
}
```

In practice:

``` kotlin
composable(
    route = routeVerification +
        "/{${NavArgsPolis.policyNumber}}" +
        "?type={${NavArgsPolis.type}}" +
        "?date={${NavArgsPolis.date}}" +
        "&email={${NavArgsPolis.email}}",
)
```

``` kotlin
navController.navigate(
    routeVerification +
        "/${args.polisNumber}" +
        "?type=${args.type}" +
        "?date=${args.date}" +
        "&email=${args.email}",
)
```

The compiler is blind here. It sees strings. It doesn't know if the
route definition and navigate call match.

This creates character-level dependencies, silent argument mismatches,
and refactoring ghosts where everything compiles but a route fails only
at runtime.

> I want to be clear about something: this wasn't built by bad
> developers. It was built by a team under pressure, deadline after
> deadline, sprint after sprint. When you're shipping features every two
> weeks and there's no time budgeted for architecture, you do what
> works.
>
> Until adding a new feature takes three weeks instead of three days
> because nobody can figure out which of the 8 ViewModels is responsible
> for the bug. Until a simple refactor breaks navigation because a
> string was wrong. Until a new developer joins and spends their entire
> first sprint just trying to understand the module graph.
>
> This codebase was a house of cards. And adding a new window cost more
> than building a new wall.
>
> Something had to change.
