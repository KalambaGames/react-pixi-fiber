# 0018. Let the App List the PixiJS 8 Classes It Renders

**Status:** accepted
**Date:** 2026-10-24

## Context

PixiJS 8 lets a bundler drop each class that the app does not import. Each class module imports its own render pipe and system. So when a bundler drops the class, it also drops the pipe and the system.

The pixi-8 adapter had one table that created every tag with `new PIXI.X(...)`. The adapter returned that table from every `pixi8()` call. So every PixiJS 8 display class stayed reachable, and no bundler could drop one. A production game that renders a few tags measured this. Its bundle held every other display class and its render pipes.

Older PixiJS majors do not let a bundler drop single classes. So this ADR applies to the pixi-8 adapter only.

## Decision Drivers

- `pixi8()` must keep every class, so that an app that needs every class changes nothing
- An app must be able to drop the classes it does not render
- The factory for a trimmed bundle must reference no PixiJS display class of its own
- An error must name the class to add and the option to add it to
- Importing a module must have no side effects (see [0010](0010-split-the-library-into-a-core-and-adapters.md))

## Decision

The package exports a second factory, `pixi8WithClasses`. It takes the options of `pixi8()`, plus a required `classes` option. `classes` holds the PixiJS classes that the app renders, keyed by the tag as written in JSX, plus `Application`:

```js
import { Application, Container, Sprite, Text } from "pixi.js";
import { pixi8WithClasses } from "@react-pixi-fiber/pixi-8";

configure({ react: react18(), pixi: pixi8WithClasses({ classes: { Application, Container, Sprite, Text } }) });
```

`pixi8()` calls `pixi8WithClasses` with `allClasses`, which holds every class. The package exports `allClasses` too. Only the module of `allClasses` imports `pixi.js` display classes at run time. The build emits it as a separate chunk. So when the app calls only `pixi8WithClasses`, a bundler drops `pixi8`, that chunk and every class in it.

The adapter follows these rules:

- **No `classes` on `pixi8`.** `pixi8()` throws when it gets `classes`, and the message names `pixi8WithClasses`.
- **Checks at configuration time.** `pixi8WithClasses` throws when `classes` is missing, when a key is not a known tag, and when a value is not a class. It also throws when the list has `ParticleContainer` but no `Particle`. A key with the value `undefined` counts as not listed.
- **Stubs for unlisted tags.** The adapter gives each tag that the app did not list a stub. The stub throws at first render, and the message names the class to add.
- **No `instanceof Application`.** `isApplication` accepts any object whose `stage` has an `addChild` method. Without `Application` in the list, `Stage` needs an `app`. The adapter throws when `Stage` must create an application without the class.
- **A gated bundle check.** A script bundles one entry for each way to configure the adapter. It fails when a module that only an unlisted class needs is in the bundle. It does not check sizes, because sizes change with each PixiJS release.

## Considered Alternatives

### A required `classes` option on `pixi8`

Every app would list its classes, or pass `allClasses`. The trimmed bundle would be the default. But most apps keep every class. So most apps would get one more setup step and no smaller bundle.

### A `classes` option on `pixi8` that falls back to `allClasses`

`pixi8()` would use `options.classes ?? allClasses`. But a bundler cannot tell which side of `??` runs, so it keeps both sides. Rolldown, esbuild, and rollup keep every class even when the app passes a list.

### A subpath for the trimmed factory

`@react-pixi-fiber/pixi-8/trimmed` would export the trimmed factory. But a named export of the main entry gives the same bundle, because a bundler drops an export that the app does not use. A subpath would add an entry to the `exports` map for no gain.

### Register the built-in tags through `PIXIComponent`

The app would register each built-in tag with `PIXIComponent`. But the app would then write the constructor logic of each tag. The adapter already holds that logic, for example the positional arguments of `Sprite` and the child operations of `ParticleContainer`.

## Consequences

- `pixi8()` bundles every class, as before. An app that wants a smaller bundle changes the factory name and adds a list.
- A bundle of the ES build holds only the classes that the app passes to `pixi8WithClasses`. The CommonJS build loads every class. But the JSX types cannot follow the list. A tag that the app left out typechecks and then throws at first render.
- The pixi-8 adapter has two factories. But the other adapters have one, because their PixiJS majors give no gain from a list.
- An app can list `Application` and let `Stage` create it. But `Application.init` calls `autoDetectRenderer`, so the bundle keeps all three renderers. Only an app that makes its own renderer and passes an `app` to `Stage` drops them.
- The adapter controls which display classes reach the bundle. But PixiJS loads its accessibility, event, and DOM modules on each renderer start, so every bundle holds them.
