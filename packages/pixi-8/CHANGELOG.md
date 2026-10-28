# @react-pixi-fiber/pixi-8

## 1.0.0-alpha.3

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

- [#414](https://github.com/KalambaGames/react-pixi-fiber/pull/414) [`1b29e5f`](https://github.com/KalambaGames/react-pixi-fiber/commit/1b29e5f74b57f5ae4b777f5a28a9779d250ac1da) Thanks [@michalochman](https://github.com/michalochman)! - An unmounted `Graphics` destroys the `GraphicsContext` that it created. Before, that context and its GPU data stayed in memory. PixiJS 8.15 and later can release them after a time, but only when its garbage collector is on. A `GraphicsContext` from the `context` prop is not destroyed.

## 1.0.0-alpha.2

### Minor Changes

- [#402](https://github.com/KalambaGames/react-pixi-fiber/pull/402) [`f662611`](https://github.com/KalambaGames/react-pixi-fiber/commit/f6626110ecfe4fb94f985474d24206104d8fdb38) Thanks [@michalochman](https://github.com/michalochman)! - `PixiAdapter.behaviors` replaces `PixiAdapter.components`. The map holds a `Behavior` for each tag, Display Objects and filters.

- [#402](https://github.com/KalambaGames/react-pixi-fiber/pull/402) [`ca0db1b`](https://github.com/KalambaGames/react-pixi-fiber/commit/ca0db1b75b424b9c74c29083ddfac6ce70d6bc30) Thanks [@michalochman](https://github.com/michalochman)! - `pixi8WithClasses({ classes })` replaces `pixi8WithComponents({ components })`, and `allClasses` replaces `allComponents`. The list holds PixiJS classes: Display Objects, filters and `Application`.

- [#402](https://github.com/KalambaGames/react-pixi-fiber/pull/402) [`659aa2d`](https://github.com/KalambaGames/react-pixi-fiber/commit/659aa2dd2097a757e191e884fea6f194c13e8a58) Thanks [@michalochman](https://github.com/michalochman)! - The PixiJS 8 adapter creates the filter tags `AlphaFilter`, `BlurFilter`, `ColorMatrixFilter`, `DisplacementFilter` and `NoiseFilter` from the PixiJS 8 options objects.
  
  The blur prop of `BlurFilter` is `strength`. `blur` works, but PixiJS 8 logs its own deprecation for it. `strengthX` and `strengthY` each override `strength` for one axis. A filter tag accepts `resolution="inherit"`. PixiJS 8 has no `FXAAFilter`.
  
  The filters are in `pixi8()` and `allClasses`. With `pixi8WithClasses`, list only the filter tags the app renders.

### Patch Changes

- [#393](https://github.com/KalambaGames/react-pixi-fiber/pull/393) [`0673e94`](https://github.com/KalambaGames/react-pixi-fiber/commit/0673e9432da6654c2317d5e3fede229b3aa0faef) Thanks [@michalochman](https://github.com/michalochman)! - Without `compat`, the development build warns once for each PixiJS 6 prop that PixiJS 8 ignores, for example `click` or `buttonMode`. The warning names `@react-pixi-fiber/pixi-8/compat/pixi6` and `/compat/pixi7`. Before, such a prop did nothing, and nothing said so.
  
  `origin` is typed as a point prop, like `pivot`. An invalid value resets it to its default with a warning.

- [#394](https://github.com/KalambaGames/react-pixi-fiber/pull/394) [`83e5958`](https://github.com/KalambaGames/react-pixi-fiber/commit/83e595872fac688902a2779e589feb8b4dcbdb0d) Thanks [@michalochman](https://github.com/michalochman)! - With the PixiJS 8 adapter, a prop accepts what the PixiJS setter accepts, not only what the getter returns. `<Text style={{ fill: "white" }} />`, the same `style` on `BitmapText` and `HTMLText`, the same props of a `PIXIComponent`, and properties that plugins add, for example the `layout` prop of `@pixi/layout` as a style object or as `true`, type-check. Before, they needed a `PIXIComponent` with the props declared by hand. With the PixiJS 7 adapter, the same applies to the `style` prop of `Text` and `HTMLText` and to the `text` prop of `Text`, which takes a number too.
  
  The `style` prop of `Text` has the PixiJS style types instead of `unknown`. A style object whose literal fields TypeScript widens to `string`, for example `fontWeight: "bold"` in an object without `as const`, needs `as const` or a type annotation.
  
  `PIXIComponent<T>` takes the instance type alone, without the props type.

## 1.0.0-alpha.1

### Minor Changes

- [#387](https://github.com/KalambaGames/react-pixi-fiber/pull/387) [`7a6bea7`](https://github.com/KalambaGames/react-pixi-fiber/commit/7a6bea7d9e4054995e96add63b4df6ce0d579bfd) Thanks [@michalochman](https://github.com/michalochman)! - `pixi8WithComponents` takes the PixiJS classes that the app renders as `components`. A bundle of the ES build holds only those classes. `pixi8()` keeps every class:
  
  ```js
  import { Application, Container, Sprite, Text } from "pixi.js";
  import { pixi8WithComponents } from "@react-pixi-fiber/pixi-8";
  
  configure({ react: react18(), pixi: pixi8WithComponents({ components: { Application, Container, Sprite, Text } }) });
  ```
  
  A tag left out of the list throws at first render, and the error names the class to add. `ParticleContainer` needs `Particle` in the list. Without `Application` in the list, `Stage` needs an `app` prop. That `app` needs a `Container` as `stage`, and a `ticker` for `usePixiTicker`. So an app can make its own renderer. `allComponents` holds every class that `pixi8()` uses.

## 1.0.0-alpha.0

### Major Changes

- [#377](https://github.com/michalochman/react-pixi-fiber/pull/377) [`b5e5be4`](https://github.com/michalochman/react-pixi-fiber/commit/b5e5be46120e80ee101f87775d857a7e190cd633) Thanks [@michalochman](https://github.com/michalochman)! - Initial release. The PixiJS 8 adapter for PixiJS 8.9 or a later 8.x, the first with every tag it exports. It implements the 13 core tags and `DOMContainer`, `HTMLText`, `Particle`, `PerspectiveMesh`, `RenderContainer` and `RenderLayer`. `NineSlicePlane` maps to `NineSliceSprite` and warns once in development. `Graphics` passes `context` to the constructor. `ParticleContainer` takes `Particle` children; a Suspense boundary inside it does not hide its particles, and it cannot be the container passed to `render`. `RenderLayer` draws the objects attached to it with `attach`; its JSX children draw in tree order. `Stage` puts the untyped `Container` props of PixiJS 8, such as `boundsArea`, `cullArea`, `label` and `tint`, on `app.stage`, not on the `<canvas>`.
  
  The default export of `@react-pixi-fiber/pixi-8/compat/pixi6` (also served as `compat/pixi7`), passed as `pixi8({ compat })`, translates the PixiJS 6 and 7 props PixiJS 8 renamed or deprecated: the event names become the `on` handler properties (`click` to `onclick`), `mousemove`, `pointermove` and `touchmove` become `onglobalmousemove`, `onglobalpointermove` and `onglobaltouchmove`, `buttonMode` becomes `cursor`, `interactive` becomes `eventMode` (`"static"` or `"passive"`, as PixiJS 8's setter does), `name` becomes `label` and `uvRespectAnchor` becomes `applyAnchorToTexture`. Each translated prop warns once in development; when the PixiJS 8 prop is also set, it wins and a warning names both. Without the import the adapter holds no compat code.

### Patch Changes

- Updated dependencies [[`446f761`](https://github.com/michalochman/react-pixi-fiber/commit/446f7619b852df4ffdf432d5c032e837f21968ee)]:
  - react-pixi-fiber@3.0.0-alpha.0
