# @react-pixi-fiber/pixi-7

## 1.0.0-alpha.1

### Minor Changes

- [#402](https://github.com/KalambaGames/react-pixi-fiber/pull/402) [`f662611`](https://github.com/KalambaGames/react-pixi-fiber/commit/f6626110ecfe4fb94f985474d24206104d8fdb38) Thanks [@michalochman](https://github.com/michalochman)! - `PixiAdapter.behaviors` replaces `PixiAdapter.components`. The map holds a `Behavior` for each tag, Display Objects and filters.

- [#402](https://github.com/KalambaGames/react-pixi-fiber/pull/402) [`659aa2d`](https://github.com/KalambaGames/react-pixi-fiber/commit/659aa2dd2097a757e191e884fea6f194c13e8a58) Thanks [@michalochman](https://github.com/michalochman)! - The PixiJS 4 to 7 adapters create the filter tags `AlphaFilter`, `BlurFilter`, `ColorMatrixFilter`, `DisplacementFilter` and `NoiseFilter`, and add the `FXAAFilter` tag, imported from the adapter package. The PixiJS 5 and 6 adapters release a filter without a call to `destroy`.
  
  `@react-pixi-fiber/pixi-4` peers `pixi.js` ^4.6.0, up from ^4.4.0: 4.6.0 is the first PixiJS 4 with `AlphaFilter`.

### Patch Changes

- [#394](https://github.com/KalambaGames/react-pixi-fiber/pull/394) [`83e5958`](https://github.com/KalambaGames/react-pixi-fiber/commit/83e595872fac688902a2779e589feb8b4dcbdb0d) Thanks [@michalochman](https://github.com/michalochman)! - With the PixiJS 8 adapter, a prop accepts what the PixiJS setter accepts, not only what the getter returns. `<Text style={{ fill: "white" }} />`, the same `style` on `BitmapText` and `HTMLText`, the same props of a `PIXIComponent`, and properties that plugins add, for example the `layout` prop of `@pixi/layout` as a style object or as `true`, type-check. Before, they needed a `PIXIComponent` with the props declared by hand. With the PixiJS 7 adapter, the same applies to the `style` prop of `Text` and `HTMLText` and to the `text` prop of `Text`, which takes a number too.
  
  The `style` prop of `Text` has the PixiJS style types instead of `unknown`. A style object whose literal fields TypeScript widens to `string`, for example `fontWeight: "bold"` in an object without `as const`, needs `as const` or a type annotation.
  
  `PIXIComponent<T>` takes the instance type alone, without the props type.

## 1.0.0-alpha.0

### Major Changes

- [#377](https://github.com/michalochman/react-pixi-fiber/pull/377) [`b5e5be4`](https://github.com/michalochman/react-pixi-fiber/commit/b5e5be46120e80ee101f87775d857a7e190cd633) Thanks [@michalochman](https://github.com/michalochman)! - Initial release. The PixiJS 7 adapter for PixiJS 7.2 or a later 7.x, the first with `eventMode`. It implements the 13 core tags and `HTMLText`, and keeps `NineSlicePlane`, `SimpleMesh`, `SimplePlane` and `SimpleRope` as tags for `NineSliceSprite`, `MeshSimple`, `MeshPlane` and `MeshRope`. `Graphics` passes `geometry` to the constructor. It exports the `PixiTypeFallback` type.
  
  The default export of `@react-pixi-fiber/pixi-7/compat/pixi6`, passed as `pixi7({ compat })`, translates the PixiJS 6 props: the event names become the `on` handler properties (`click` to `onclick`), `mousemove`, `pointermove` and `touchmove` become `onglobalmousemove`, `onglobalpointermove` and `onglobaltouchmove`, `buttonMode` becomes `cursor` (`"pointer"` or `null`) and `interactive` becomes `eventMode` (`"static"` or `"auto"`, as PixiJS 7's deprecated setter does). Each translated prop warns once in development; when the PixiJS 7 prop is also set, it wins and a warning names both. Without `compat`, the event names and `buttonMode`, which PixiJS 7 ignores, warn once per prop name in development.

### Patch Changes

- Updated dependencies [[`446f761`](https://github.com/michalochman/react-pixi-fiber/commit/446f7619b852df4ffdf432d5c032e837f21968ee)]:
  - react-pixi-fiber@3.0.0-alpha.0
