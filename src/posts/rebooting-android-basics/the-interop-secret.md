---
title: "The Interop Secret – Mixing Views and Compose"
pubDate: 2026-03-04
series: "Rebooting Android Basics"
tag: ["android", "jetpack-compose", "interop", "migration"]
---

Interop lets teams modernize incrementally instead of rewriting entire
applications.

## The Modern Way

### AndroidView: Views inside Compose

``` kotlin
@Composable
fun LegacyMapScreen() {
    AndroidView(
        factory = { context ->
            MapView(context).apply {
                onCreate(Bundle())
            }
        },
        update = { view ->
            view.onResume()
        },
        onRelease = { view ->
            view.onPause()
            view.onDestroy()
        }
    )
}
```

### ComposeView: Compose inside Views

``` kotlin
class LegacyFragment : Fragment() {
    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        return ComposeView(requireContext()).apply {
            setViewCompositionStrategy(
                ViewCompositionStrategy.DisposeOnViewTreeLifecycleDestroyed
            )
            setContent {
                MaterialTheme {
                    Text("I'm Compose inside an old Fragment!")
                }
            }
        }
    }
}
```

## The "Junior" Gotcha

Lifecycle mismatch is the major risk. In Fragments, use
`DisposeOnViewTreeLifecycleDestroyed`. Keep `AndroidView.update`
lightweight because it can execute repeatedly during recomposition.

## Summary

`AndroidView` brings legacy Views into Compose; `ComposeView` brings
Compose into existing View hierarchies. Lifecycle cleanup makes
incremental migration safe.
