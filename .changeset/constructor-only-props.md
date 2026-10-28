---
"@react-pixi-fiber/pixi-4": patch
"@react-pixi-fiber/pixi-5": patch
"@react-pixi-fiber/pixi-6": patch
"@react-pixi-fiber/pixi-7": patch
"@react-pixi-fiber/pixi-8": patch
"react-pixi-fiber": minor
---

A behavior can list in `constructorOnly` the props that its `create` gives to the constructor and that PixiJS cannot change later. The core does not write these props. In development, under `StrictMode`, a change to one of them after mount warns one time. Give the element a new `key` to change such a prop.

`<Graphics geometry={geometry} />` no longer throws `Cannot set property geometry` on PixiJS 5, 6 and 7. The Graphics uses the geometry from its constructor.

A change after mount to these props now changes the Scene Object:

- BitmapText: `style` on PixiJS 4 to 7.
- Mesh: `uvs` and `indices` on PixiJS 4.
- MeshPlane: `verticesX` and `verticesY`.
- MeshRope: `points`, and `textureScale` on PixiJS 5 to 8.
- MeshSimple: `uvs` and `indices`, and `topology` on PixiJS 8.
- ParticleContainer: `properties` on PixiJS 5 to 7.
- PerspectiveMesh: `verticesX`, `verticesY` and the corners `x0` to `y3`.

A change after mount to these props warns:

- AnimatedSprite: `autoUpdate` on PixiJS 4.
- Graphics: `geometry` on PixiJS 5 to 7.
- ParticleContainer: `maxSize` and `batchSize` on PixiJS 4 to 7, `properties` on PixiJS 4, `dynamicProperties` on PixiJS 8.
- Text: `canvas` on PixiJS 4 to 7.
