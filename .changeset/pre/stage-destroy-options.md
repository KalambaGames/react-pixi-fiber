---
"react-pixi-fiber": minor
"@react-pixi-fiber/pixi-4": minor
"@react-pixi-fiber/pixi-5": minor
"@react-pixi-fiber/pixi-6": minor
"@react-pixi-fiber/pixi-7": minor
"@react-pixi-fiber/pixi-8": minor
---

`Stage` takes two new props. `destroyOptions` sets what an unmount destroys. `Stage` passes it to `app.destroy`. The default stays `true`, and a recreate still passes `false`. `Stage` calls `onBeforeDestroy(app)` before it destroys an application that it created, also on a recreate. The adapters add only the `DestroyOptions` type of their PixiJS version.
