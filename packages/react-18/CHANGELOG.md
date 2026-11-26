# @react-pixi-fiber/react-18

## 1.1.0

### Minor Changes

- [#425](https://github.com/KalambaGames/react-pixi-fiber/pull/425) [`eff542e`](https://github.com/KalambaGames/react-pixi-fiber/commit/eff542e1c2ea359bb0bd9e6044e30508a9e2c90e) Thanks [@michalochman](https://github.com/michalochman)! - A behavior can have `afterMount(displayObject, props)`. It runs when React commits a new Display Object, after `afterAdd`, once for each Display Object. Inside a hidden `<Activity>`, it runs when React shows the Display Object. Start a ticker callback or a timer there: React can drop a render without a commit, and then `beforeRemove` never runs. The React adapters call the new `HostOps.commitMount`, so they need a core that has it. In development, the core warns once when a React adapter does not call it.

## 1.0.0

### Major Changes

- [#377](https://github.com/KalambaGames/react-pixi-fiber/pull/377) [`b5e5be4`](https://github.com/KalambaGames/react-pixi-fiber/commit/b5e5be46120e80ee101f87775d857a7e190cd633) Thanks [@michalochman](https://github.com/michalochman)! - Initial release. The React 18 adapter for React 18.3.1 or a later 18.x; 2.x accepted React 18.2. It bundles `react-reconciler` 0.29.2 and renders on a legacy root, as 2.x did; `react18({ root: "concurrent" })` renders on a concurrent root instead. Errors React recovers from are logged with `console.error`.

## 1.0.0-beta.0

### Patch Changes

- First beta. No new features are planned before the stable release. The API changes only to fix a problem found in use.

## 1.0.0-alpha.0

### Major Changes

- [#377](https://github.com/michalochman/react-pixi-fiber/pull/377) [`b5e5be4`](https://github.com/michalochman/react-pixi-fiber/commit/b5e5be46120e80ee101f87775d857a7e190cd633) Thanks [@michalochman](https://github.com/michalochman)! - Initial release. The React 18 adapter for React 18.3.1 or a later 18.x; 2.x accepted React 18.2. It bundles `react-reconciler` 0.29.2 and renders on a legacy root, as 2.x did; `react18({ root: "concurrent" })` renders on a concurrent root instead. Errors React recovers from are logged with `console.error`.

### Patch Changes

- Updated dependencies [[`446f761`](https://github.com/michalochman/react-pixi-fiber/commit/446f7619b852df4ffdf432d5c032e837f21968ee)]:
  - react-pixi-fiber@3.0.0-alpha.0
