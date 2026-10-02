---
title: "Resources & Configuration Changes – Rotation, Dark Mode, and Beyond"
pubDate: 2026-03-03
series: "Rebooting Android Basics"
tag: ["android", "configuration-changes", "resources", "state-restoration"]
---

Android normally recreates an Activity after configuration changes so
resources can be loaded for the new configuration.

## The History

Developers manually saved UI state using `onSaveInstanceState` or
bypassed recreation with `android:configChanges`, taking responsibility
for resource updates themselves.

## The Modern Way

### `rememberSaveable`

``` kotlin
@Composable
fun Counter() {
    var count by rememberSaveable { mutableIntStateOf(0) }

    Button(onClick = { count++ }) {
        Text("Count is $count")
    }
}
```

### Automatic resource adaptation

``` kotlin
@Composable
fun ThemedScreen() {
    val isDark = isSystemInDarkTheme()

    MaterialTheme(colorScheme = if (isDark) darkScheme else lightScheme) {
        Text(text = stringResource(R.string.welcome_message))
    }
}
```

Manual `onConfigurationChanged` handling is generally reserved for
specialized performance-heavy components.

## The "Junior" Gotcha

Custom state holders need a `Saver` or `rememberSaveable` if they must
survive Activity recreation. Also avoid hardcoded colors that ignore
theme changes.

## Summary

Compose embraces Activity recreation and combines recomposition with
saveable state to make configuration changes less painful.
