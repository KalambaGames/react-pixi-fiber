# @react-pixi-fiber/react-18

[![npm](https://img.shields.io/npm/v/@react-pixi-fiber/react-18.svg)](https://npmjs.com/package/@react-pixi-fiber/react-18)

React 18 adapter for [react-pixi-fiber](https://github.com/KalambaGames/react-pixi-fiber). It bundles `react-reconciler` 0.29.2 and builds the renderer that `react-pixi-fiber` uses to render PixiJS Display Objects. It needs React 18.3.1 or a later 18.x, the peer range of that `react-reconciler`.

Install it next to `react-pixi-fiber`, `react` 18 and a PixiJS adapter from the [adapter table](../react-pixi-fiber/README.md#setup), then configure once in the app entry, before the first render:

```js
import { configure } from "react-pixi-fiber";
import react18 from "@react-pixi-fiber/react-18";
import pixiN from "@react-pixi-fiber/pixi-N"; // the PixiJS adapter for your PixiJS version

configure({ react: react18(), pixi: pixiN() });
```

The tree renders on a legacy root, as 2.x did. To render it on a concurrent root, as `createRoot` does, pass `react18({ root: "concurrent" })`.

## Supported features

The tree inside `Stage`, or inside a container passed to `render`, is its own React root. Features that are plain React work as the [React documentation](https://react.dev/reference/react) describes.

| Feature | Support |
| --- | --- |
| Context, error boundaries, hooks, refs | Supported. A ref on a tag receives the PixiJS Display Object |
| Concurrent features | With `root: "concurrent"`, supported: `render` commits synchronously; later updates, `startTransition` and `useDeferredValue` are scheduled as on a `createRoot` root, and an update from a PixiJS event handler gets the priority react-dom gives that DOM event. With the default `root: "legacy"`, not available: `startTransition` and `useDeferredValue` updates render synchronously |
| DevTools | The renderer registers with React DevTools as `react-pixi-fiber` in development |
| Errors while rendering | Thrown from `render` and caught by error boundaries; errors React recovers from are logged with `console.error` |
| `<StrictMode>` | Development prop validation runs under a `<StrictMode>` ancestor (React 18 mode bit `8`) |
| `<Suspense>` | Supported. A suspended subtree is hidden with `visible = false` and shown again with its `visible` prop |
| Text children | Not supported: a string child throws; use the `Text` tag |

## Migrating from `@react-pixi-fiber/react-17`

1. Install `@react-pixi-fiber/react-18` and `react` 18.3.1 or a later 18.x, and pass `react18()` to `configure` instead of `react17()`.
2. Follow the [React 18 upgrade guide](https://react.dev/blog/2022/03/08/react-18-upgrade-guide) for the rest of the app, for example `createRoot` instead of `ReactDOM.render`.

Inside `Stage` the root stays a legacy root, so the tree renders as before; pass `react18({ root: "concurrent" })` to opt into a concurrent root. Development prop validation still runs under `<StrictMode>`; errors React recovers from are now logged with `console.error`.
