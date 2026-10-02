---
title: "Intents & Deep Links – From Starts to Routes"
pubDate: 2026-02-26
series: "Rebooting Android Basics"
tag: ["android", "navigation", "deep-links", "intents"]
---

In a Single-Activity world, Intents increasingly act as external entry
points while internal navigation becomes route-based.

## The History

Apps manually parsed Intents in Activities, extracted URI values, and
launched additional Activities. This duplicated parsing logic and often
created a flat backstack.

## The Modern Way

Manifest entry:

``` xml
<activity android:name=".MainActivity" android:exported="true">
    <intent-filter>
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        <data android:scheme="myapp" android:host="profile" />
    </intent-filter>
</activity>
```

Type-safe route:

``` kotlin
composable<ProfileRoute>(
    deepLinks = listOf(
        navDeepLink<ProfileRoute>(basePath = "myapp://profile")
    )
) { backStackEntry ->
    val route: ProfileRoute = backStackEntry.toRoute()
    ProfileScreen(id = route.id)
}
```

Navigation can build a synthetic backstack so entering at Profile can
still provide Home as a logical parent.

## The "Junior" Gotcha

Deep links can arrive while the Activity is already alive.

``` kotlin
override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)
    navController.handleDeepLink(intent)
}
```

## Summary

Intents evolved from raw screen switches into route-based external entry
points. Navigation Compose centralizes parsing and backstack behavior.
