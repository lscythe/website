---
title: "The Context Tree – Application vs. Activity"
pubDate: 2026-02-20
series: "Rebooting Android Basics"
tag: ["android", "context", "memory-leaks"]
---

Understanding the Android Context hierarchy, when to use Application
vs. Activity context, and why picking the wrong one leads to memory
leaks.

In the previous post, we laid out the roadmap for modernizing our
foundational knowledge. Now we dive into the most essential and arguably
most leak-prone piece of the Android engine: Context.

Even in a pure Compose project, Context still trips people up.
`LocalContext.current` is incredibly convenient, but misuse it and
you'll create memory leaks that survive rotations, back navigation, and
configuration changes.

### What Is Context, Really?

Context is your "handle" to the Android system. You need it for almost
everything: fetching resources, accessing system services, starting
Activities, and reading files.

Application Context lives for the app process. Activity Context lives
for a screen and dies when that Activity is destroyed. In Compose,
`LocalContext.current` usually provides the Activity Context.

| Aspect | Application Context | Activity Context (`LocalContext.current`) |
|---|---|---|
| Lifespan | App process lifetime | Activity lifecycle |
| UI Operation | Limited | Full |
| Memory Leak Risk | Low | High if retained |
| Best For | Repositories, WorkManager, app-wide singletons | Short-lived UI tasks |

## The History: "We used to do it like this..."

``` kotlin
object AnalyticsManager {
    lateinit var context: Context

    fun init(c: Context) {
        this.context = c
    }
}
```

If an Activity is passed into a singleton, the Activity can remain
pinned after rotation along with its View hierarchy and bitmaps.

## The Modern Way: "Now we do this..."

### 1. Prefer Application Context for long-lived objects

``` kotlin
class DataRepository @Inject constructor(
    @ApplicationContext private val context: Context
) {
    // Safe for database paths or system services
}
```

### 2. Use `LocalContext.current` for transient UI tasks

``` kotlin
@Composable
fun ProfileScreen() {
    val context = LocalContext.current

    Button(onClick = {
        val intent = Intent(context, SettingsActivity::class.java)
    }) {
        Text("Go to Settings")
    }
}
```

### 3. Derive Application Context when needed

``` kotlin
@Composable
fun VideoPlayer() {
    val appContext = LocalContext.current.applicationContext

    val exoPlayer = remember {
        ExoPlayer.Builder(appContext).build()
    }

    DisposableEffect(Unit) {
        onDispose { exoPlayer.release() }
    }
}
```

## The "Junior" Gotcha

Capturing an Activity Context inside long-lived listeners or scopes can
leak it.

``` kotlin
@Composable
fun SafeLocationTracker() {
    val appContext = LocalContext.current.applicationContext

    DisposableEffect(Unit) {
        val manager = appContext.getSystemService(LOCATION_SERVICE) as LocationManager
        val listener = LocationListener { /* ... */ }
        manager.requestLocationUpdates("gps", 0L, 0f, listener)

        onDispose {
            manager.removeUpdates(listener)
        }
    }
}
```

## Quick Self-Check

-   Dialogs require an Activity Context because they need a Window
    Token.
-   ViewModels should use Application Context when context is
    unavoidable.

### Summary

Context is the glue of your app. Use `LocalContext.current` for
immediate UI work, but default to Application Context for anything that
survives a single screen.
