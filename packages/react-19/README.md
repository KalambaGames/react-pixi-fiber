# @react-pixi-fiber/react-19

[![npm](https://img.shields.io/npm/v/@react-pixi-fiber/react-19.svg)](https://npmjs.com/package/@react-pixi-fiber/react-19)

React 19 adapter for [react-pixi-fiber](https://github.com/KalambaGames/react-pixi-fiber). It bundles `react-reconciler` 0.34.0 and builds the renderer that `react-pixi-fiber` uses to render PixiJS Display Objects. It needs React 19.3 or newer, the peer range of that `react-reconciler`.

Install it next to `react-pixi-fiber`, `react` 19 and a PixiJS adapter from the [adapter table](../react-pixi-fiber/README.md#setup), then configure once in the app entry, before the first render:

```js
import { configure } from "react-pixi-fiber";
import react19 from "@react-pixi-fiber/react-19";
import pixiN from "@react-pixi-fiber/pixi-N"; // the PixiJS adapter for your PixiJS version

configure({ react: react19(), pixi: pixiN() });
```

An error thrown while rendering is reported to `console.error` instead of being thrown from `render()`.

`<ViewTransition>` inside `Stage` renders its children without animating.

A `<Fragment ref>` inside `Stage` receives the fragment's top-level Display Objects:

- `children` lists them.
- `getBounds()` returns the bounds of each.
- `off(event, fn)` removes a listener that `on` added.
- `on(event, fn)` adds a listener to each, including Display Objects added to the fragment later.

Type the ref with `useRef<PixiFragmentInstance>(null)`, or annotate a callback ref: `ref={(instance: PixiFragmentInstance | null) => ...}` (`PixiFragmentInstance` is a type export of `react-pixi-fiber`).

## Supported features

The tree inside `Stage`, or inside a container passed to `render`, is its own React root. Features that are plain React work as the [React documentation](https://react.dev/reference/react) describes.

| Feature | Support |
| --- | --- |
| `<Activity>` | Supported. A hidden `<Activity>` hides its Display Objects with `visible = false` |
| Concurrent features | Supported: the root is a concurrent root. `render` commits synchronously; later updates, `startTransition` and `useDeferredValue` are scheduled as on a `createRoot` root |
| Context, error boundaries, hooks, refs | Supported. A ref on a tag receives the PixiJS Display Object |
| DevTools | The renderer registers with React DevTools in development |
| Errors while rendering | Caught by error boundaries; uncaught, caught and recoverable errors are reported to `console.error`, not thrown from `render()` |
| Fragment refs | Supported, as described above |
| `<StrictMode>` | Development prop validation runs under a `<StrictMode>` ancestor (React 19 mode bit `8`) |
| `<Suspense>` | Supported. A suspended subtree is hidden with `visible = false` and shown again with its `visible` prop |
| Text children | Not supported: a string child is reported to `console.error`; use the `Text` tag |
| `<ViewTransition>` | Renders its children without animating |

## Migrating from `@react-pixi-fiber/react-18`

1. Install `@react-pixi-fiber/react-19` and `react` 19.3 or newer, and pass `react19()` to `configure` instead of `react18()`.
2. Follow the [React 19 upgrade guide](https://react.dev/blog/2024/04/25/react-19-upgrade-guide) for the rest of the app.

What changes inside `Stage`:

- The root is a concurrent root instead of a legacy root, and React 19 has no legacy root, so `react19()` takes no `root` option. The first render still commits synchronously; transitions and deferred values inside the tree now defer. With `react18({ root: "concurrent" })` this was already the case.
- An error thrown while rendering, or a string child, is reported to `console.error` instead of being thrown from `render()`. Code or tests that caught it from `render()` read the console or use an error boundary.
- `<Activity>`, `<ViewTransition>` and fragment refs are available.
