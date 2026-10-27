# @react-pixi-fiber/pixi-5

## 1.0.0-alpha.1

### Minor Changes

- [#402](https://github.com/KalambaGames/react-pixi-fiber/pull/402) [`f662611`](https://github.com/KalambaGames/react-pixi-fiber/commit/f6626110ecfe4fb94f985474d24206104d8fdb38) Thanks [@michalochman](https://github.com/michalochman)! - `PixiAdapter.behaviors` replaces `PixiAdapter.components`. The map holds a `Behavior` for each tag, Display Objects and filters.

- [#402](https://github.com/KalambaGames/react-pixi-fiber/pull/402) [`659aa2d`](https://github.com/KalambaGames/react-pixi-fiber/commit/659aa2dd2097a757e191e884fea6f194c13e8a58) Thanks [@michalochman](https://github.com/michalochman)! - The PixiJS 4 to 7 adapters create the filter tags `AlphaFilter`, `BlurFilter`, `ColorMatrixFilter`, `DisplacementFilter` and `NoiseFilter`, and add the `FXAAFilter` tag, imported from the adapter package. The PixiJS 5 and 6 adapters release a filter without a call to `destroy`.
  
  `@react-pixi-fiber/pixi-4` peers `pixi.js` ^4.6.0, up from ^4.4.0: 4.6.0 is the first PixiJS 4 with `AlphaFilter`.

## 1.0.0-alpha.0

### Major Changes

- [#377](https://github.com/michalochman/react-pixi-fiber/pull/377) [`b5e5be4`](https://github.com/michalochman/react-pixi-fiber/commit/b5e5be46120e80ee101f87775d857a7e190cd633) Thanks [@michalochman](https://github.com/michalochman)! - Initial release. The PixiJS 5 adapter for PixiJS 5.x. It implements the 13 core tags and keeps `NineSlicePlane`, `SimpleMesh`, `SimplePlane` and `SimpleRope` as tags for `NineSliceSprite`, `MeshSimple`, `MeshPlane` and `MeshRope`. `Graphics` passes `geometry` to the constructor. It exports the `InteractionCompatibility`, `InteractionEventCompatibility`, `InteractiveComponent` and `PixiTypeFallback` types.

### Patch Changes

- Updated dependencies [[`446f761`](https://github.com/michalochman/react-pixi-fiber/commit/446f7619b852df4ffdf432d5c032e837f21968ee)]:
  - react-pixi-fiber@3.0.0-alpha.0
