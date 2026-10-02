---
title: "The Cure"
description: "The modern standard I built, and how I shipped it without burning down the house"
pubDate: 2026-03-09
series: "Migrating Legacy Code"
tag: ["android", "architecture", "state-management", "jetpack-compose", "navigation"]
---

The modern standard I built, and how I shipped it without burning down
the house

Parts 1 and 2 were the diagnosis. This is the prescription. Everything
here is real, running in production, and I migrated it incrementally
while the legacy app continued to ship features. No big bang rewrites.
No "stop the world" sprints. Just disciplined, feature-by-feature
migration with QA testing both old and new flows in parallel.

If you read the first two parts and thought "okay, so what do you
actually replace it with?" This is that article.

## 1. The Target Architecture

The legacy codebase had modules organized by technical layer with no
clear ownership. The new architecture organizes by feature domain, with
each domain owning all three layers:

``` text
feature/hospital/     // UI, ViewModels, navigation
domain/hospital/      // Use cases, domain models, repository interfaces
data/hospital/        // Repository implementations, data sources, DTOs
core/common/          // Shared utilities, base classes
core/network/         // HTTP client configuration
```

Every feature gets three modules. The feature module owns the screens
and ViewModels. The domain module owns the business logic: use cases,
models, and interfaces for repositories. The data module implements
those interfaces. Core modules are shared infrastructure that everyone
depends on.

This is not some theoretical pattern from a conference talk. It is the
actual structure I built, and it solves almost every problem from Part 1
in one shot: god modules disappear because each module is small and
focused. Circular dependencies disappear because the dependency rule is
enforced by Gradle. If you try to depend upward, it will not compile.

Dependencies flow downward. Features depend on domain. Data implements
domain. Core serves everyone.

The Dependency Rule: source code dependencies point inward only.

## 2. The Contract Pattern

In the legacy code, state was scattered across dozens of
`MutableStateFlow` fields, events were implicit, and side effects were
tangled into `LaunchedEffect` blocks across multiple composables. The
new pattern puts everything in one file, in one contract.

Three sealed types. That is the entire API surface between a screen and
its ViewModel:

-   Events: what the user does. Clicks, selections, form input. The
    screen sends these up to the ViewModel.
-   State: what the screen shows. One immutable data class. The
    ViewModel sends this down to the screen.
-   Effects: one-time side effects. Navigation, toasts, bottom sheets.
    Fire-and-forget, never replayed on recomposition.

``` kotlin
sealed interface HospitalSelectPolicyEvent : ViewEvent {
    data class OnSelectPolicy(val policy: PolicyUIModel) : HospitalSelectPolicyEvent
    data class OnSelectInsuredName(val insuredName: PolicyInsuredUIModel) : HospitalSelectPolicyEvent
    data object OnClickNext : HospitalSelectPolicyEvent
    data object OnClickSkip : HospitalSelectPolicyEvent
}

@Immutable
data class HospitalSelectPolicyState(
    val policies: Policies = Policies(persistentListOf()),
    val insuredNames: InsuredNames = InsuredNames(persistentListOf()),
    val selectedPolicy: PolicyUIModel? = null,
    val selectedInsuredName: PolicyInsuredUIModel? = null,
    val isButtonEnabled: Boolean = false,
) : ViewState

sealed interface HospitalSelectPolicyEffect : ViewSideEffect {
    data object NavigateBack : HospitalSelectPolicyEffect
    data object NavigateToHospitalList : HospitalSelectPolicyEffect
    data class ShowListBottomSheet(
        val content: DropdownSheetContent
    ) : HospitalSelectPolicyEffect
}
```

All in one file. All type-safe. All immutable. You open the contract
file and immediately know what the user can do, what the screen
displays, and what one-time actions the ViewModel can trigger.

## 3. One ViewModel, One Screen

Remember Part 1? One screen pulling from four, five, sometimes six
ViewModels. The new rule is dead simple: one ViewModel per screen. No
exceptions.

It starts with the base class:

``` kotlin
abstract class BaseViewModel<
    UIEvent: ViewEvent,
    UIState: ViewState,
    UIEffect: ViewSideEffect,
> : ViewModel() {

    abstract fun setInitialState(): UIState
    abstract fun handleEvents(event: UIEvent)

    private val _uiState = MutableStateFlow(setInitialState())
    val uiState: StateFlow<UIState> = _viewState.asStateFlow()

    private val _event = MutableSharedFlow<UIEvent>()
    private val _effect = Channel
}
```
