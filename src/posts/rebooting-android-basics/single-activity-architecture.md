---
title: "The Modern Activity – Single-Activity Architecture"
pubDate: 2026-02-23
series: "Rebooting Android Basics"
tag: ["android", "architecture", "jetpack-compose", "navigation"]
---

After digging into Context, it feels natural to move to the host itself:
the Activity.

In the modern era of Jetpack Compose, Activity management has
fundamentally changed. We've moved away from multi-Activity sprawl
toward a Single-Activity architecture.

### Why Single-Activity Dominates

A single `ComponentActivity` acts as the window host and launches a
`NavHost`. Screens become Composable destinations.

## The History

Older Android apps commonly used an Activity for every screen. Later
came Single Activity + many Fragments, bringing complex lifecycle and
Fragment transaction concerns.

## The Modern Way

``` kotlin
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MyAppTheme {
                val navController = rememberNavController()
                NavHost(navController, startDestination = "home") {
                    composable("home") { HomeScreen(navController) }
                    composable("profile/{userId}") { backStackEntry ->
                        val userId = backStackEntry.arguments?.getString("userId")
                        ProfileScreen(userId, navController)
                    }
                }
            }
        }
    }
}
```

Advantages include smooth transitions, shared scoped state, removal of
Fragment transactions, and automatic NavHost state preservation.

## The "Junior" Gotcha

Do not trigger heavy initialization every time a Composable returns to
composition.

``` kotlin
@Composable
fun HomeScreen(navController: NavController, viewModel: MyViewModel = viewModel()) {
    LaunchedEffect(Unit) {
        viewModel.loadHeavyData()
    }
}
```

Track loading state in the ViewModel so returning to a screen does not
repeat expensive work unnecessarily.

## Quick Self-Check

Fragments are primarily useful as a legacy bridge in Compose-first apps.
Additional Activities are generally reserved for dedicated system-level
entry points.

## Summary

Single-Activity architecture reduces lifecycle complexity. Screens
become state + UI rather than heavyweight OS components.
