# 0013. Let Adapters Depend Only on Core Types

**Status:** accepted
**Date:** 2026-09-26

## Context

The workspace has a core package, React adapters, PixiJS adapters, and apps (see [0001](0001-use-a-pnpm-workspace-monorepo.md)). An application installs the core, one React adapter, and one PixiJS adapter, and connects them with `configure` (see [0010](0010-split-the-library-into-a-core-and-adapters.md)). The adapters contain similar code: the React adapters build similar host configs, and the PixiJS adapters have similar component and property tables. It is tempting to move this code into a shared package, or to let an adapter call helpers of the core at run time. Each such dependency changes what a consumer installs and which package versions must match.

## Decision Drivers

- A consumer must be able to combine any React adapter with any PixiJS adapter and any core release inside the peer ranges
- An application must never load two copies of the core, because the core holds the configuration and the component registry in module state
- A release of one adapter must not change the behavior of another adapter
- The dependency direction must stay simple enough that a contributor can check it by reading the `package.json` files

## Decision

The dependencies between packages point in one direction:

```
apps  →  adapters  →  core (types only)
```

1. **The core depends on no adapter.** It declares only `react` as a peer dependency.
2. **An adapter imports only types from the core** (`import type ... from "react-pixi-fiber"`). The built JavaScript of an adapter contains no `import` or `require` of the core. The adapter declares the core as a peer dependency with a caret range, because its declarations import types from the core.
3. **An adapter depends on no other adapter.** A React adapter declares only `react` and the core as peers. A PixiJS adapter declares only `pixi.js` and the core as peers. When a PixiJS major ships no typings, its adapter can also declare the package of those typings as an optional peer. An example is `@types/pixi.js` for PixiJS 4.
4. **React, PixiJS, and the core are always peer dependencies**, never regular dependencies. The React adapters bundle their `react-reconciler`, so no other runtime dependency remains (see [0011](0011-use-one-react-adapter-for-each-react-major.md)).
5. **Adapters share no runtime code.** When two adapters need the same code, each adapter has its own copy. A small helper of the core that an adapter needs at run time, such as `warning`, is also copied.
6. **Tests share utilities by relative path**, not by a dependency (see [0004](0004-test-each-package-with-its-own-react-and-pixijs.md)).

The package check fails when the build of an adapter imports the core at run time (see [0005](0005-check-each-package-as-a-consumer-installs-it.md)). Code review checks the other rules.

## Considered Alternatives

### A shared internal package for adapter code

The copied host config code and the copied tables would move into one internal package. Every adapter would bundle it or depend on it. There would be one copy to fix. But a change to the shared package would change every adapter that uses it at the same time. As a regular dependency, it would also add one more package that consumers install and match.

### Runtime helpers of the core for adapters

The core would export functions such as a base host config or a compat translator factory, and adapters would call them. This removes copies. But the adapter would then need a matching core version at run time, not only at type-check time. A peer range mismatch, or two copies of the core in one install, would break the application at run time.

### Adapters with the core as a regular dependency

Each adapter would install the core that it needs. Consumers would not have to install the core themselves. But two adapters could then install two copies of the core. Each copy would have its own configuration and registry, and `configure` would configure only one of them.

## Consequences

- Any adapter pair works with any core release inside the peer ranges, but the peer ranges are the only contract. A core change that breaks the adapter types needs a new core major.
- An application loads one core, because every adapter declares it as a peer, but consumers must install the core next to the adapters
- Adapters never break each other, but copied code must be fixed in each copy by hand
- The dependency direction is visible in the `package.json` files, and the package check finds a runtime import of the core. But no tool checks the other rules. Code review must find a violation of them.
