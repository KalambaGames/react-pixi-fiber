---
"react-pixi-fiber": patch
---

In development, `withApp` writes a warning when it gets no `PIXI.Application`. This occurs outside `<Stage />` and `<AppProvider />`. The wrapped component still gets `app={null}`, as before. The warning occurs one time for each wrapped component.
