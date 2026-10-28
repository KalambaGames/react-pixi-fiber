---
"react-pixi-fiber": patch
---

`usePixiTicker(fn, options)` adds one listener to the ticker and calls the `fn` from the latest render on each tick. A new `fn` no longer removes the listener and adds it again, so an inline `fn` keeps its place among listeners with the same priority. Only a change to `enabled` or `priority` adds the listener again.
