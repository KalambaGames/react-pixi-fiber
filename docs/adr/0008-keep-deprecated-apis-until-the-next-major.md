# 0008. Keep Deprecated APIs Until the Next Major

**Status:** accepted
**Date:** 2026-09-26

## Context

A major release of react-pixi-fiber renames or replaces parts of its public API: tags, functions, behavior keys, props, and types. Consumers include applications and shared libraries that register their own components. A shared library cannot rename everything on the same day as each application that uses it. If a major release removes the old names immediately, consumers must rename every use before they can install the new major.

This ADR covers the API of react-pixi-fiber itself. The props of an older PixiJS version are a different concern (see [0016](0016-ship-pixijs-compat-as-opt-in-subpaths.md)).

## Decision Drivers

- A consumer must be able to install a new major first and rename later, one use at a time
- A consumer must learn about each deprecated use, and its replacement, without reading the changelog
- Deprecated names must behave the same as their replacements everywhere, not only in the main code path
- Deprecated code must have a fixed end of life, so it does not stay forever

## Decision

When a major release renames or replaces a public API, the old API stays for that major as a deprecated alias. The next major removes it.

A deprecated API:

- calls, or maps to, its replacement. It has no separate implementation. The exception is an API whose replacement behaves differently. That API keeps its own implementation until the next major. An example is the `width` and `height` props of `Stage`: they size `app.stage`, but the `options` prop sizes the renderer.
- prints one development warning for each deprecated name, the first time a consumer uses it. The warning names the replacement and the major that removes the old name.
- has `@deprecated` JSDoc that names the replacement, so editors show it as deprecated.
- resolves by the same rule in every place that looks it up. For example, a deprecated tag resolves to the same tag for instance creation, for defaults, and for prop validation.
- loses to a current registration with the same name, when it is a tag. A component that a consumer or an adapter registers under a deprecated tag name wins over the deprecated mapping.

The kinds of deprecated aliases:

- **renamed functions**, with the old argument order kept where it changed
- **renamed tags**, which map to the new tag
- **renamed behavior keys**, which map to the new keys at registration
- **renamed types**, as type aliases with `@deprecated` JSDoc and no runtime code
- **renamed props**, which map to the new prop

A major release can remove an API without a deprecated alias only when no alias can work. An example is an API that a new React major no longer supports. The migration guide of that major lists each such removal with its replacement.

A compatibility suite in the core runs the usage of the previous major against the current core (for 3.x, `test/compat2x.test.jsx`). A new deprecated alias adds a case to this suite. The next major removes the suite together with the aliases.

## Considered Alternatives

### Remove the old API in the same major

This gives the smallest code and the shortest migration guide. But each consumer must change every use before it can install the new major, and a shared library blocks every application that uses it.

### Keep deprecated aliases with no end of life

Consumers never have to rename. But the aliases stay in the code and in the types forever. Each new feature must also work through each alias, and the tests must cover both names.

### Codemods instead of aliases

A codemod renames every use in one command. But it covers only code that the consumer owns, not the code of a dependency, and it must parse every syntax that consumers use. Aliases work for all code without a tool.

## Consequences

- Consumers can install a new major and rename later, but the code carries the aliases and their tests for one major. The production build also contains the aliases.
- Each deprecated use prints one warning in development, but only in development. A consumer that never runs a development build never sees the warning.
- The compatibility suite proves that the old usage works, but it must grow with each new alias
- A current registration wins over a deprecated tag mapping, so a consumer keeps control of its own names. But a consumer that registered a name that later becomes deprecated gets its own component, not the new built-in one.
