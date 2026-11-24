# 0022. Describe Each PixiJS 3D Major as Its Own Adapter

**Status:** accepted
**Date:** 2026-11-24

## Context

A PixiJS 3D (`@pixi/3d`) scene has two kinds of object. The view is a Display Object. It is a child of a Display Object and has Display Objects as siblings, and one stage can hold more than one view. The nodes of the scene, such as meshes, lights, and cameras, are not Display Objects. They form a second tree under the root node of the view. A Display Object cannot be a child of a 3D node, and a 3D node cannot be a child of a Display Object. The view takes no children itself: its `addChild` throws. So one React tree holds both Display Objects and 3D nodes.

A 3D node has the tree operations that the core uses (see [0012](0012-describe-each-pixijs-major-as-adapter-data.md)), with the same meaning. But a 3D node uses prop names that a Display Object also uses, with other types. `rotation` and `angle` are numbers on a Display Object and vectors on a 3D node. `position` and `scale` have three coordinates.

The core applies each prop with the property table and the point helpers of the one PixiJS adapter. On a 3D node, these give wrong results:

- The core resets a vector `rotation` as an invalid number.
- The core writes an array of three coordinates to a vector with no check, and the vector becomes `NaN`.
- The core records the live vector as the default value of a prop, not a copy. The restore of [0015](0015-restore-the-default-when-a-prop-is-removed.md) then does nothing.

A new PixiJS 3D major can change the classes, their constructor options, and their props, as a new PixiJS major does (see [0012](0012-describe-each-pixijs-major-as-adapter-data.md)). An app that uses PixiJS 3D chooses a PixiJS 3D major, as it chooses its React major and its PixiJS major (see [0010](0010-split-the-library-into-a-core-and-adapters.md)).

## Decision Drivers

- An app must be able to change its PixiJS 3D major without a change of its React adapter or its PixiJS adapter
- The core must not import `@pixi/3d`, and must contain no code that knows a 3D class or a third coordinate
- An app without 3D must install nothing new and must change no setup
- A 3D node must get what the core gives a Display Object: default values, their restore, the development warnings, and the constructor-only props
- A component that an app registers for a 3D class must behave like a 3D tag of the adapter
- The change must not break an existing adapter (see [0021](0021-treat-the-adapter-contract-as-a-public-api.md))

## Decision

PixiJS 3D gets its own kind of adapter, the 3D adapter. An app passes it to `configure` next to the React adapter and the PixiJS adapter:

```js
configure({ react: react19(), pixi: pixi8(), pixi3d: pixi3d0() });
```

`pixi3d` is optional. Without it, the core applies no 3D rule, and `Props` builds every prop from the PixiJS adapter.

A 3D adapter is a factory that returns data and a few small functions, like a PixiJS adapter (see [0012](0012-describe-each-pixijs-major-as-adapter-data.md)). The core exports its type as `Pixi3dAdapter`.

- **behaviors:** a behavior for each 3D tag, in the same shape that `PIXIComponent` takes
- **properties:** tables that list the boolean, numeric, positive numeric, vector, and callback props of a 3D node
- **node test:** `isNode`, which is true for a 3D node
- **point functions:** `isPoint`, `clonePoint`, and `setPoint`. A 3D node has vectors with three coordinates and quaternions with four, and the 3D adapter parses each prop value itself.
- **options:** `defaults` to override the default value of a prop (see [0014](0014-take-default-values-from-pixijs-or-the-adapter.md))

A 3D adapter has no application functions, and it implements none of the core tags.

**The core chooses the adapter for each instance.** When `isNode(instance)` is true, the core takes the property table and the point functions from the 3D adapter. For every other instance, it takes them from the PixiJS adapter. The view is not a 3D node, so its props use the PixiJS adapter. An instance of a 3D class that an app registers with `PIXIComponent` is a 3D node, so its props use the 3D adapter.

**The core checks the tree.** It throws when exactly one of parent and child is a 3D node (see [0009](0009-throw-for-impossible-operations-and-warn-for-mistakes.md)). A parent that has its own child operations is an exception: it decides for itself (see [0012](0012-describe-each-pixijs-major-as-adapter-data.md)). The view is such a parent. Its behavior puts each child into the root node of the view.

