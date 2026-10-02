---
title: "View Groups vs. Composables – Measure-Layout-Draw vs Composition-Layout-Drawing"
pubDate: 2026-03-02
series: "Rebooting Android Basics"
tag: ["android", "jetpack-compose", "ui", "performance"]
---

The classic View system uses recursive ViewGroups and a Measure → Layout
→ Draw cycle. Compose uses Composition → Layout → Drawing with targeted
recomposition.

## The History

Deep View hierarchies could cause broad remeasurement and relayout after
changes. UI was updated imperatively with calls such as `setText()` and
`setVisibility()`.

## The Modern Way

Compose describes UI for a state and tracks which state is read by which
Composable.

``` kotlin
@Composable
fun ItemCard(title: String) {
    Row {
        AsyncImage(model = "...", contentDescription = null)
        Text(text = title)
    }
}
```

## The "Junior" Gotcha

Avoid doing heavy work in Composables and avoid rendering large
collections using a plain `Column`.

``` kotlin
LazyColumn {
    items(items, key = { it.id }) { item ->
        Text(item.name)
    }
}
```

Keys help Compose identify stable items and skip unnecessary work.

## Summary

ViewGroups are imperative and traversal-heavy; Compose is declarative
and can target recomposition to the scopes affected by state changes.
