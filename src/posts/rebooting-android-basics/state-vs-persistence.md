---
title: "State vs. Persistence – Memory, Process Death, and Disk"
pubDate: 2026-02-28
series: "Rebooting Android Basics"
tag: ["android", "state-management", "persistence", "jetpack-compose"]
---

Match persistence to data lifespan: memory for transient state,
`SavedStateHandle` for process-death recovery, and disk for durable
persistence.

## The History

State was commonly split between manual `onSaveInstanceState` Bundles
and synchronous `SharedPreferences`, making restoration fragile.

## The Modern Way

### ViewModel

Survives configuration changes, but not process death.

### SavedStateHandle

``` kotlin
class FormViewModel(private val savedStateHandle: SavedStateHandle) : ViewModel() {
    val queryFlow = savedStateHandle.getStateFlow("query_key", "")

    fun updateQuery(newQuery: String) {
        savedStateHandle["query_key"] = newQuery
    }
}
```

### DataStore

``` kotlin
val Context.settingsDataStore by preferencesDataStore(name = "settings")

val darkModeFlow = context.settingsDataStore.data.map {
    it[DARK_MODE_KEY] ?: false
}

context.settingsDataStore.edit { settings ->
    settings[DARK_MODE_KEY] = true
}
```

## The "Junior" Gotcha

A form backed only by in-memory ViewModel state can disappear after
process death. User-entered values should be backed by
`SavedStateHandle` when appropriate.

Avoid using DataStore for rapid character-by-character UI changes; use
in-memory/saved state for live editing and disk for durable saving.

## Summary

Use ViewModel for fast memory, `SavedStateHandle` for UI recovery, and
DataStore for settings that must survive process and device restarts.
