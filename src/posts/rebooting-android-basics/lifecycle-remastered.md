---
title: "Lifecycle Re-Mastered – From Callbacks to LifecycleOwner"
pubDate: 2026-02-24
series: "Rebooting Android Basics"
tag: ["android", "lifecycle", "coroutines", "jetpack-compose"]
---

Modern APIs such as `repeatOnLifecycle` and
`collectAsStateWithLifecycle` prevent zombie collections, background
battery drain, and lifecycle-related crashes.

## The History

``` kotlin
override fun onResume() {
    super.onResume()
    viewModel.startObserving()
}

override fun onPause() {
    super.onPause()
    viewModel.stopObserving()
}
```

Manual cleanup is easy to forget. Plain `lifecycleScope.launch` can also
keep collecting while the UI is not visible.

## The Modern Way

### `collectAsStateWithLifecycle`

``` kotlin
@Composable
fun HomeScreen(viewModel: HomeViewModel) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    when (uiState) {
        is UiState.Success -> Text("Data: ${uiState.data}")
        is UiState.Loading -> LoadingIndicator()
    }
}
```

### `repeatOnLifecycle`

``` kotlin
LaunchedEffect(Unit) {
    lifecycleOwner.repeatOnLifecycle(Lifecycle.State.STARTED) {
        viewModel.events.collect { handleEvent(it) }
    }
}
```

## The "Junior" Gotcha

A plain `collectAsState()` can keep collecting after the app is
minimized. Prefer lifecycle-aware variants for UI-bound work.

## Quick Self-Check

`STARTED` is useful because work runs while the result is visible.
`repeatOnLifecycle` cancels its block below the target state and
restarts it when the state returns.

## Summary

Use `collectAsStateWithLifecycle` for state and `repeatOnLifecycle` for
lifecycle-bound custom collection.
