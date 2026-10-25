# 0006. Use Conventional Commits

**Status:** accepted
**Date:** 2026-09-26

## Context

The commit messages of the repository are imperative sentences with no fixed structure, for example "Add the PixiJS 5 adapter". A reader cannot tell from the message which package a commit changes or what kind of change it is. The workspace has a core package, adapter packages, apps, and build scripts (see [0001](0001-use-a-pnpm-workspace-monorepo.md)), so most commits change one package only. Each user-visible change to a published package also needs a changeset (see [0007](0007-version-each-package-independently-with-changesets.md)).

## Decision Drivers

- A reader of `git log` must see the kind of change and the changed package from the message alone
- A tool must be able to parse and check the messages, without a person
- The format must be common, so that contributors and tools already know it
- The format must mark a breaking change explicitly

## Decision

Every commit message follows [Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/):

```
type(scope): description

optional body

optional footers
```

- **type** is one of `feat`, `fix`, `perf`, `refactor`, `docs`, `test`, `build`, `ci`, and `chore`.
- **scope** is the directory name of the package or app that the commit changes, for example `pixi-8`, `react-18`, or `playground-pixi8`. The core package `react-pixi-fiber` uses the scope `core`, because the other scopes also leave out the `react-pixi-fiber` prefix.
- A commit that changes several directories of one family uses the name of the family. For example, a commit that changes several playground apps uses `playground`.
- A commit that changes two or three packages or apps for one reason lists their scopes, separated by commas, for example `fix(pixi-5,pixi-6)`.
- A commit that changes more packages or apps for one reason, or the whole repository, has no scope.
- **description** is an imperative sentence that starts with a lowercase letter and has no period at the end.
- A `!` after the type or the scope, or a `BREAKING CHANGE:` footer, marks a breaking change.

A release commit applies the pending changesets. Its message starts with `chore(release): ` and names the version, for example `chore(release): prepare 3.0.0-alpha.2`. A merge commit that GitHub creates keeps the message that GitHub gives it.

A `feat` or `fix` commit that changes a published package also adds a changeset for that package, in the same commit or in the same pull request.

Examples:

```
feat(pixi-8): support ParticleContainer and Particle
fix(core): restore the recorded default when a prop is removed
feat(core)!: require configure() before the first render
ci: run the package check on every change
feat(playground): show an integration example for each PixiJS major
fix(pixi-5,pixi-6): restore the WebGL context of a shared canvas
chore(release): prepare 3.0.0-alpha.2
```

The review of a pull request checks its commit messages against this ADR. No commit hook and no CI step enforce the format.

## Considered Alternatives

### Free-form imperative messages, as before

Contributors need to learn no rules, and the history stays as it is. But a tool cannot find the package or the kind of change in a free-form message. A reader must open the diff.

### Conventional Commits enforced by commitlint

commitlint in a commit hook or in CI rejects a wrong message immediately. But it adds a dependency, a configuration file, and a hook to install. The review of a pull request already reads its commit messages before merge. commitlint can come later if the review misses too many messages.

## Consequences

- `git log` shows the kind of change and the package in the first line, but contributors must learn the types and the scope rule
- A reviewer can check that each `feat` and `fix` of a published package has a changeset, but no tool checks it on each commit
- The scope is the directory name, so a new adapter needs no new rule. But a commit that changes several packages for different reasons must split into several commits.
- A family scope such as `playground` keeps the first line short, but the reader must know which directories the family holds
- The earlier commits of the repository do not follow the format. Only commits from this ADR forward follow it.
