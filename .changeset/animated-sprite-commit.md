---
"@react-pixi-fiber/pixi-4": minor
"@react-pixi-fiber/pixi-5": minor
"@react-pixi-fiber/pixi-6": minor
"@react-pixi-fiber/pixi-7": minor
"@react-pixi-fiber/pixi-8": minor
---

`<AnimatedSprite playing />` starts the sprite when React commits it, in `afterMount`. A render that React drops no longer leaves the sprite on the shared ticker. The adapter needs a core that calls `afterMount`. Update your React adapter too: an older React adapter does not call `commitMount`, so the sprite does not start on mount.
