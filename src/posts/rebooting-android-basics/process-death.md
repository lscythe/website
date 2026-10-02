---
title: "Process Death – The Invisible Crash"
pubDate: 2026-03-07
series: "Rebooting Android Basics"
tag: ["android", "process-death", "saved-state", "lifecycle"]
---

Process death is a system-managed teardown, not a crash. Android can
kill a background process to reclaim RAM, and the app must be able to
reconstruct itself.

## The History

Developers manually serialized state into `onSaveInstanceState(Bundle)`
and sometimes relied on static fields or singletons that disappear when
the process dies.

## The Modern Way

### SavedStateHandle

``` kotlin
class SearchViewModel(
    private val savedStateHandle: SavedStateHandle
) : ViewModel() {
    val query = savedStateHandle.getStateFlow("search_query", "")

    fun updateQuery(newQuery: String) {
        savedStateHandle["search_query"] = newQuery
    }
}
```

### rememberSaveable

``` kotlin
var isExpanded by rememberSaveable { mutableStateOf(false) }
```

### DataStore & Room

Use durable storage for critical data such as preferences, drafts, and
data that must survive process death.

## How to Test Process Death

1.  Open the app and enter data.
2.  Press Home.
3.  Run:

``` bash
adb shell am kill <your.package.name>
```

4.  Reopen the app from Recents.

"Don't keep activities" in Developer Options is also useful for
aggressively exercising lifecycle recreation.

## The "Junior" Gotcha: The In-Memory Trap

``` kotlin
object UserCache {
    val userData: User? = null
}
```

Singletons and ViewModel memory do not survive process death. Critical
state must be backed by saved state or durable storage.

## Quick Self-Check

WorkManager survives process death because its work is persisted.
`SavedStateHandle` should not contain large data because Bundle
transactions have size limits. Standard Navigation Compose state can
restore the backstack.

## Series Reflections

The series covered:

-   Architecture: Single Activity, lifecycle, and modern Result APIs.
-   UI: View vs Compose and the rendering pipeline.
-   Stability: Memory leaks, threading, and process death.

Modern Android development is about predictability. Understanding these
fundamentals moves an app from "making it work" to "making it
resilient."
