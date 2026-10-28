# @react-pixi-fiber/react-19

## 1.0.0-beta.0

### Patch Changes

- First beta. No new features are planned before the stable release. The API changes only to fix a problem found in use.

## 1.0.0-alpha.0

### Major Changes

- [#377](https://github.com/michalochman/react-pixi-fiber/pull/377) [`b5e5be4`](https://github.com/michalochman/react-pixi-fiber/commit/b5e5be46120e80ee101f87775d857a7e190cd633) Thanks [@michalochman](https://github.com/michalochman)! - Initial release. The React 19 adapter for React 19.3 or a later 19.x. It bundles `react-reconciler` 0.34.0 and renders on a concurrent root, as `createRoot` does; 2.x rendered on a legacy root. It logs uncaught, caught and recoverable render errors with `console.error`, gives a `<Fragment ref>` inside `Stage` a `PixiFragmentInstance`, and renders a `<ViewTransition>` inside `Stage` without animating.

### Patch Changes

- Updated dependencies [[`446f761`](https://github.com/michalochman/react-pixi-fiber/commit/446f7619b852df4ffdf432d5c032e837f21968ee)]:
  - react-pixi-fiber@3.0.0-alpha.0
