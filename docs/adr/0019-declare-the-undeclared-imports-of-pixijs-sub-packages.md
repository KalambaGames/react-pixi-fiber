# 0019. Declare the Undeclared Imports of PixiJS Sub-Packages

**Status:** accepted
**Date:** 2026-10-25

## Context

The workspace holds several PixiJS majors at the same time. Each adapter and each playground pins its own PixiJS version. pnpm puts each version in its own folder under `node_modules/.pnpm`, and a package sees only the dependencies that it declares (see [0001](0001-use-a-pnpm-workspace-monorepo.md)).

PixiJS 6 and 7 ship as sub-packages under the `@pixi` scope. The typings of a sub-package import sibling sub-packages. The sub-package declares some of these siblings as peer dependencies, but not all of them. For example, the typings of `@pixi/display` import `@pixi/core`, but `@pixi/display` does not declare `@pixi/core`.

When a package imports a module that it does not declare, module resolution walks up the folders. In a pnpm workspace the walk ends in `node_modules/.pnpm/node_modules`, the hoist folder. pnpm fills this folder with one copy for each dependency name. The copy comes from the first workspace project, in lockfile order, that depends on the name directly. So the typings of `@pixi/display` from PixiJS 6 can resolve `@pixi/core` to the copy from PixiJS 5. The PixiJS 5 sub-packages ship no typings. The import then gives the error type, which TypeScript treats like `any`.

An `any` in a PixiJS base class spreads. The TypeScript fixture of the core package stopped reporting a wrong prop type. The playground for PixiJS 7 lost the type of every prop, because a conditional type over the keys of `Container` collapsed to `any`. The failure started when the playground for PixiJS 5 added direct dependencies on PixiJS 5 sub-packages for a plugin. Before that, the playground for PixiJS 6 won the same names by accident. The content of the hoist folder also depends on the install history. An incremental install can keep the old layout, and a fresh install gets the new one. So the type check passed on a developer machine and failed in CI.

## Decision Drivers

- The type check must give the same result after a fresh install and after an incremental install
- The typings of each PixiJS major must resolve its sub-packages to the same major
- A new PixiJS version in the test matrix must not need a new pinned version in the workspace file
- Some PixiJS plugins import PixiJS modules without declaring them and resolve them through the hoist folder at run time, and this must keep working
- The fix must live in one place that every workspace project shares

## Decision

`pnpm-workspace.yaml` declares the missing imports with `packageExtensions`. Each entry names a PixiJS sub-package with its major, and adds the siblings that its typings import as peer dependencies of the same major:

```yaml
packageExtensions:
  "@pixi/display@6":
    peerDependencies:
      "@pixi/core": ^6
```

pnpm then links the sibling into the folder of the sub-package, and the import resolves there before the walk reaches the hoist folder. The parent `pixi.js` package supplies the peer, so the version follows the parent and the entry pins no version.

The entries are peer dependencies, not dependencies, because the PixiJS sub-packages declare the siblings that they do declare the same way. A third-party plugin that imports a PixiJS sub-package without declaring it gets an entry of the same shape.

Rules for the entries:

- An entry declares only an import that exists in the shipped typings or code. A name that appears only in a comment gets no entry, because the peer would pull a version that nothing uses.
- A comment above each group names the package that has the undeclared imports.
- When a type check fails after a dependency change, and the error comes from a PixiJS typing, look for an undeclared import first.

## Considered Alternatives

### Exclude the PixiJS sub-packages from hoisting

A `hoistPattern` with `!@pixi/*` keeps the sub-packages out of the hoist folder. pnpm hoists no copy, so no import finds a wrong one. But an undeclared import then resolves to nothing, and TypeScript gives the same error type. The hoist folder also serves the undeclared imports of PixiJS plugins at run time. Without it, those plugins stop loading.

### Keep the hoist folder in the right order

The playground for PixiJS 5 could drop the direct dependencies that moved the hoist. Or a project that sorts first could declare the PixiJS 6 sub-packages. The lockfile would stay as it was. But without the direct dependencies, pnpm resolved the peers of the plugin to a newer PixiJS, and the playground for PixiJS 5 stopped building. And a later dependency change could move the hoist again. This alternative only restores the accident.

### Point TypeScript at the right copy

A `paths` entry in each `tsconfig.json`, or dev dependencies in the core package, could name the right copy. The install would not change. But TypeScript resolves an import from the real path of the typing, under `node_modules/.pnpm`, and walks up from there. It never looks into the folder of the project that runs the type check. A `paths` entry would need the full versioned path, repeated in every project that type checks against PixiJS 6 or 7.

### Give each project its own lockfile

With `sharedWorkspaceLockfile: false`, each workspace project gets its own lockfile and its own hoist folder. Each project holds one PixiJS major, so each hoist folder holds one major, and every undeclared import finds the right copy. No entry in the workspace file is necessary, not even for the plugins. But each dependency change then touches one lockfile per project, and the install does more work. And the cause stays. The first project that holds two PixiJS majors gets the same failure, with nothing in the repository that explains it.

## Consequences

- The type check no longer depends on the hoist folder for PixiJS 6 and 7. But each new undeclared import in a PixiJS release needs a new entry. A failing type check after an upgrade shows where.
- The versions follow the parent `pixi.js`, but each entry names a major. A new PixiJS major with the same problem needs its own entries.
- The lockfile keys of the extended packages gain peer suffixes, but the resolved versions do not change.
- The workspace file holds a list to maintain, but the list sits in one file, next to the entries for plugins.
- PixiJS plugins without an entry still resolve their undeclared imports through the hoist folder at run time, but nothing checks which copy they get. A plugin that stops working after a dependency change points to the same cause, and the fix is an entry of the same shape.
