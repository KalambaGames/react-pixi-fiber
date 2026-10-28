---
"@react-pixi-fiber/pixi-4": minor
"@react-pixi-fiber/pixi-5": minor
"@react-pixi-fiber/pixi-6": minor
"@react-pixi-fiber/pixi-7": minor
"@react-pixi-fiber/pixi-8": minor
"react-pixi-fiber": minor
---

`<AnimatedSprite playing />` plays the sprite, and `playing={false}` stops it. A change to `textures` no longer stops a sprite that plays. It continues from frame 0 of the new textures. A finished sprite with `loop={false}` plays again from frame 0 when `playing` changes to `true`. When you remove `playing`, the sprite stops. Without `playing`, you start the sprite through a ref as before.
