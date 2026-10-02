---
title: "Memory Leak Hunting – The Modern Culprits"
pubDate: 2026-03-05
series: "Rebooting Android Basics"
tag: ["android", "memory-leaks", "performance", "coroutines"]
---

Modern leaks often happen where UI lifecycle meets asynchronous work or
interop.

## The History

Classic leaks came from static Activity references, inner AsyncTasks,
and singletons. LeakCanary became essential for identifying retained
object graphs.

## The Modern Way

### Captured Context in Lambdas

Use Application Context for long-running non-UI work, and avoid passing
persistent Activity references into ViewModels.

### Undisposed Coroutine Scopes

Prefer `viewModelScope` or `rememberCoroutineScope()` instead of
unmanaged custom scopes.

### Zombie Flow Collections

Use `collectAsStateWithLifecycle()` so UI-bound collection stops when
the lifecycle drops.

### Interop Cleanup

Use `AndroidView.onRelease` to destroy or clear wrapped components when
needed.

## The "Junior" Gotcha: Anonymous Listeners

``` kotlin
DisposableEffect(Unit) {
    val listener = MyLocationListener()
    manager.requestLocationUpdates(listener)

    onDispose {
        manager.removeUpdates(listener)
    }
}
```

## Summary

Memory management in modern Android is about lifecycle. If a Coroutine,
Flow, listener, or View lives longer than the UI it serves, it can
become a leak.
