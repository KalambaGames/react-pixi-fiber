---
"react-pixi-fiber": minor
---

`usePixiTicker(fn, options)` takes an optional second argument. `enabled: false` removes the callback from the ticker without an unmount, and `enabled: true` adds it back. `priority` is the PixiJS `UPDATE_PRIORITY` that `ticker.add` receives. The one-argument call works as before.
