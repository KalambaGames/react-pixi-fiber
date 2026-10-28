---
"@react-pixi-fiber/pixi-5": patch
"@react-pixi-fiber/pixi-6": patch
"@react-pixi-fiber/pixi-7": patch
"react-pixi-fiber": minor
---

A behavior can list in `constructorOnly` the props that its `create` gives to the constructor and that PixiJS cannot change later. The core does not write these props. In development, under `StrictMode`, a change to one of them after mount warns one time. Give the element a new `key` to change such a prop.

`<Graphics geometry={geometry} />` no longer throws `Cannot set property geometry` on PixiJS 5, 6 and 7. The Graphics uses the geometry from its constructor.
