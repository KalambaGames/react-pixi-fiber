# @react-pixi-fiber/pixi-6

## 1.0.0-alpha.2

### Minor Changes

- [#415](https://github.com/KalambaGames/react-pixi-fiber/pull/415) [`b178428`](https://github.com/KalambaGames/react-pixi-fiber/commit/b1784281f03924325ba21a3324794d6ce542a369) Thanks [@michalochman](https://github.com/michalochman)! - `<AnimatedSprite playing />` plays the sprite, and `playing={false}` stops it. A change to `textures` no longer stops a sprite that plays. It continues from frame 0 of the new textures. A finished sprite with `loop={false}` plays again from frame 0 when `playing` changes to `true`. When you remove `playing`, the sprite stops. Without `playing`, you start the sprite through a ref as before.

- [#416](https://github.com/KalambaGames/react-pixi-fiber/pull/416) [`5eaa506`](https://github.com/KalambaGames/react-pixi-fiber/commit/5eaa5060f123da5e64626b5bd5d4ac3340a1e8c6) Thanks [@michalochman](https://github.com/michalochman)! - `Stage` takes two new props. `destroyOptions` sets what an unmount destroys. `Stage` passes it to `app.destroy`. The default stays `true`, and a recreate still passes `false`. `Stage` calls `onBeforeDestroy(app)` before it destroys an application that it created, also on a recreate. The adapters add only the `DestroyOptions` type of their PixiJS version.

### Patch Changes

- [#417](https://github.com/KalambaGames/react-pixi-fiber/pull/417) [`d452441`](https://github.com/KalambaGames/react-pixi-fiber/commit/d4524411d47813afb741c1d339b6880fe521b116) Thanks [@michalochman](https://github.com/michalochman)! - A behavior can list in `constructorOnly` the props that its `create` gives to the constructor and that PixiJS cannot change later. The core does not write these props. In development, under `StrictMode`, a change to one of them after mount warns one time. Give the element a new `key` to change such a prop.
  
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
  
  The MeshRope prop types require `points`. Every PixiJS constructor needs them.

## 1.0.0-alpha.1

### Minor Changes

- [#402](https://github.com/KalambaGames/react-pixi-fiber/pull/402) [`f662611`](https://github.com/KalambaGames/react-pixi-fiber/commit/f6626110ecfe4fb94f985474d24206104d8fdb38) Thanks [@michalochman](https://github.com/michalochman)! - `PixiAdapter.behaviors` replaces `PixiAdapter.components`. The map holds a `Behavior` for each tag, Display Objects and filters.

- [#402](https://github.com/KalambaGames/react-pixi-fiber/pull/402) [`659aa2d`](https://github.com/KalambaGames/react-pixi-fiber/commit/659aa2dd2097a757e191e884fea6f194c13e8a58) Thanks [@michalochman](https://github.com/michalochman)! - The PixiJS 4 to 7 adapters create the filter tags `AlphaFilter`, `BlurFilter`, `ColorMatrixFilter`, `DisplacementFilter` and `NoiseFilter`, and add the `FXAAFilter` tag, imported from the adapter package. The PixiJS 5 and 6 adapters release a filter without a call to `destroy`.
  
  `@react-pixi-fiber/pixi-4` peers `pixi.js` ^4.6.0, up from ^4.4.0: 4.6.0 is the first PixiJS 4 with `AlphaFilter`.

## 1.0.0-alpha.0

### Major Changes

- [#377](https://github.com/michalochman/react-pixi-fiber/pull/377) [`b5e5be4`](https://github.com/michalochman/react-pixi-fiber/commit/b5e5be46120e80ee101f87775d857a7e190cd633) Thanks [@michalochman](https://github.com/michalochman)! - Initial release. The PixiJS 6 adapter for PixiJS 6.x. It implements the 13 core tags and keeps `NineSlicePlane`, `SimpleMesh`, `SimplePlane` and `SimpleRope` as tags for `NineSliceSprite`, `MeshSimple`, `MeshPlane` and `MeshRope`. `Graphics` passes `geometry` to the constructor. It exports the `InteractionCompatibility`, `InteractionEventCompatibility`, `InteractiveComponent` and `PixiTypeFallback` types.

### Patch Changes

- Updated dependencies [[`446f761`](https://github.com/michalochman/react-pixi-fiber/commit/446f7619b852df4ffdf432d5c032e837f21968ee)]:
  - react-pixi-fiber@3.0.0-alpha.0
