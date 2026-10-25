# 0004. Test Each Package with Its Own React and PixiJS

**Status:** accepted
**Date:** 2026-09-26

## Context

Version 2.x tested one package with Jest 26 and babel-plugin-rewire. Version 3.0.0 has a core package, one React adapter for each React major, and one PixiJS adapter for each PixiJS major (see [0001](0001-use-a-pnpm-workspace-monorepo.md)). Each adapter supports a different version of React or PixiJS. A consumer can combine any React adapter with any PixiJS adapter. The library behaves differently in development and in production, because the production build does not contain the development-only warnings and checks (see [0002](0002-build-every-package-with-tsdown.md)).

## Decision Drivers

- Each package must be tested against the React or PixiJS version that it supports, not against the version that another package uses
- Tests must cover the development behavior and the production behavior
- A test of one package must not add another package as a workspace dependency. The dependency graph of the packages must stay the same as for a consumer.
- The full behavior suite must run for one adapter pair only. A small smoke suite may run for every pair.
- The public types are part of the API and must have tests too

## Decision

Vitest runs the tests of every package. One factory, `scripts/vitest.config.ts`, defines the configuration. Each package calls the factory in its own `vitest.config.mts`. The tests run in jsdom with `vitest-webgl-canvas-mock`.

Each package has two test scripts:

- `test:dev` runs the tests with `__DEV__` set to `true`
- `test:prod` runs the same tests with `__DEV__` set to `false`

CI runs both scripts for every package.

Each package pins its own `react` and `pixi.js` versions as devDependencies. The Vitest config aliases React to the copy of the package under test, because the React version that renders an element must also create it. The config aliases workspace packages to their sources by relative path, so no package lists another package as a test dependency.

The tests of each package have these scopes:

- **Core:** the full behavior suite runs against one real React adapter and one real PixiJS adapter, the development pair. A 2.x compatibility suite (`test/compat2x.test.jsx`) runs 2.x usage against the 3.0.0 core.
- **React adapters:** render, unmount, DevTools injection, and synchronous commit. The tests wrap the real reconciler and give it a host tree of plain objects, not real PixiJS.
- **PixiJS adapters:** components, property tables, application creation, and compat translation, against the real PixiJS version of the adapter. When the adapter has behavior that only a render shows, for example a compat translation or event props, one React adapter renders its components. The other adapters get their render check from the smoke suite.

One smoke suite lives in the test utilities of the core, as a function. It mounts a `Stage`, renders a `Sprite`, changes a prop, reorders children, and unmounts. A private app, `apps/test-matrix`, holds one package for each React major. Each package pins its own `react` and `react-test-renderer`. Each package runs the smoke suite with its React adapter and every PixiJS adapter. So every adapter pair runs the smoke suite, and only the smoke suite.

With `RPF_DIST=es`, the Vitest config resolves the core and the adapters to their ES builds instead of their sources. CI runs the smoke suite once from the ES development builds. The production builds bundle the production reconciler. The development React of the test environment cannot drive the production reconciler of React 19, so the production builds do not render in tests. `pnpm check-package` loads them (see [0005](0005-check-each-package-as-a-consumer-installs-it.md)).

The test-matrix packages have no type check. Every PixiJS adapter augments the same core types, so one TypeScript program cannot hold all PixiJS adapters.

Type tests are TSX fixtures under `test/typescript/`. `pnpm check-types` compiles them. A fixture shows that valid usage compiles and that invalid usage fails, with `@ts-expect-error`.

## Considered Alternatives

### Jest, as in 2.x

The 2.x suite already ran on Jest. But Jest needs Babel or a separate transform for TypeScript. babel-plugin-rewire, which the 2.x tests used to replace module internals, depends on Babel. Vitest uses the same transform as the build tooling and runs TypeScript directly.

### Run the full behavior suite for every adapter pair

Each React adapter would run the full suite of the core with each PixiJS adapter. This finds every problem that only one pair has. But the number of runs grows as the product of the React majors and the PixiJS majors. The adapters meet only through the data contract of the core, so a pair-specific problem shows in a small smoke test. The smoke suite runs for every pair, and the full suite runs for one pair.

### Install every React major in one test package

One package would install each React major under an alias, for example `react17`. But pnpm resolves the `react` peer of `react-test-renderer` to one React version for the whole package. The aliased renderers then pair with the wrong React. One package for each React major gives pnpm one React to pair with.

### A browser test runner instead of jsdom

A real browser runs real WebGL, and the PixiJS application code runs as in production. But browser runs are slower and need a browser in CI. jsdom with a canvas mock covers the logic of the library. The examples app covers real rendering, and contributors check it manually in a browser.

## Consequences

- Each package tests the versions that it supports, but the workspace installs several React and PixiJS majors side by side. Each package needs the Vitest alias to find its own copy.
- Development and production behavior both have tests, but each test run takes twice as long
- The smoke suite runs for every adapter pair, but only the smoke suite. A pair-specific problem outside the smoke suite still reaches a release.
- The smoke suite renders once from the ES development builds, but the production builds and the CommonJS builds do not render in tests
- The test-matrix packages install every adapter, but they have no type check
- Tests run in jsdom with a canvas mock, so they are fast, but no automated test checks real WebGL rendering. A rendering change needs a manual browser check of the examples.
- The test-matrix packages import the smoke suite from the core by relative path. A change to the smoke suite can break the tests of every adapter pair.
