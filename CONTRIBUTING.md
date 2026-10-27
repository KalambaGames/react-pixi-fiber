# Contributing

## Open Development

All work on React Pixi Fiber happens on [GitHub](https://github.com/KalambaGames/react-pixi-fiber). Core team members and external contributors send pull requests. All pull requests go through the same review.


## Branch Organization

We try to keep the [`master` branch](https://github.com/KalambaGames/react-pixi-fiber/tree/master) stable, with all tests passing. To move fast, we make API changes that can break your application. We recommend [the latest stable version of React](https://reactjs.org/downloads.html).

Send pull requests against the `master` branch.


## Semantic Versioning

React Pixi Fiber follows [semantic versioning](http://semver.org/). We release patch versions for bug fixes, minor versions for new features and major versions for breaking changes. Before a breaking change, a minor version adds deprecation warnings. These warnings tell users about the change, so they can migrate their code in advance.


## Changelog

Every package has its own `CHANGELOG.md`, for example the [core changelog](./packages/react-pixi-fiber/CHANGELOG.md). At release, Changesets writes the entries from the pending changesets. Put each change in a changeset (`pnpm changeset`). Do not edit a `CHANGELOG.md` by hand.

Changesets inserts a release above the first header that starts with a version number, for example `## 3.0.0` or `## 2.0.0-rc.4 - 2026-09-28`. A header in brackets, such as `## [2.0.0]`, does not count. Keep version headers without brackets, also in entries that you write by hand on a maintenance branch. Then each release goes on top. An adapter `CHANGELOG.md` holds only its `# <package name>` title until its first release.


## Releasing

Every user-visible change adds a changeset with `pnpm changeset`. The release runs `pnpm version-packages`, commits the result as `chore(release): prepare <version>`, then runs `pnpm release`.

Changesets versions every package on its own. The adapters peer `react-pixi-fiber` with a caret range (`^3.0.0`). `.changeset/config.json` sets `onlyUpdatePeerDependentsWhenOutOfRange`. A core release inside that range therefore does not change the adapter versions.

### React minor versions

Each React adapter bundles the newest `react-reconciler` of its React major. It peers the `react` range that this reconciler declares. For example, `@react-pixi-fiber/react-19` bundles 0.34.0 and peers `react` ^19.3.0. When a React minor needs a newer reconciler, the adapter gets a new major version that bundles it and raises the `react` floor. Apps on older React minors stay on the previous adapter major.


## Adding an adapter

1. Copy the nearest adapter: `packages/pixi-N` for a PixiJS major, `packages/react-N` for a React major.
2. Rename the package, its directory and its build entries. For a PixiJS adapter, change the PixiJS classes of the core tags, the typed property table and the application factory. For a React adapter, change the bundled `react-reconciler` version and the host config. Set the peer dependencies to the new major and to `react-pixi-fiber` ^3.0.0. Keep `version` at `0.0.0`.
3. Add the smoke test, `test/smoke.test.tsx`, that runs `smokeSuite` from `packages/react-pixi-fiber/test/utils/smoke.tsx` with the new adapter.
4. Add the adapter to the package tables in the root `README.md` and in the [Setup](./packages/react-pixi-fiber/README.md#setup) section of the core README. Write the adapter `README.md`: setup, a "Supported features" section and a "Migrating from" section for the previous major. The README describes only this adapter. The migration section can name the previous adapter.
5. Add a changeset (`pnpm changeset`) that releases the new package as `major`, so it starts at `1.0.0`.
6. Run `pnpm install`, then the checks listed in [Sending a Pull Request](#sending-a-pull-request).


## Bugs

We use [GitHub Issues](https://github.com/KalambaGames/react-pixi-fiber/issues) for public bugs. We read new issues, and we try to tell you when an internal fix is in progress. Before you open an issue, search for an existing issue about your problem.


## Proposing a Change

If you want to change the public API, or make a large change to the implementation, we recommend that you [open an issue](https://github.com/KalambaGames/react-pixi-fiber/issues/new) first. Then we can agree on your proposal before you put much work into it.

If you only fix a bug, you can send a pull request immediately. We still recommend an issue that describes the bug. If we do not accept your fix, the issue keeps a record of the bug.


## Sending a Pull Request

The core team reviews each pull request. Then we merge it, request changes, or close it with an explanation.

**Before you send a pull request**, do these steps:

1. Fork [the repository](https://github.com/KalambaGames/react-pixi-fiber) and create your branch from `master`.
2. Run `pnpm install` in the repository root.
3. If you fixed a bug or added code that needs tests, add tests.
4. Ensure the test suite passes (`pnpm test`) and the types check (`pnpm check-types`). If you changed `package.json` or the build, run the package check (`pnpm check-package`). If you changed an adapter or its build, run the bundle check (`pnpm check-bundle`).
5. Format your code (`pnpm format`). Make sure that `pnpm lint` passes.
6. Write your commit messages as [Conventional Commits](#commit-messages).

Each pull request gets a preview of the playgrounds on Cloudflare Pages. A comment on the pull request gives the preview URL.

## Style Guide

We use [Biome](https://biomejs.dev) to format and lint the code. Run `pnpm format` after you change the code. Run `pnpm lint` to check it.


## Commit Messages

Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/). The reasons are in [ADR 0006](./docs/adr/0006-use-conventional-commits.md).

```
type(scope): description
```

- **type** is one of `feat`, `fix`, `perf`, `refactor`, `docs`, `test`, `build`, `ci`, or `chore`.
- **scope** is the directory name of the package or app that the commit changes, for example `pixi-8`, `react-18`, or `playground-pixi8`. The core package `react-pixi-fiber` uses the scope `core`. Leave out the scope when the commit changes the whole repository, or more than one package for one reason.
- **description** is an imperative sentence that starts with a lowercase letter and has no period at the end.
- Add `!` after the type or the scope, or a `BREAKING CHANGE:` footer, for a breaking change.

A `feat` or `fix` commit that changes a published package also adds a changeset for that package, in the same commit or in the same pull request.

```
feat(pixi-8): support ParticleContainer and Particle
fix(core): restore the recorded default when a prop is removed
ci: run the package check on every change
```

The review of a pull request checks its commit messages.


## License

By contributing to React Pixi Fiber, you agree that your contributions will be licensed under its MIT license.
