---
"react-pixi-fiber": minor
---

A filter is a child element of the Display Object it filters, a `Sprite`, a `Container` or any other object with a `filters` property: `<Sprite><BlurFilter blur={2} /></Sprite>`. A filter element is not a Display Object. The core writes it into the parent's `filters` array in JSX order, not into `children`. `enabled` disables a filter. A Suspense fallback disables it until the content shows.

`AlphaFilter`, `BlurFilter`, `ColorMatrixFilter`, `DisplacementFilter` and `NoiseFilter` are tags, imported from `react-pixi-fiber` like `Sprite`. `PIXIFilter(type, behavior)` registers another filter class, for example one from `pixi-filters`.

The core destroys the filters it created, when the filter element or an ancestor unmounts. PixiJS never destroys a filter with its object, so a filter from the `filters` prop is yours to destroy. An adapter can provide the optional `PixiAdapter.releaseFilter(filter)` to release a filter instead of `filter.destroy()`.

A `filters` value on an element with filter children throws. Use one of the two. In development, under StrictMode, a change to a prop that the filter did not have before its first write logs a warning. The constructor reads that option, so a new `key` is the way to change it.
