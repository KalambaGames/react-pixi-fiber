# 0015. Restore the Default When a Prop Is Removed

**Status:** accepted
**Date:** 2026-09-26

## Context

A consumer can remove a prop between two renders: `<Sprite alpha={0.5} />` becomes `<Sprite />`. React DOM removes the attribute. Version 2.x followed react-dom and sent `null` for a removed prop. But `null` is not a valid value for most PixiJS props, so `<Sprite />` after `<Sprite alpha={0.5} />` set `alpha` to `null`, and the sprite disappeared. The core already knows how to find the default value of a prop (see [0014](0014-take-default-values-from-pixijs-or-the-adapter.md)).

## Decision Drivers

- A removed prop must leave the Display Object as if the prop was never set
- An explicit `null` from the consumer must stay a real value

## Decision

The core commits a removed prop as `undefined`. The default resolution of [0014](0014-take-default-values-from-pixijs-or-the-adapter.md) then applies.

The core writes an explicit `null` as `null`.

A removed prop prints no warning, because the diff cannot tell a removed prop from `prop={undefined}`. React DOM does not warn about `undefined` either.

## Considered Alternatives

### Write `null` for a removed prop, as react-dom does

This keeps the behavior of 2.x and of react-dom. But `null` is not a valid value for most PixiJS props. `alpha = null` hides the object, and the consumer did not ask for that.

### A removal marker that keeps a warning for an explicit `undefined`

The diff would mark removed props, so the core could warn about `prop={undefined}` only. But this adds code to every diff for a warning that react-dom does not print.

## Consequences

- Code that relied on a removal writing `null` now sees the default. The changelog of the major lists this change.
- A `prop={undefined}` that a consumer writes by mistake prints no warning in development
