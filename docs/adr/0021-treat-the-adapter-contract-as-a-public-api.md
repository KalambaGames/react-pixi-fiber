# 0021. Treat the Adapter Contract as a Public API

**Status:** accepted
**Date:** 2026-10-28

## Context

The core connects to one React adapter and one PixiJS adapter through `configure` (see [0010](0010-split-the-library-into-a-core-and-adapters.md)). The core exports the types that describe this connection. `configure` checks the shape of each adapter object, not the package that made it. So any object of the correct shape works as an adapter.

The adapter contract has two parts:

- **The runtime objects.** A PixiJS adapter gives the core a `PixiAdapter` with a `Behavior` for each tag. A React adapter gives the core a `ReactAdapter` and the `Renderer` that it makes. The core gives a React adapter the `HostOps`, and gives each `Behavior.applyProps` an `ApplyPropsContext`.
- **The type augmentation.** A PixiJS adapter fills the `PixiTypes`, `PixiInstances`, and `PixiExtraProps` interfaces of the core. These interfaces give the props and instances their PixiJS types.

ADR 0012 lets a parent behavior take over the child operations of its children with the keys `appendChild`, `insertBefore`, and `removeChild`. It calls these keys unstable. The particle container of PixiJS 8 uses them in its adapter.

Our own adapters are separate packages. Each adapter declares the core as a peer dependency with a caret range (see [0013](0013-let-adapters-depend-only-on-core-types.md)). ADR 0010 and ADR 0013 state as a consequence that a breaking contract change needs a new core major. No decision names the contract or says which changes are breaking. Also, no document tells a user how to write an adapter.

During the 3.0 prereleases, the contract changed often, with breaking changes. 3.0.0 is the first release that promises a stable contract.

## Decision Drivers

- A user must be able to write an adapter for a React or PixiJS version that the library does not support
- Our own adapters must keep working with each core minor release inside their peer range
- A contributor must be able to tell from one rule if a contract change is breaking
- One mechanism must tell a user that an adapter and a core do not match

## Decision

The adapter contract is a public API of the core. It follows semver from 3.0.0. The contract is these exports of the core:

- `PixiAdapter` and `PixiPropertyTable`
- `Behavior` and `ApplyPropsContext`. This includes the child operation keys `appendChild`, `insertBefore`, and `removeChild`, which are no longer unstable. The function form and the 2.x keys that `PIXIComponent` accepts are not part of the contract.
- `ReactAdapter`, `Renderer`, `HostOps`, and `PixiFragmentInstance`
- `PixiInstances`, `PixiExtraProps`, and the keys of `PixiTypes` that the core reads
- The list of core tags in `tags.ts`. A PixiJS adapter supplies a `Behavior` for each core tag, so a new core tag is a new required member.

Who implements a function, or who constructs a data object, sets which changes are breaking:

1. **A function that the adapter implements, or a data object that the adapter constructs.** Examples are the members of `PixiAdapter` and `Behavior`, and the augmentation keys. A minor release can add an optional member or an optional augmentation key. The core must then work when an adapter does not supply that member or key. The props and instance types that a user sees must stay the same when an adapter does not supply the key.
2. **A function that the core implements, or a data object that the core constructs.** Examples are the members of `HostOps` and `ApplyPropsContext`. A minor release can add a member. The core must then work when an adapter never calls that member.
3. **A type change.** On a function that the adapter implements, a parameter type can only get narrower, and a return type only wider. The reverse holds on a function that the core implements. Each other type change is breaking.
4. **A behavior change.** A change to when the core calls a member is breaking. A change to a call order that the JSDoc states, or to what a value means, is also breaking. This holds when no type changes.
5. **Each other change is breaking.** Examples are a removed member, a renamed member, and a new required member in the first group.

| Change | Release |
| --- | --- |
| Add the optional key `constructorOnly` to `Behavior` | minor |
| Add a member to `HostOps` | minor |
| Rename `PixiAdapter.components` to `behaviors` | major |
| Make `Renderer.unmount` return a `boolean` that the core reads | major |

A breaking change needs a new core major. Before that major, a minor can add the replacement of a renamed member. The old member stays until the major, with `@deprecated` JSDoc that names the replacement. When an adapter supplies a deprecated member, the core warns one time in development, like it does for a deprecated behavior key. The core cannot warn when an adapter calls a deprecated member of the core, because the core does not see the call. The compatibility suite of [0008](0008-keep-deprecated-apis-until-the-next-major.md) does not cover contract members.

An adapter that calls or supplies a member that a core minor added must raise the lower bound of its peer range to that minor. At 3.0.0, each adapter raises the lower bound of its peer range to `^3.0.0`. The peer range is the version check. `configure` does not check a contract version.

The core README gets a section that tells a user how to write an adapter. This section points to the list of contract exports above and to our own adapters as examples. Each type keeps its documentation in its JSDoc.

The contract stays in the core package. The adapters import only its types (see [0013](0013-let-adapters-depend-only-on-core-types.md)).

## Considered Alternatives

### Say that the contract is internal

The README would say that the contract can change in any release. This keeps each contract change free of a major. But the core exports the contract types, and our own adapters use a caret peer range on the core. For this statement to be true, each adapter must pin an exact core version. Each core release would then need a release of each adapter.

### Make the contract public after 3.0.0

The library would wait until 3.0.0 is in use, and then decide. This gives the contract time to settle under real use before the promise. But a core change that breaks the adapter types needs a new core major already (see [0013](0013-let-adapters-depend-only-on-core-types.md)). So the obligation starts at 3.0.0 in either case. The wait only keeps the rule out of the documentation.

### Make the contract public, with named unstable members

The contract would be public, but a member whose JSDoc says "unstable" could change in a minor. ADR 0012 does this for the child operation keys. A key that one adapter needs could then still change. But the contract would have two tiers, and the README must explain both. An adapter that uses an unstable member must also pin the core minor.

### Export the contract from a subpath

The core would export the contract types from a subpath such as `react-pixi-fiber/adapter`. The contract would be visible as one import, with no new package or version. But this adds one more entry to the build and to the declaration bundle. It does not change which changes are breaking.

### Put the contract in its own package

A separate package would hold only the contract types. Adapters would depend on it, not on the core. But adapters already import only types from the core. A separate package adds one more version that must match the core, and one more package that each release must update.

### Check a contract version in `configure`

Each adapter would declare the contract version that it implements. `configure` would throw when the version does not match. This would find a mismatch at run time. But the peer range finds the same mismatch at install time. A runtime check would add a second version number that each contract change must update.

## Consequences

- A user can write and publish an adapter, but each contract change after 3.0.0 must follow the rules of this decision.
- One rule tells if a contract change is breaking, but the rule puts most changes in the breaking group. Between majors, the contract grows only by optional members.
- A user can use the child operation keys in a custom component, but a change to these keys now needs a new core major.
- The peer range is the only version check, but a package manager can only warn about a mismatch, not stop it.
- An adapter can raise its floor to a prerelease such as `^3.1.0-alpha.2`. But with a stable floor, the peer range warns for a core prerelease of a later minor, even when the adapter works with it.
- The README shows how to write an adapter, but the README section must change when the contract changes.
