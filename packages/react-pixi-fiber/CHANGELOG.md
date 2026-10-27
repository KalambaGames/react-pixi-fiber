# CHANGELOG

All notable changes to this project will be documented in this file.

This project adheres to [Semantic Versioning](http://semver.org/). From 3.0.0 on, [Changesets](https://github.com/changesets/changesets) writes the entries from `.changeset/` at release; the entries up to 2.x follow [Keep a Changelog](http://keepachangelog.com/).

## 3.0.0-alpha.2

### Minor Changes

- [#402](https://github.com/KalambaGames/react-pixi-fiber/pull/402) [`f662611`](https://github.com/KalambaGames/react-pixi-fiber/commit/f6626110ecfe4fb94f985474d24206104d8fdb38) Thanks [@michalochman](https://github.com/michalochman)! - `PixiAdapter.behaviors` replaces `PixiAdapter.components`. The map holds a `Behavior` for each tag, Display Objects and filters.

- [#402](https://github.com/KalambaGames/react-pixi-fiber/pull/402) [`659aa2d`](https://github.com/KalambaGames/react-pixi-fiber/commit/659aa2dd2097a757e191e884fea6f194c13e8a58) Thanks [@michalochman](https://github.com/michalochman)! - A filter is a child element of the Display Object it filters, a `Sprite`, a `Container` or any other object with a `filters` property: `<Sprite><BlurFilter blur={2} /></Sprite>`. A filter element is not a Display Object. The core writes it into the parent's `filters` array in JSX order, not into `children`. `enabled` disables a filter. A Suspense fallback disables it until the content shows.
  
  `AlphaFilter`, `BlurFilter`, `ColorMatrixFilter`, `DisplacementFilter` and `NoiseFilter` are tags, imported from `react-pixi-fiber` like `Sprite`. `PIXIFilter(type, behavior)` registers another filter class, for example one from `pixi-filters`.
  
  The core destroys the filters it created, when the filter element or an ancestor unmounts. PixiJS never destroys a filter with its object, so a filter from the `filters` prop is yours to destroy. An adapter can provide the optional `PixiAdapter.releaseFilter(filter)` to release a filter instead of `filter.destroy()`.
  
  A `filters` value on an element with filter children throws. Use one of the two. In development, under StrictMode, a change to a prop that the filter did not have before its first write logs a warning. The constructor reads that option, so a new `key` is the way to change it.

### Patch Changes

- [#393](https://github.com/KalambaGames/react-pixi-fiber/pull/393) [`a366d91`](https://github.com/KalambaGames/react-pixi-fiber/commit/a366d912861cb7717fddfc40520afd1c0b387080) Thanks [@michalochman](https://github.com/michalochman)! - An explicit `null` on a callback prop, for example `onclick={null}`, is written as `null`. Before, the core reset it to its default and warned under `StrictMode`.
  
  An explicit `null` on a point prop is written as `null`, so the PixiJS setter throws its own error, as it does without react-pixi-fiber. Before, the core reset it to its default and warned.
  
  An invalid value for a point prop that the PixiJS adapter does not list as a point, for example a point prop of a custom component, resets the prop to its default with a warning. Before, `"a,b"` wrote `NaN` coordinates and three coordinates threw.
  
  The warning for an invalid prop value prints once for each prop name, not on every write.
  
  A suspended instance that becomes visible again gets the `visible` default of the PixiJS adapter, or the value PixiJS had, when the element has no `visible` prop. Before, it always became visible.
  
  `usePixiApp` and `usePixiTicker` throw an `Invariant Violation`, like the other core errors.
  
  The warning for the deprecated `width` and `height` props of `Stage` names 4.0.0 as the major that removes them, and `createStageClass` is marked `@deprecated` for editors.

- [#394](https://github.com/KalambaGames/react-pixi-fiber/pull/394) [`83e5958`](https://github.com/KalambaGames/react-pixi-fiber/commit/83e595872fac688902a2779e589feb8b4dcbdb0d) Thanks [@michalochman](https://github.com/michalochman)! - With the PixiJS 8 adapter, a prop accepts what the PixiJS setter accepts, not only what the getter returns. `<Text style={{ fill: "white" }} />`, the same `style` on `BitmapText` and `HTMLText`, the same props of a `PIXIComponent`, and properties that plugins add, for example the `layout` prop of `@pixi/layout` as a style object or as `true`, type-check. Before, they needed a `PIXIComponent` with the props declared by hand. With the PixiJS 7 adapter, the same applies to the `style` prop of `Text` and `HTMLText` and to the `text` prop of `Text`, which takes a number too.
  
  The `style` prop of `Text` has the PixiJS style types instead of `unknown`. A style object whose literal fields TypeScript widens to `string`, for example `fontWeight: "bold"` in an object without `as const`, needs `as const` or a type annotation.
  
  `PIXIComponent<T>` takes the instance type alone, without the props type.

## 3.0.0-alpha.1

### Patch Changes

- [#387](https://github.com/KalambaGames/react-pixi-fiber/pull/387) [`8ab7e10`](https://github.com/KalambaGames/react-pixi-fiber/commit/8ab7e1002f794144633a4f8a6d582c8b6554171b) Thanks [@michalochman](https://github.com/michalochman)! - The `Stage` error for a rejected `app` prop names the two forms that `Stage` accepts: a `PIXI.Application`, or an object that the PixiJS adapter accepts as one. The pixi-8 adapter accepts an object with a `Container` as `stage`.
  
  `usePixiTicker` throws during render when the `app` has no `ticker`, and the error names the `ticker`.

## 3.0.0-alpha.0

### Major Changes

- [#377](https://github.com/michalochman/react-pixi-fiber/pull/377) [`446f761`](https://github.com/michalochman/react-pixi-fiber/commit/446f7619b852df4ffdf432d5c032e837f21968ee) Thanks [@michalochman](https://github.com/michalochman)! - Split into a core package and per-version adapters. Call `configure({ react, pixi })` once at the app entry with a React adapter (`@react-pixi-fiber/react-17`, `react-18`, `react-19`) and a PixiJS adapter (`@react-pixi-fiber/pixi-4` to `pixi-8`). See the migration guide in the README.
  
  ### Added
  - `configure({ react, pixi })`, called once in the app entry before the first render, wires a React adapter and a PixiJS adapter into the core. Without it the first render throws an error that prints the install line and the setup lines
  - React adapters: `@react-pixi-fiber/react-17` for React 17.0.2 or a later 17.x, `@react-pixi-fiber/react-18` for React 18.3.1 or a later 18.x and `@react-pixi-fiber/react-19` for React 19.3 or a later 19.x
  - PixiJS adapters: `@react-pixi-fiber/pixi-4` for PixiJS 4.4 or a later 4.x, `@react-pixi-fiber/pixi-5`, `@react-pixi-fiber/pixi-6`, `@react-pixi-fiber/pixi-7` for PixiJS 7.2 or a later 7.x and `@react-pixi-fiber/pixi-8` for PixiJS 8.9 or a later 8.x. The `pixi-7` and `pixi-8` adapters have a `compat/pixi6` module that translates the 2.x props their PixiJS version renamed or ignores. Each adapter's changelog lists its tags and peers
  - Fragment refs on React 19: a `<Fragment ref>` inside `Stage` receives a `PixiFragmentInstance` with `children`, `getBounds()`, `off(event, fn)` and `on(event, fn)` over the fragment's top-level display objects
  - The PixiJS adapter's `defaults` option sets default props per tag, like React's `defaultProps`: `pixi6({ defaults: { Sprite: { alpha: 0.5 } } })`. A prop that is missing or `undefined` when the instance is created gets its default before `create` runs, and a prop removed later, or set to `undefined`, returns to it. An explicit `null` is kept. Entries are keyed by the tag name; the deprecated `NineSlicePlane` on PixiJS 8 is keyed as `NineSliceSprite`
  - A PixiJS adapter can rename props with `translateProps` before they are validated, set or diffed; a `PIXIComponent` with its own `applyProps` receives the props as written, with the `defaults` applied
  - `PIXIComponent(type, behavior)` and `PIXIProperty` replace `CustomPIXIComponent(behavior, type)` and `CustomPIXIProperty`. Behavior keys are `create`, `applyProps`, `afterAdd`, `beforeRemove`, and the unstable `appendChild`, `insertBefore` and `removeChild`, which let a container own the order of children that are not display objects. The `Behavior`, `BehaviorInput` and `ApplyPropsContext` types describe a behavior
  - `getInstanceTag(instance)` returns the tag an instance was created with, after a deprecated tag is mapped
  - A tag registered with `PIXIComponent` under the name of an adapter tag replaces the adapter tag and warns once in development. 2.x always created the built-in tag
  - `PIXIProperty` accepts tags registered with `PIXIComponent`; 2.x reported them as not a valid component type
  - `PixiTickerCallback` type export, the callback type `usePixiTicker` takes
  - Tags `AnimatedSprite`, `Mesh`, `MeshSimple`, `MeshPlane`, `MeshRope` and `NineSliceSprite`. Every PixiJS adapter implements all 13 tags
  - `Stage` `onInit(app)` prop, called once the PixiJS application exists and the children are rendered
  - `Stage` `bridgeContexts` prop, a list of React contexts provided around `Stage` that its children can read. React does not pass context between renderers; `Stage` reads each context where it renders and provides it again inside, and renders the children again when a value changes
  
  ### Changed
  - `react-reconciler` moved from the core into the React adapters; `@react-pixi-fiber/react-17` bundles `react-reconciler` 0.26.2, `@react-pixi-fiber/react-18` 0.29.2 and `@react-pixi-fiber/react-19` 0.34.0
  - `pixi.js` is no longer a peer dependency of the core, the PixiJS adapter has it. The core's `react` peer is `>=17.0.0 <20.0.0`
  - PixiJS 7.0–7.1 and 8.0–8.8 are not supported: `@react-pixi-fiber/pixi-7` peers `pixi.js` ^7.2.0 (`eventMode` first ships in 7.2) and `@react-pixi-fiber/pixi-8` peers `pixi.js` ^8.9.0 (the first 8.x with every tag it exports). 2.x peered `pixi.js` >=4.4.0 <8
  - A second `configure` call after a render warns once in development. Trees already rendered keep their React renderer; new PixiJS instances and prop writes use the new adapter
  - The types `InteractionCompatibility`, `InteractionEventCompatibility` and `PixiTypeFallback` import from the PixiJS adapter: `@react-pixi-fiber/pixi-4`, `pixi-5` and `pixi-6` export all three, `@react-pixi-fiber/pixi-7` exports `PixiTypeFallback`
  - Build output moved from `cjs/` and `es/` to `dist/cjs/` and `dist/es/`. Imports of `react-pixi-fiber` are unaffected; direct paths to the built files need the `dist/` prefix
  - The `usePixiTicker` callback has the type `app.ticker.add` takes on the configured PixiJS version
  - Examples are built with Vite instead of Create React App
  - Examples run on PixiJS 7 with `@pixi/layers` instead of PixiJS 6
  - `package.json` has an `exports` map. Bundlers that understand it (webpack 5, Vite) get the ES build directly, the development or production file picked by the `development` condition; Node and `require` still get the CommonJS entry points. Only `react-pixi-fiber` and `react-pixi-fiber/package.json` can be imported, deep imports into `dist/` or `src/` no longer resolve
  - The `module` and `jsnext:main` fields and `index.es.js` are removed. `index.es.js` was a CommonJS wrapper around the ES build; bundlers that ignore `exports` now use `main`
  - The type declarations are regular modules for the CommonJS and the ES build instead of a `declare module "react-pixi-fiber"` block. `tsconfig.json` `paths` pointing `react-pixi-fiber` at `index.d.ts` are no longer needed
  - Code is formatted and linted with Biome instead of Prettier and ESLint
  - The library is built with [tsdown](https://tsdown.dev) instead of Rollup 2 and Babel. The code targets ES2018 instead of ES5 and is minified with Oxc instead of terser; for the same source the development builds are about 20% and the production builds about 3% smaller
  - The library tests run with [Vitest](https://vitest.dev) instead of Jest 26; `pnpm test` still runs the development and production suites. Babel and babel-plugin-rewire are gone, the tests mock modules with `vi.mock` instead
  - `Stage` creates the PixiJS application asynchronously. Children mount after `Stage` commits; `ref._app.current` is `null` until `onInit` fires and warns in development when read before that
  - `Stage` calls `onInit` once for every application it creates or is given in `app` and keeps, so again after an `options` change recreates the application. An `options` change while the application is being created is applied once it exists. A failed application creation (a thrown error or a rejected promise) reaches the nearest error boundary. Unmounting `Stage` before the application exists destroys the application when it is ready and never calls `onInit`
  - Destroying the application of an unmounted or recreated `Stage` keeps the WebGL context of a canvas still in the document, such as an external `options.view`, so the next application on that canvas can draw; 2.x lost it. The next application is created once the previous one is destroyed. The development double mount under `<StrictMode>` no longer leaves the canvas blank
  - `Stage` warns once in development when its `app` prop changes after mount; it keeps the application it started with
  - `Stage` renders no `<canvas>` when `options.canvas` is set, as for `options.view`. On PixiJS 8 the application draws on the given canvas; when both are given, `view` wins. On PixiJS 4 to 7 `canvas` is not an application option, and `Stage` warns once in development
  - `Stage` has no `defaultProps`: `ref.current.props.options` is `undefined` when `options` is omitted (it was `{}`)
  - `Stage` passes typed prop names and Container prop names (for example `buttonMode`, `interactiveChildren`) to `app.stage`. 2.x compared the names in lowercase, so these props went to the `<canvas>` element
  - A prop set to `undefined` is reset to the value PixiJS had before the first write, recorded per instance, instead of a value from a table. This covers every PixiJS version and custom components. For example `Text` `text` set to `undefined` goes back to the value the `PIXI.Text` was created with, not `""`
  - Removing a prop restores the value the instance had before react-pixi-fiber first set it, which may be `undefined` on PixiJS 8 (`mask`, `filters`), instead of setting numeric and untyped props to `null`, so `<Sprite alpha={0.5} />` re-rendered as `<Sprite />` has `alpha` 1 again. An explicit `null` is still set as-is on numeric, boolean and untyped props; on point and callback props it is an invalid value, as in 2.x. A prop set to `undefined` or removed no longer warns under `<StrictMode>`; the development warning for an invalid value names the received value ("Received `-1` for prop `alpha`…") instead of "Received undefined"
  - Development prop validation now runs on React 18 and 19 for components under a `<StrictMode>` placed inside `Stage` (or inside the tree passed to `render`). It never ran on React 18 or 19 before, because the library checked React 17's mode bit. A `<StrictMode>` around `<Stage>` does not reach the PixiJS tree, which is a separate React root, as in 2.x
  - A boolean or function value on a prop the library does not type is set on the instance instead of being dropped (`<Container sortableChildren />` works on PixiJS 4 to 7). Unknown prop names are no longer reported in development; they are set as-is. The development warning for an event handler prop checks only `on` plus an uppercase letter, so `onclick` no longer warns
  - `applyProps(instance, oldProps, newProps)` is exported for higher-order components; `_customApplyProps`, `_customDidAttach`, `_customWillDetach` are no longer attached to display objects
  - A behavior object is read with `{ ...behavior }`, so only its own properties count. A behavior that is a class instance must set `create`, `applyProps`, `afterAdd` and `beforeRemove` as own properties, methods on its prototype are not found
  - `Graphics` passes a prop to the `PIXI.Graphics` constructor: `nativeLines` on PixiJS 4, `geometry` on PixiJS 5 to 7 and `context` on PixiJS 8. 2.x passed nothing
  - `unmount(container)` never throws and returns a boolean, as `unmountComponentAtNode` does: `true` when the container was rendered into (a second `unmount` of the same container is a no-op, as in 2.x), `false` plus a development warning `ReactPixiFiber did not render into container provided` when it never was. 2.x threw for a container never rendered into. Roots are held weakly by container, so an unmounted `Stage` no longer keeps its destroyed `app.stage` and React root alive; 2.x kept every root
  - `afterAdd` (2.x `customDidAttach`) runs when a child joins a parent, also when it is inserted before a sibling, which 2.x never did. A keyed reorder within the same parent moves the child without calling `afterAdd` or `beforeRemove`; 2.x called `customDidAttach` again when `appendChild` moved a child, which added a listener subscribed there a second time
  - `AppContext` is typed `Context<Application | null>`, its default value is `null`. `withApp` accepts any component with an `app` prop, `PixiAppProperties` is still exported for that prop. The `displayName` of a `withApp` component is `withApp(Name)` instead of the source of the wrapped function
  - The source is TypeScript; the types ship from the build instead of a handwritten `index.d.ts`. `CustomDisplayObject*` and `CustomPIXIComponent*` types are renamed without the `Custom` prefix. The PixiJS adapter fills in the tag and prop types when it is imported; without an adapter import every tag takes loose props. Each PixiJS adapter has its own typed prop table, so a prop typed in 2.x but not by the adapter, for example `tint` on PixiJS 8, is set as-is without validation. The `PixiAdapter`, `ReactAdapter` and `HostOps` types describe an adapter
  
  ### Deprecated
  Each deprecated item keeps working in 3.x and is removed in 4.0.0. The deprecated functions, behavior keys and `Stage` props warn once in development, the `NineSlicePlane` tag on PixiJS 8 only; the deprecated types, for example `InteractiveComponent` and the `Custom*` names, do not warn.
  - `CustomPIXIComponent(behavior, type)` and `CustomPIXIProperty`, use `PIXIComponent(type, behavior)` and `PIXIProperty`
  - Behavior keys `customDisplayObject`, `customApplyProps`, `customDidAttach` and `customWillDetach`, use `create`, `applyProps`, `afterAdd` and `beforeRemove`
  - The `Custom*` type names (`CustomDisplayObject*`, `CustomPIXIComponent*`), use the names without the prefix
  - `createStageClass`, it returns the function `Stage`
  - Tag `NineSlicePlane`, use `NineSliceSprite`. On PixiJS 8 it maps to `NineSliceSprite`; the PixiJS 4 to 7 adapters keep it as a tag
  - `Stage` `width` and `height` props (deprecated since 0.12.0, the warning no longer needs `prop-types`). As in 2.x they set `app.stage.width` and `app.stage.height` and never size the renderer or reach the `<canvas>`; the renderer size comes from `options.width` and `options.height`
  - The `InteractiveComponent` type in `react-pixi-fiber`, import it from `@react-pixi-fiber/pixi-4`, `pixi-5` or `pixi-6`
  
  ### Removed
  - The `react-pixi-fiber/react-pixi-alias` subpath and the `react-dom` peer dependency
  - UMD builds, the `prop-types` peer dependency and runtime prop-types validation, `fbjs`
  - `Stage` as a class component
  - The PixiJS 4 fallbacks to the `PIXI.extras`, `PIXI.mesh` and `PIXI.particles` namespaces are removed from the core; PixiJS 4 support moves to the `@react-pixi-fiber/pixi-4` adapter
  
  ### Fixed
  - `cancelTimeout` cancels the timeout: `scheduleTimeout` returns its handle
  - `useId` returns ids without the `undefined` prefix (`:r0:` instead of `:undefinedr0:`), the root's `identifierPrefix` is `""`
  - Errors React recovers from are logged with `console.error` on React 18 and 19; 2.x passed no `onRecoverableError` handler, so the reconciler called `undefined`
  - `StageProps` rejects `app` and `options` passed together; 2.x typed both as optional in one object

## 2.0.0-rc.4 - 2026-09-28

### Fixed
- TypeScript: `Text` accepts a plain style object in `style` (`Partial<PIXI.ITextStyle>`), matching the `PIXI.Text` setter. PixiJS v7 types the `style` getter as `TextStyle` only, so passing an object literal failed to typecheck


## 2.0.0-rc.3 - 2026-09-26

### Fixed
- Create React App 5 (and other webpack builds with strict export checks) failed with "Attempted import error: 'extras' is not exported from 'pixi.js'" when using PixiJS v5+. The ES build read the PixiJS v4 `extras`, `mesh` and `particles` namespaces straight from the `pixi.js` import, the fallback to the top-level classes is unchanged


## 2.0.0-rc.2 - 2026-09-26

### Added
- TypeScript: `CustomPIXIProperty` is now declared in `index.d.ts`
- TypeScript: `PointLikeTuple` accepts a single element tuple (e.g. `scale={[2]}`), matching runtime behavior
- TypeScript: `this.applyDisplayObjectProps` inside `customApplyProps` is now typed (`CustomDisplayObjectPropSetterContext`), along with `CustomPIXIComponentProps` helper type
- Examples are now written in TypeScript and typechecked against the local `index.d.ts` in CI

### Fixed
- `Stage` renders a new canvas when `PIXI.Application` is recreated after non-dimensional `options` change. Previously the new `PIXI.Application` shared the canvas with the one being destroyed, and destroying it unbound the current WebGL program (PixiJS v6) or lost the context (PixiJS v7), leaving only the background color rendered


## 2.0.0-rc.1 - 2026-09-26

### Changed
- `ref` on built-in and custom components is now typed as the underlying `PIXI.DisplayObject` instance instead of the props type
- Every component accepts `children` again in TypeScript, as every wrapped display object is a `PIXI.Container`
- Declared `pixi.js` peer dependency as `>=4.4.0 <8.0.0`, PixiJS v8 is not supported

### Removed
- Removed unstable_batchedUpdates API ([#89])


## 2.0.0-alpha.1 - 2025-01-16

### Changed
- Requires React 18.2 or newer, `react-reconciler` updated to 0.29


## 1.0.6 - 2023-01-13

### Added
- Added support for events in PixiJS v7.1 ([#306])


## 1.0.4 - 2022-10-19

### Fixed
- Fixed reconciler to check that parent exists before calling `appendChild` ([#291])
- Fixed `useStageRerenderer` hook in `React.StrictMode` ([#285])


## 1.0.3 - 2022-10-11

### Fixed
- Fixed reconciler to check that container exists before calling `removeChildren` ([#286])


## 1.0.2 - 2022-09-01

### Fixed
- Fixed ES build by replacing inline require with regular import ([#283])


## 1.0.1 - 2022-08-02

### Fixed
- Fixed peer dependencies ([#277])


## 1.0.0 - 2022-07-19

### Added
- Added ReactDOM-like prop validation in development ([#47])
- Added ES format output
- Added missing `prop-types` dependency ([#221])

### Changed
- Updated build dependencies
- Updated dev dependencies
- Changed `Stage` class and function component types to be the same ([#225])
- Changed Stage to delay destroying PIXI.Application when unmounting
- Changed usePixiApp to throw an error when used outside of <Stage /> ([#227])

### Fixed
- Fixed type of `oldProps` sent to `customApplyProps` of `CustomPIXIComponent`
- Fixed hook-based `Stage` to render and rerender synchronously ([#204])
- Fixed type compatibility with PixiJS v6.0.0 ([#210])
- Fixed breaking change when undefined values were assigned to props with previously defined values

### Removed
- Removed `performance-now` dependency


## 0.14.2 - 2020-11-28

### Fixed
- Fixed compatibility with React 17 and React.Suspense ([#196])


## 0.14.1 - 2020-07-13

### Fixed
- Fixed type compatibility with PixiJS v5.3.0 ([#185])


## 0.14.0 - 2020-04-04

### Added
- Added <NineSlicePlane /> component ([#176])

### Fixed
- Fixed applyProps type definition ([#176])
- Fixed `StagePropsWithOptions` type definition to work with both PixiJS v4 and v5 ([#180])
- Fixed `StageProps` type definition to include `Container` props and exclude width and height ([#182])


## 0.13.2 - 2020-02-17

### Fixed
- Fixed `Stage` not to resize renderer if app is provided in props ([#174])


## 0.13.1 - 2020-02-13

### Added
- Added exports for type of props for built-in components ([#170]) 


## 0.13.0 - 2020-02-03

### Added
- Added `style` prop to `BitmapText` type ([#166])

### Fixed
- Fixed type definitions to work with both PixiJS v4 and v5 ([#166])
- Fixed type definitions for properties of type `any` being replaced with `PointLike` ([#166])
- Fixed type definitions for built-in components to be able to use `ref`s ([#166])
- Fixed type definitions for `AppContext` which was exported as type, not as value ([#166])


## 0.12.3 - 2020-01-28

### Added
- Added missing type definitions ([#163])

### Fixed
- Fixed type definitions for `CustomPIXIComponents` ([#163])
- Fixed type definitions for `Stage` to be able to use `ref`s ([#165])


## 0.12.2 - 2020-01-20

### Added
- Added support for point like props ([#162])

### Changed
- Rewrote types definition


## 0.12.1 - 2019-12-26

### Fixed
- Fixed `ReactPixiFiber` to destroy child components when parent is removed from tree ([#157])


## 0.12.0 - 2019-11-23

### Added
- Added `app` prop to `Stage` ([#154])

### Deprecated
- Deprecated `width` and `height` props of `Stage` ([#153])


## 0.11.1 - 2019-10-25

### Fixed
- Fixed usage of Point copy/copyFrom in PixiJS v5 ([#149])


## 0.11.0 - 2019-10-22

### Changed
- Exposed `createStageClass` from `Stage` ([#147])
- Changed dev tools version reported to be `React` version instead of `ReactPixiFiber` version ([#148])


## 0.10.0 - 2019-10-18

### Added
- Added `usePixiAppCreator`, `usePixiApp` and `usePixiTicker` hooks ([#127])

### Changed
- Improved hooks support ([#127])


## 0.9.3 - 2019-08-29

### Changed
- Changed `console.warn` calls into `fbjs/lib/warning` calls.

### Fixed
- Fixed setting default prop value when removing prop from instance ([#141])


## 0.9.2 - 2019-08-01

### Fixed
- Fixed type definition to include `withApp` ([#125])


## 0.9.1 - 2019-07-31

### Fixed
- Fixed renderer to be secondary when using `<Stage />` component


## 0.9.0 - 2019-07-01

### Added
- Added `scheduler`

### Changed
- Updated `react-reconciler` to `0.20.4` ([#122])

### Fixed
- Fixed PixiJS v5 compatibility issues ([#118])


## 0.8.2 - 2019-07-01

### Changed
- Changed `render` to inject into dev tools once per `containerTag`

### Fixed
- Fixed `setPixiValue` for Point values when using PixiJS v5 ([#120])


## 0.8.1 - 2019-05-29

### Fixed
- Fixed interactive elements type definition ([#109])

### Removed
- Removed `package.json` references from bundled code ([#112])


## 0.8.0 - 2019-02-24

### Added
- Expose `applyProps` from `ReactPixiFiber` ([#95])
- Added example of "native" Animated target for `react-pixi-fiber` ([#95])
- Added custom test environment for `jest` ([#97])

### Changed
- Replaced deprecated canvas-prebuilt development dependency by canvas ([#97])

### Fixed
- Fixed `customDidAttach` of example `<DraggableContainer />` component ([#91])
- Fixed `insertBefore` method of `ReactPixiFiber` ([#98])


## 0.7.0 - 2018-12-27

### Added
- Added unstable_batchedUpdates API ([#89])


## 0.6.2 - 2018-11-14

### Fixed
- Fixed PixiJS event props not being passed to `<Stage />` component ([#85])


## 0.6.1 - 2018-11-10

### Fixed
- Fixed context not passed through from primary renderer (`react-dom`) into `react-pixi-fiber` ([#84])


## 0.6.0 - 2018-11-10

### Fixed
- Fixed React 16.6.0 compatibility ([#83])


## 0.5.1 - 2018-11-02

### Added
- Added AppContext to type definition ([#81])

### Fixed
- Fixed render function type definition ([#76])


## 0.5.0 - 2018-10-10

### Added
- Added support for New Context API ([#72])

### Fixed
- Fixed React 16.5.0 compatibility ([#71])


## 0.4.9 - 2018-07-09

### Changed
- Changed `defaultApplyProps` to wrap console warnings in dev flag ([#67]) 


## 0.4.8 - 2018-06-25

### Changed
- Updated `react-reconciler` to `0.12.0` ([#65])

### Fixed
- Removed namespace from Typescript definition ([#64])


## 0.4.7 - 2018-06-10

### Changed
- Changed `<Stage />` to support `width` and `height` passed in `options` prop ([#60])

### Fixed
- Fixed TypeScript definitions to support TypeScript 2.9 ([#58])
- Fixed memory leak when mounting/unmounting `<Stage />` ([#61])


## 0.4.6 - 2018-05-22

### Fixed
- Fixed TypeScript definitions ([#54])


## 0.4.5 - 2018-05-18

### Changed
- Updated `react-reconciler` to `0.10.0` ([#53])


## 0.4.4 - 2018-05-09

### Fixed
- Fixed cjs build of react-pixi-alias


## 0.4.3 - 2018-03-28

### Fixed
- Fixed entry point to load module by env 
- Fixed `commitUpdate` for `CustomPIXIComponents` ([#44])


## 0.4.2 - 2018-03-27

### Fixed
- Fixed cjs build


## 0.4.1 - 2018-03-27 [YANKED]

### Added
- Added unit tests ([#6])

### Changed
- Changed bundler from babel-cli to Rollup

### Fixed
- Fixed `prepareUpdate` to return diff of props ([#43])


## 0.4.0 - 2018-02-28

### Fixed
- Fixed DisplayObject members passed to Stage as props not being applied to root Container ([#38])


## 0.3.1 - 2018-02-25

### Fixed
- Fixed PropTypes warning in Stage ([#34])
- Added `react-pixi-alias.js` file to distributed package `files` list ([#37])


## 0.3.0 - 2018-02-15

### Added
- Added parser for PIXI.Point-like props - Point-like DisplayObject members can now be assigned using string, number, array and Point/ObservablePoint ([#19])
- Added support for custom components using `react-pixi` API ([#19])

### Changed
- Changed `<Stage />` to pass `options` prop to `PIXI.Application` ([#28])
- Changed `<Stage />` to pass not consumed props to rendered canvas ([#29])
- Changed `<Stage />` to resize renderer when dimensions are changed ([#30])
- Changed inconsistent usage of reconciler config functions to use regular functions instead of anonymous arrow functions
- Changed `PIXI.DisplayObject` members handling when passed as props - `undefined` values will now be replaced with default values if default defined

### Fixed
- Fixed deprecated usage of `PIXI.BitmapText` to `PIXI.extras.BitmapText`

### Removed
- Removed `backgroundColor` prop from `<Stage />` ([#28])


## 0.2.5 - 2018-02-11

### Added
- Added back removed `useSyncScheduling` option ([#15])

### Fixed
- Added `index.d.ts` file to distributed package `files` list ([#4], [#8])


## 0.2.4 - 2018-02-07 [YANKED]

### Removed
- Removed deprecated `useSyncScheduling` option ([#15])


## 0.2.3 - 2018-02-06

### Added
- Added an alias for "easy" migration from [`react-pixi`](https://github.com/Izzimach/react-pixi) ([#9])
- Added TypeScript definitions ([#8])


## 0.2.2 - 2018-01-17

### Fixed
- Fixed distributed cjs files by using `transform-es2015-modules-commonjs` with `babel` ([#4])


## 0.2.1 - 2018-01-17

### Added
- Added `<ParticleContainer />` component
- Added development build script
- Added `files` to `package.json`


## 0.2.0 - 2018-01-05

### Added
- Added standalone `render` function ([#2])


## 0.1.1 - 2018-01-05

### Fixed
- Added missing `performance-now` dependency


## 0.1.0 - 2018-01-05

### Added
- Added `ReactPixiFiber` renderer
- Added `<Stage />` component
- Added `<BitmapText />` component
- Added `<Container />` component
- Added `<Graphics />` component
- Added `<Sprite />` component
- Added `<Text />` component
- Added `<TilingSprite />` component



[#306]: https://github.com/michalochman/react-pixi-fiber/pull/306
[#291]: https://github.com/michalochman/react-pixi-fiber/pull/291
[#286]: https://github.com/michalochman/react-pixi-fiber/pull/286
[#285]: https://github.com/michalochman/react-pixi-fiber/issues/285
[#283]: https://github.com/michalochman/react-pixi-fiber/pull/283
[#277]: https://github.com/michalochman/react-pixi-fiber/pull/277
[#227]: https://github.com/michalochman/react-pixi-fiber/issues/227
[#225]: https://github.com/michalochman/react-pixi-fiber/issues/225
[#221]: https://github.com/michalochman/react-pixi-fiber/issues/221
[#210]: https://github.com/michalochman/react-pixi-fiber/issues/210
[#204]: https://github.com/michalochman/react-pixi-fiber/issues/204
[#196]: https://github.com/michalochman/react-pixi-fiber/issues/196
[#185]: https://github.com/michalochman/react-pixi-fiber/issues/185
[#182]: https://github.com/michalochman/react-pixi-fiber/pull/182
[#180]: https://github.com/michalochman/react-pixi-fiber/pull/180
[#174]: https://github.com/michalochman/react-pixi-fiber/pull/174
[#170]: https://github.com/michalochman/react-pixi-fiber/pull/170
[#166]: https://github.com/michalochman/react-pixi-fiber/pull/166
[#165]: https://github.com/michalochman/react-pixi-fiber/pull/165
[#163]: https://github.com/michalochman/react-pixi-fiber/pull/163
[#162]: https://github.com/michalochman/react-pixi-fiber/pull/162
[#157]: https://github.com/michalochman/react-pixi-fiber/pull/157
[#154]: https://github.com/michalochman/react-pixi-fiber/pull/154
[#153]: https://github.com/michalochman/react-pixi-fiber/pull/153
[#149]: https://github.com/michalochman/react-pixi-fiber/issues/149
[#148]: https://github.com/michalochman/react-pixi-fiber/pull/148
[#147]: https://github.com/michalochman/react-pixi-fiber/pull/147
[#141]: https://github.com/michalochman/react-pixi-fiber/pull/141
[#127]: https://github.com/michalochman/react-pixi-fiber/pull/127
[#125]: https://github.com/michalochman/react-pixi-fiber/issues/125
[#122]: https://github.com/michalochman/react-pixi-fiber/issues/122
[#120]: https://github.com/michalochman/react-pixi-fiber/issues/120
[#118]: https://github.com/michalochman/react-pixi-fiber/issues/118
[#112]: https://github.com/michalochman/react-pixi-fiber/pull/112
[#109]: https://github.com/michalochman/react-pixi-fiber/pull/109
[#98]: https://github.com/michalochman/react-pixi-fiber/pull/98
[#97]: https://github.com/michalochman/react-pixi-fiber/pull/97
[#95]: https://github.com/michalochman/react-pixi-fiber/pull/95
[#91]: https://github.com/michalochman/react-pixi-fiber/issues/91
[#89]: https://github.com/michalochman/react-pixi-fiber/pull/89
[#85]: https://github.com/michalochman/react-pixi-fiber/issues/85
[#84]: https://github.com/michalochman/react-pixi-fiber/pull/84
[#83]: https://github.com/michalochman/react-pixi-fiber/pull/83
[#81]: https://github.com/michalochman/react-pixi-fiber/issues/81
[#76]: https://github.com/michalochman/react-pixi-fiber/pull/76
[#72]: https://github.com/michalochman/react-pixi-fiber/pull/72
[#71]: https://github.com/michalochman/react-pixi-fiber/issues/71
[#67]: https://github.com/michalochman/react-pixi-fiber/pull/67
[#65]: https://github.com/michalochman/react-pixi-fiber/pull/65
[#64]: https://github.com/michalochman/react-pixi-fiber/pull/64
[#61]: https://github.com/michalochman/react-pixi-fiber/pull/61
[#60]: https://github.com/michalochman/react-pixi-fiber/pull/60
[#58]: https://github.com/michalochman/react-pixi-fiber/issues/58
[#54]: https://github.com/michalochman/react-pixi-fiber/issues/54
[#53]: https://github.com/michalochman/react-pixi-fiber/pull/53
[#47]: https://github.com/michalochman/react-pixi-fiber/pull/47
[#44]: https://github.com/michalochman/react-pixi-fiber/issues/44
[#43]: https://github.com/michalochman/react-pixi-fiber/issues/43
[#38]: https://github.com/michalochman/react-pixi-fiber/issues/38
[#37]: https://github.com/michalochman/react-pixi-fiber/pull/37
[#34]: https://github.com/michalochman/react-pixi-fiber/pull/34
[#30]: https://github.com/michalochman/react-pixi-fiber/pull/31
[#29]: https://github.com/michalochman/react-pixi-fiber/issues/29
[#28]: https://github.com/michalochman/react-pixi-fiber/issues/28
[#19]: https://github.com/michalochman/react-pixi-fiber/issues/19
[#15]: https://github.com/michalochman/react-pixi-fiber/issues/15
[#9]: https://github.com/michalochman/react-pixi-fiber/issues/9
[#8]: https://github.com/michalochman/react-pixi-fiber/issues/8
[#6]: https://github.com/michalochman/react-pixi-fiber/issues/6
[#4]: https://github.com/michalochman/react-pixi-fiber/issues/4
[#2]: https://github.com/michalochman/react-pixi-fiber/issues/2
