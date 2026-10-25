---
"react-pixi-fiber": major
---

Split into a core package and per-version adapters. Call `configure({ react, pixi })` once at the app entry with a React adapter (`@react-pixi-fiber/react-17`, `react-18`, `react-19`) and a PixiJS adapter (`@react-pixi-fiber/pixi-4` to `pixi-8`). See the migration guide in the README.

### Added
- `configure({ react, pixi })`, called once in the app entry before the first render, wires a React adapter and a PixiJS adapter into the core. Without it the first render throws an error that prints the install line and the setup lines
- React adapters: `@react-pixi-fiber/react-17` for React 17.0.2 or a later 17.x, `@react-pixi-fiber/react-18` for React 18.3.1 or a later 18.x and `@react-pixi-fiber/react-19` for React 19.3 or a later 19.x
- PixiJS adapters: `@react-pixi-fiber/pixi-4` for PixiJS 4.4 or a later 4.x, `@react-pixi-fiber/pixi-5`, `@react-pixi-fiber/pixi-6`, `@react-pixi-fiber/pixi-7` for PixiJS 7.2 or a later 7.x and `@react-pixi-fiber/pixi-8` for PixiJS 8.9 or a later 8.x. The `pixi-7` and `pixi-8` adapters have a `compat/pixi6` module that translates the 2.x props their PixiJS version renamed or ignores. Each adapter's changelog lists its tags and peers
- Fragment refs on React 19: a `<Fragment ref>` inside `Stage` receives a `PixiFragmentInstance` with `children`, `getBounds()`, `off(event, fn)` and `on(event, fn)` over the fragment's top-level Display Objects
- The PixiJS adapter's `defaults` option sets default props per tag, like React's `defaultProps`: `pixi6({ defaults: { Sprite: { alpha: 0.5 } } })`. A prop that is missing or `undefined` when the instance is created gets its default before `create` runs, and a prop removed later, or set to `undefined`, returns to it. An explicit `null` is kept. Entries are keyed by the tag name; the deprecated `NineSlicePlane` on PixiJS 8 is keyed as `NineSliceSprite`
- A PixiJS adapter can rename props with `translateProps` before they are validated, set or diffed; a `PIXIComponent` with its own `applyProps` receives the props as written, with the `defaults` applied
- `PIXIComponent(type, behavior)` and `PIXIProperty` replace `CustomPIXIComponent(behavior, type)` and `CustomPIXIProperty`. Behavior keys are `create`, `applyProps`, `afterAdd`, `beforeRemove`, and the unstable `appendChild`, `insertBefore` and `removeChild`, which let a container own the order of children that are not Display Objects. The `Behavior`, `BehaviorInput` and `ApplyPropsContext` types describe a behavior
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
- `applyProps(instance, oldProps, newProps)` is exported for higher-order components; `_customApplyProps`, `_customDidAttach`, `_customWillDetach` are no longer attached to Display Objects
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
