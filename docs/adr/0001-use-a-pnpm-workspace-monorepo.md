# 0001. Use a pnpm Workspace Monorepo

**Status:** accepted
**Date:** 2026-09-26

## Context

react-pixi-fiber started as one published package and an examples app. A `link.sh` script linked the two. Version 3.0.0 splits the library into a core package and one adapter package for each supported React major and PixiJS major. These packages change together. A change to the adapter contract of the core changes every adapter in the same logical change. The examples app is the manual test bed for all packages. It must run against the local sources, not against the published packages.

## Decision Drivers

- A change to the core contract must land together with the changes to every adapter, in one change that a reviewer can read
- The examples must build against the local packages in CI and on the machine of a contributor, with no manual link step
- Each package declares its real dependencies, because each package is published separately. A missing dependency must fail locally. It must not work by accident.
- One install and one set of commands run lint, build, tests, and type checks
- The `package.json` file of a project must show the version that the workspace builds and tests with

## Decision

Use a pnpm workspace (`pnpm-workspace.yaml`) with two top-level directories:

- `packages/`: every published package, one directory each
- `apps/`: private apps that are not published

Local packages depend on each other with `workspace:*`. `pnpm -r` runs commands across the workspace (`build`, `test:dev`, `test:prod`, `check-types`). There is no separate task runner.

The root `packageManager` field pins the pnpm version, and `corepack` enables it. The Node version comes from `.nvmrc`. CI uses the same Node version.

Published packages declare React, react-dom, and PixiJS as peer dependencies, with ranges that consumers resolve. Every other dependency names an exact version. This applies to the dependencies and the devDependencies of the root, of each package, and of each app. The committed `pnpm-lock.yaml` makes the installs of the workspace reproducible. CI installs with `pnpm install --frozen-lockfile`.

## Considered Alternatives

### npm workspaces

npm workspaces are part of Node.js, so no extra tool is necessary. But npm hoists dependencies. A package can then import a dependency that it does not declare, and the import still works locally. For packages that are published separately, this is the failure to prevent. The strict `node_modules` layout of pnpm shows this failure immediately.

### A separate repository for each package

Each adapter could have its own release and version history. But a change to the core contract would need coordinated pull requests in every adapter repository. Also, the examples could not test an unreleased core together with an unreleased adapter.

### A task runner on top of pnpm (Turbo, Nx)

A task runner adds a build cache and a task graph. The workspace packages are small, and `pnpm -r` already runs scripts in dependency order. A cache would save little time. It would add one more tool and one more config file to maintain.

## Consequences

- A contract change and its adapter changes land in one commit, but every contributor must use pnpm (`packageManager` enforces this)
- The examples always run against the local sources, but a mistake that shows only in a published package needs a separate check. An example is a file that is missing from the `files` list of a package. See [0005](0005-check-each-package-as-a-consumer-installs-it.md).
- Peer ranges let consumers deduplicate React and PixiJS, but each upgrade of another dependency changes a `package.json` file, not only the lockfile
- `pnpm -r` keeps the tooling small, but there is no build cache. CI builds everything again on every run.
