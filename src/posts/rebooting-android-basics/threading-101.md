---
title: "Threading 101 – Mastering Dispatchers and Coroutines"
pubDate: 2026-03-06
series: "Rebooting Android Basics"
tag: ["android", "coroutines", "threading", "dispatchers"]
---

Android's threading rule is simple: Main Thread = UI Thread. Blocking it
freezes rendering and input and risks ANRs.

## The History

`AsyncTask`, raw Threads, HandlerThreads, and callbacks were difficult
to cancel and easy to couple to stale Activities.

## The Modern Way

### Dispatchers.Main

Use for UI state, Views, touch handling, and lightweight UI work.

### Dispatchers.IO

Use for blocking network, database, and file operations.

``` kotlin
viewModelScope.launch {
    val data = withContext(Dispatchers.IO) {
        repository.fetchRemoteUsers()
    }
    _uiState.value = UiState.Success(data)
}
```

### Dispatchers.Default

Use for CPU-heavy work such as parsing, calculations, sorting, and image
processing.

## The "Junior" Gotcha

`LaunchedEffect` and `viewModelScope` do not automatically mean
background thread.

``` kotlin
@Composable
fun BadLoader() {
    var data by remember { mutableStateOf("") }

    LaunchedEffect(Unit) {
        data = api.fetchUserSync().toString()
    }

    Text(data)
}
```

Move blocking work to `Dispatchers.IO` or use suspend APIs that switch
appropriately.

## Summary

Keep Main light. Use IO for blocking data work and Default for CPU work.
Structured concurrency keeps work cancellable and lifecycle-aware.
