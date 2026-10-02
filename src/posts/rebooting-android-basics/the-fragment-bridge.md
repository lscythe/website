---
title: "The Fragment Bridge – Still Relevant?"
pubDate: 2026-02-25
series: "Rebooting Android Basics"
tag: ["android", "fragments", "jetpack-compose", "lifecycle"]
---

Fragments have shifted from the default modular UI tool to a migration
bridge for legacy and hybrid applications.

## The History

Fragments introduced a double lifecycle: the Fragment instance can
remain alive while its View is destroyed. Observing against the wrong
lifecycle created leaks and zombie observers.

## The Modern Way

``` kotlin
class ComposeFeatureFragment : Fragment() {
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
                MyAppTheme {
                    FeatureScreenContent(userId = arguments?.getString("userId"))
                }
            }
        }
    }
}
```

## The "Junior" Gotcha

Use the View lifecycle, not the Fragment lifecycle:

``` kotlin
viewLifecycleOwner.lifecycleScope.launch {
    viewLifecycleOwner.repeatOnLifecycle(Lifecycle.State.STARTED) {
        viewModel.data.collect { updateUI(it) }
    }
}
```

## Summary

Fragments are a bridge, not the destination. In migrations, respecting
the split between Fragment and View lifecycles is essential.