**The 3D tags use the registry of the core.** `configure` registers the behaviors of both adapters in this one registry. The core resolves a 3D tag as it resolves a tag of the PixiJS adapter (see [0012](0012-describe-each-pixijs-major-as-adapter-data.md)). `configure` throws when both adapters define the same tag.

**The 3D tags come from the 3D adapter.** The core exports no 3D tag, also not from a subpath. A 3D adapter exports a tag constant for each tag, as a PixiJS adapter does for the tags that only its major has.

**The `Props` type of the core chooses the types for each instance type.** A 3D adapter augments the type interfaces of the core (see [0012](0012-describe-each-pixijs-major-as-adapter-data.md)). Its declarations hold the instance class of each 3D tag and the type of a 3D node. They also hold the point and setter types of the 3D classes. `Props` builds the props of a 3D node from these declarations. For every other instance type, also for the view, it builds them from the declarations of the PixiJS adapter.

**Each supported PixiJS 3D major has one adapter package,** `@react-pixi-fiber/pixi3d-<major>`. When a new PixiJS 3D minor breaks the adapter, the adapter releases a new major and raises its `@pixi/3d` floor. That major gets patch releases only when necessary. A React adapter follows the same rule (see [0011](0011-use-one-react-adapter-for-each-react-major.md)).

**A 3D adapter has three peers:** `@pixi/3d`, `pixi.js`, and the core. It imports only types from the core (see [0013](0013-let-adapters-depend-only-on-core-types.md)). The `@pixi/3d` range starts at the first release of its PixiJS 3D major that has every class that the adapter uses (see [0012](0012-describe-each-pixijs-major-as-adapter-data.md)). The `pixi.js` range is the range that this `@pixi/3d` release needs. A 3D adapter has no peer on a PixiJS adapter, a React adapter, or `react`. A 3D adapter for a PixiJS 3D major that has no CommonJS build is an ES module only.

## Considered Alternatives

### Register the 3D classes with `PIXIComponent` in an add-on package

A package would register each 3D class as a custom component. The core would not change, and the package could ship at once. But the core would apply the props of a 3D node with the PixiJS tables. Each 3D component would then need its own `applyProps`, with its own default values, restore, and warnings. That is a second prop pipeline.

### Put the 3D tags into the PixiJS adapter

The adapter for the PixiJS major that PixiJS 3D needs would also implement the 3D tags. An app would pass only two adapters to `configure`. But this adapter would then follow two upstream packages with separate versions. A breaking PixiJS 3D release would need a new major of the PixiJS adapter, also for the apps without 3D. The name clash of the props would stay, because one adapter has one property table.

### Export stable 3D tags from the core

The core would export the 3D tag names, and each 3D adapter would implement them. The import path of a 3D tag would not change when the app changes its adapter. A shared library could import a 3D tag without a choice of the PixiJS 3D major. But the tag names would be part of the public API of the core. An upstream rename would need a deprecation in the core. It would also break the rule that a core tag is a tag of every PixiJS adapter.

## Consequences

- An app chooses its PixiJS 3D major with one more adapter, but `configure` takes a third key.
- A 3D node gets the default values, the restore, and the warnings of the core. But when an app configures a 3D adapter, each prop write tests which adapter owns the instance.
- The core holds no 3D knowledge, but the adapter contract grows by one interface and by optional type keys. A wrong shape of this interface needs a new core major (see [0021](0021-treat-the-adapter-contract-as-a-public-api.md)).
- The 3D adapter is mostly tables and short functions, but it must implement every coordinate rule itself. A second 3D adapter copies these rules (see [0013](0013-let-adapters-depend-only-on-core-types.md)).
- A component that an app registers for a 3D class gets the 3D tables. But it does not get what the behaviors of the 3D adapter add to their own tags.
- An app installs one 3D adapter for its PixiJS 3D major, but the peer range of the adapter can be narrower than that major. An app on an older PixiJS 3D minor must upgrade PixiJS 3D or use an older adapter major, when one exists.
- The 3D tags stay out of the core, but each import of a 3D tag names the adapter of one PixiJS 3D major. So an app or a shared library changes its import paths with the next major.
- A 3D adapter has no `react` peer, but an app writes its own hook to load a model.
- An app cannot `require` a 3D adapter that is an ES module only. The package check must accept a package without a CommonJS entry (see [0005](0005-check-each-package-as-a-consumer-installs-it.md)).
