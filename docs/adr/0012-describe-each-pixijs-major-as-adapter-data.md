# 0012. Describe Each PixiJS Major as Adapter Data

**Status:** accepted
**Date:** 2026-09-26

## Context

Between PixiJS majors, most differences are in class names, constructor signatures, property names, and the application setup. The tree operations that the library uses (`addChild`, `addChildAt`, `removeChild`, `getChildIndex`, `children`, `destroy`, `visible`) stay the same in every supported major. In 2.x, the built-in components were a hard-coded constructor switch in the core, and the component API for consumers (`CustomPIXIComponent`) was a separate code path. The core does not import `pixi.js` (see [0010](0010-split-the-library-into-a-core-and-adapters.md)).

## Decision Drivers

- The core must run the same code for every PixiJS major
- An adapter must contain only what differs in its PixiJS major, so a new adapter is small
- Built-in components and consumer components must use one code path, so a fix applies to both
- Built-in components must accept the same props on every PixiJS major, so shared code runs unchanged
- Consumers must get the PixiJS types of their PixiJS major, without a type dependency of the core on PixiJS

## Decision

A PixiJS adapter is a factory that returns data and a few small functions:

- **behaviors:** a behavior for each tag, in the same shape that `PIXIComponent` takes. A behavior has `create(props)` and optional `applyProps`, `afterAdd`, and `beforeRemove`. `create` absorbs the constructor differences, so each built-in tag takes the same props on every PixiJS major.
- **properties:** tables that list the boolean, numeric, positive numeric, vector, and callback props of the PixiJS major
- **point helpers:** `isPoint` and `copyPoint`
- **application functions:** `createApplication`, `destroyApplication`, and `isApplication`. `createApplication` can return a promise, for a PixiJS major with an asynchronous `init`.
- **options:** `defaults` to override the default value of a prop (see [0014](0014-take-default-values-from-pixijs-or-the-adapter.md)), and `compat` (see [0016](0016-ship-pixijs-compat-as-opt-in-subpaths.md))

Every adapter implements the core tags. An adapter can add tags for classes that only its PixiJS major has, and exports a tag constant for each.

`configure` registers the adapter behaviors in the same registry that `PIXIComponent` writes to. On each instance creation, the core resolves a tag in this order:

1. a component that the consumer registered with `PIXIComponent`
2. the adapter component
3. the deprecated tag map of the core (see [0008](0008-keep-deprecated-apis-until-the-next-major.md))

The core runs the tree operations on the Display Object. A parent behavior can take over the child operations of its children with the optional keys `appendChild`, `insertBefore`, and `removeChild`. The core then calls these keys instead of the Display Object methods, in the same order with `afterAdd` and `beforeRemove`. These keys are part of the adapter contract (see [0021](0021-treat-the-adapter-contract-as-a-public-api.md)). The core records which parent holds each child through these keys, so a reorder inside that parent is a move, not a new add.

For types, the core declares interfaces that an adapter augments with `declare module "react-pixi-fiber"`. The interfaces hold the instance class for each tag, the PixiJS application, point, and event types, and extra props. With no adapter installed, the props fall back to loose records and still compile.

The `pixi.js` peer range of an adapter starts at the first release of its PixiJS major that has every class that the adapter uses.

## Considered Alternatives

### An adapter that implements the host operations

Each adapter would implement instance creation, the tree operations, and the prop updates for its PixiJS major. This gives an adapter full control. But the tree operations are the same in every supported major. Each adapter would copy them, and a fix to one would need a copy in every adapter.

### A separate component package for each PixiJS major, with no adapter

Consumers would import `Sprite` from a package for their PixiJS major, and the core would contain no built-in tags. But shared code would then import from a PixiJS-specific package. The prop tables and the application setup would still need a place.

### Keep the built-in components in the core, with version checks

The core would check the PixiJS version and select the constructor. But the core would then import `pixi.js`, and the code for all majors would ship to every application.

## Consequences

- An adapter is mostly tables and short `create` functions, but the core and every adapter depend on one behavior shape. A change to that shape changes every adapter.
- Built-in and consumer components use one registry and one code path, but a consumer registration can replace a built-in tag. The core warns once in development when this happens.
- Some PixiJS containers keep their children outside `children`, for example the particle container of PixiJS 8. Such a container needs parent-controlled child operations. These operations add three keys to the behavior shape that the core and every adapter depend on.
- Types come from the installed adapter, but a shared library needs one adapter as a devDependency to type-check against real PixiJS classes
- An adapter can export a class that came in a later minor of its PixiJS major. Its peer range then starts at that minor, not at the first release of the major.
