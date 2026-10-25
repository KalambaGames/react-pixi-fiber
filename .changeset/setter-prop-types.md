---
"react-pixi-fiber": patch
"@react-pixi-fiber/pixi-8": patch
---

With the PixiJS 8 adapter, a prop accepts what the PixiJS setter accepts, not only what the getter returns. `<Text style={{ fill: "white" }} />`, the same `style` on `BitmapText` and `HTMLText`, the same props of a `PIXIComponent`, and properties that plugins add, for example the `layout` prop of `@pixi/layout` as a style object or as `true`, type-check. Before, they needed a `PIXIComponent` with the props declared by hand.

The `style` prop of `Text` has the PixiJS style types instead of `unknown`. A style object whose literal fields TypeScript widens to `string`, for example `fontWeight: "bold"` in an object without `as const`, needs `as const` or a type annotation.

`PIXIComponent<T>` takes the instance type alone, without the props type.
