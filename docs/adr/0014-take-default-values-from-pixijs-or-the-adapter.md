# 0014. Take Default Values from PixiJS or the Adapter

**Status:** accepted
**Date:** 2026-09-26

## Context

The library needs a default value for a prop in two cases. The first case is a prop that a consumer does not pass. The second case is a prop that the library must reset, for example when it arrives as `undefined`. A PixiJS Display Object has no "remove", so a reset must write a value. Version 2.x had a table of default values for each prop, written by hand for one PixiJS version. Default values differ between PixiJS majors, and consumer components have props that no table lists.

## Decision Drivers

- The default values must be correct for every PixiJS major, with no table to maintain for each major
- Consumer components must get the same behavior as built-in components
- A prop that the constructor consumes must still have a sensible default
- A prop that the consumer never passes and a prop that the consumer removes must get the same value

## Decision

Two sources supply default values: the `defaults` option of the PixiJS adapter (see [0012](0012-describe-each-pixijs-major-as-adapter-data.md)), and the values that PixiJS itself gives a new Display Object.

The `defaults` option works like React `defaultProps`, keyed by tag:

```js
pixi8({ defaults: { Text: { text: "" }, Sprite: { alpha: 0.5 } } });
```

At construction, the core fills each prop that is missing or `undefined` from the `defaults` entry of the tag, before `create` runs. `create` and the first prop write receive the filled props. An explicit `null` stays `null`.

Before the first write of a prop on an instance, the core records the current value of that prop on that instance. A `WeakMap` for each instance holds the recorded values. The core copies a point value as `{ x, y }`. The recorded value is the value just before the first write by the core. Usually this is the PixiJS default. A value that `create` or the constructor options set wins over the class default, because it was the value at that time.

When a prop arrives as `undefined` or with an invalid value after construction, the core writes a default instead:

1. the `defaults` entry of the adapter for that tag and prop, when one exists
2. otherwise the recorded value, also when the recorded value is itself `undefined`
3. otherwise nothing: the core ignores a prop that it never recorded and that the instance does not have

So a tag with a `defaults` entry gets the same value when the consumer never passes the prop and when the consumer removes it. A prop that the constructor consumes (`text`, `texture`, `style`) records the initial prop value. The `defaults` option gives these props a real default.

In development inside `<StrictMode>`, an invalid value prints a warning that names the value.

## Considered Alternatives

### A table of default values in the core, as in 2.x

A table is explicit and easy to read. But each PixiJS major needs its own table, the tables must follow every PixiJS release, and consumer components get no defaults.

### A table of default values in each PixiJS adapter

Each adapter would ship the table for its PixiJS major. The core would stay free of PixiJS, and the table would be explicit. But every PixiJS release would still need a table update, and consumer components would still get no entry. The table would also repeat what the instance already knows. The `defaults` option keeps the part of this idea that a consumer needs, without a table in the adapter.

### Apply the `defaults` option only on reset

The core would use a `defaults` entry only when a prop arrives as `undefined` or with an invalid value, not at construction. This writes fewer props at construction. But a prop that the consumer never passes would then get the PixiJS value, and the same prop after a removal would get the `defaults` value. The same JSX would give two results.

## Consequences

- A prop gets its real default on every PixiJS major, and consumer components get the same behavior. But the core keeps one small map for each instance that it wrote to.
- A tag with a `defaults` entry gets the same value at construction and after a reset. But each instance of that tag costs one object copy at construction.
- The recorded value is the value at the first write, so a value that other code set before that write becomes the default
- A tag without a `defaults` entry keeps the PixiJS value for a prop that the consumer never passes. A reset of a constructor-consumed prop without a `defaults` entry restores the initial prop value.
