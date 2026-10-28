---
"@react-pixi-fiber/pixi-8": patch
---

An unmounted `Graphics` destroys the `GraphicsContext` that it created. Before, that context and its GPU data stayed in memory. PixiJS 8.15 and later can release them after a time, but only when its garbage collector is on. A `GraphicsContext` from the `context` prop is not destroyed.
