# 0007. Version Each Package Independently with Changesets

**Status:** accepted
**Date:** 2026-09-26

## Context

Version 2.x had one package. A maintainer wrote each changelog entry by hand under an `[Unreleased]` header and set the version by hand. Version 3.0.0 publishes a core package and adapter packages (see [0001](0001-use-a-pnpm-workspace-monorepo.md)). Most changes touch one package: a bug fix in one PixiJS adapter does not change the core or the other adapters. The adapters declare the core as a peer dependency with a caret range, because their declarations import types from the core.

## Decision Drivers

- A change to one package must not force a release of the packages that did not change
- The version number of a package must describe the changes in that package only
- Each package needs its own changelog, written from the changes at release time
- The contributor who makes a change must record its release impact, not the maintainer at release time
- A release of the core inside the peer range of the adapters must not release the adapters

## Decision

Changesets versions and publishes every package independently. Each package has its own version and its own `CHANGELOG.md` in its directory.

Every user-visible change adds a changeset file with `pnpm changeset`. The file names the changed packages and the bump type (`major`, `minor`, or `patch`) for each, and describes the change. No one edits a `CHANGELOG.md` by hand.

The release flow:

1. `pnpm version-packages` (`changeset version`) turns the pending changesets into version bumps and changelog entries.
2. A maintainer commits the result.
3. `pnpm release` builds every package, runs the package check (see [0005](0005-check-each-package-as-a-consumer-installs-it.md)), and runs `changeset publish`.

`.changeset/config.json` sets:

- `@changesets/changelog-github` to write the entries, with links to the pull requests
- `ignore` for the playground apps, because they are not published
- `updateInternalDependencies: "patch"`
- `onlyUpdatePeerDependentsWhenOutOfRange: true`, so a core release that stays inside the peer range of the adapters does not bump the adapters

A new adapter starts with a `major` changeset, so its first release is `1.0.0`. Changelog version headers stay unbracketed (`## x.y.z`), because Changesets inserts a new release above the first header that starts with a version number.

## Considered Alternatives

### One version for all packages (lockstep)

Changesets supports this with `fixed`. Every release would bump every package to the same version, and consumers would match versions by eye. But a bug fix in one adapter would release every package, with changelogs that list no change. The version number of a package would stop describing that package.

### Hand-written changelogs and versions, as in 2.x

This needs no tool. But with several packages, the maintainer must find which packages each change touched and must update each changelog by hand. The contributor knows the release impact of a change best, and a changeset records it with the change.

### Versions from commit messages (semantic-release)

semantic-release reads the Conventional Commits of the repository (see [0006](0006-use-conventional-commits.md)) and needs no extra file. But a commit type gives one release type for each commit. It does not name the packages that a change affects or the bump for each package. semantic-release also has no built-in support for independent versions in a monorepo. Changesets records the packages and the bumps, and Conventional Commits stay the format of the commit messages.

## Consequences

- Each package releases only when it changes, but consumers must combine package versions that are compatible. The peer ranges and the compatibility matrix in the README carry this information.
- Contributors record the release impact with each change, but a change without a changeset does not appear in any changelog
- A core minor release does not bump the adapters, but `onlyUpdatePeerDependentsWhenOutOfRange` is an experimental Changesets option. A Changesets update can change or remove it.
- Changesets controls where a release lands in each changelog. But a bracketed version header that a person writes moves the next release to the wrong place.
