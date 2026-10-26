# Contributing

## Open Development

All work on React Pixi Fiber happens directly on [GitHub](https://github.com/michalochman/react-pixi-fiber). Both core team members and external contributors send pull requests which go through the same review process.


## Branch Organization

We will do our best to keep the [`master` branch](https://github.com/michalochman/react-pixi-fiber/tree/master) in good shape, with tests passing at all times. But in order to move fast, we will make API changes that your application might not be compatible with. We recommend that you use [the latest stable version of React](https://reactjs.org/downloads.html).

If you send a pull request, please do it against the `master` branch.


## Semantic Versioning

React Pixi Fiber follows [semantic versioning](http://semver.org/). We release patch versions for bugfixes, minor versions for new features, and major versions for any breaking changes. When we make breaking changes, we also introduce deprecation warnings in a minor version so that our users learn about the upcoming changes and migrate their code in advance.


## Changelog

Every package has its own `CHANGELOG.md`, for example the [core changelog](./packages/react-pixi-fiber/CHANGELOG.md). Changesets writes the entries at release from the pending changesets, so a change goes into a changeset (`pnpm changeset`), not into a `CHANGELOG.md` by hand.

Changesets inserts a release above the first header that starts with a version number, `## 3.0.0` or `## 2.0.0-rc.4 - 2026-09-28`; a bracketed header such as `## [2.0.0]` does not count. Keep version headers unbracketed, also in entries written by hand on a maintenance branch, so each release lands on top. An adapter `CHANGELOG.md` holds only its `# <package name>` title until its first release.


## Releasing

Every user-visible change adds a changeset with `pnpm changeset`. The release runs `pnpm version-packages`, commits the result as `chore(release): prepare <version>`, then runs `pnpm release`.

Changesets versions every package on its own. The adapters peer `react-pixi-fiber` with a caret range (`^3.0.0`); `.changeset/config.json` sets `onlyUpdatePeerDependentsWhenOutOfRange`, so a core release inside that range does not bump the adapters.

### React minor versions

Each React adapter bundles the newest `react-reconciler` of its React major and peers the `react` range that reconciler declares, for example `@react-pixi-fiber/react-19` bundles 0.34.0 and peers `react` ^19.3.0. When a React minor needs a newer reconciler, the adapter gets a new major version that bundles it and raises the `react` floor. Apps on older React minors stay on the previous adapter major.


## Adding an adapter

1. Copy the nearest adapter: `packages/pixi-N` for a PixiJS major, `packages/react-N` for a React major.
2. Rename the package, its directory and its build entries, and change the data: the PixiJS classes of the core tags, the typed property table and the application factory, or the bundled `react-reconciler` version and the host config. Set the peer dependencies to the new major and `react-pixi-fiber` ^3.0.0, and keep `version` at `0.0.0`.
3. Add the smoke test, `test/smoke.test.tsx`, that runs `smokeSuite` from `packages/react-pixi-fiber/test/utils/smoke.tsx` with the new adapter.
4. Add the adapter to the package tables in the root `README.md` and in the [Setup](./packages/react-pixi-fiber/README.md#setup) section of the core README, and write its `README.md`: setup, a "Supported features" section and a "Migrating from" section for the previous major. The README describes only that adapter; the migration section may name the previous one.
5. Add a changeset (`pnpm changeset`) that releases the new package as `major`, so it starts at `1.0.0`.
6. Run `pnpm install`, then the checks listed in [Sending a Pull Request](#sending-a-pull-request).


## Bugs

We are using [GitHub Issues](https://github.com/michalochman/react-pixi-fiber/issues) for our public bugs. We keep a close eye on this and try to make it clear when we have an internal fix in progress. Before filing a new task, try to make sure your problem doesn't already exist.


## Proposing a Change

If you intend to change the public API, or make any non-trivial changes to the implementation, we recommend [filing an issue](https://github.com/michalochman/react-pixi-fiber/issues/new). This lets us reach an agreement on your proposal before you put significant effort into it.

If you're only fixing a bug, it's fine to submit a pull request right away but we still recommend to file an issue detailing what you're fixing. This is helpful in case we don't accept that specific fix but want to keep track of the issue.


## Sending a Pull Request

The core team is monitoring for pull requests. We will review your pull request and either merge it, request changes to it, or close it with an explanation.

**Before submitting a pull request**, please make sure the following is done:

1. Fork [the repository](https://github.com/michalochman/react-pixi-fiber) and create your branch from `master`.
2. Run `pnpm install` in the repository root.
3. If you've fixed a bug or added code that should be tested, add tests!
4. Ensure the test suite passes (`pnpm test`) and the types check (`pnpm check-types`). If you changed `package.json` or the build, run the package check (`pnpm check-package`). If you changed an adapter or its build, run the bundle check (`pnpm check-bundle`).
5. Format your code (`pnpm format`) and make sure it lints (`pnpm lint`).
6. Write your commit messages as [Conventional Commits](#commit-messages).

Every pull request gets a preview of the playgrounds on Cloudflare Pages; the URL is posted as a comment on the pull request.

## Style Guide

We use [Biome](https://biomejs.dev) to format and lint the code. Run `pnpm format` after making any changes to the code, and `pnpm lint` to check it.

However, there are still some styles that the linter cannot pick up. If you are unsure about something, looking at [Airbnb's Style Guide](https://github.com/airbnb/javascript) will guide you in the right direction.


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
