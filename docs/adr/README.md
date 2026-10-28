# Architecture Decision Records

An Architecture Decision Record (ADR) records one important decision about the architecture of the library. It gives the context of the decision, the drivers, the alternatives, and the consequences. The ADRs explain why the library has its current structure. Read them before a change, so that the change agrees with the earlier decisions.

## When to Write an ADR

Write an ADR for a decision that:

- changes the structure of the codebase, or how the packages depend on each other
- adds or replaces a tool, a library, a framework, or a service
- sets a rule that all contributors must follow
- changes a pattern that more than one package uses
- is difficult to reverse without much work
- has important trade-offs, or needed a discussion before agreement
- a new contributor must know to understand the codebase
- replaces an earlier ADR

Write the ADR when you make the decision. For an earlier decision, write the ADR later, so that its reasons stay available.

## Template

Start each new ADR from [0000-template.md](0000-template.md). Give each ADR the next number in sequence (`0001`, `0002`, and so on). Use the number and the title in kebab case as the file name.

Write the title as an instruction that states the decision, for example "Use Conventional Commits". Write the text in short, plain sentences. Name the role of a package, for example "every PixiJS adapter". Do not list or count the packages, because a list or a count becomes wrong when the packages change.

## Status

- **proposed:** the decision is under discussion
- **accepted:** the decision applies
- **deprecated:** the decision no longer applies, and no ADR replaces it
- **superseded:** a newer ADR replaces the decision. The status links to the newer ADR.

## Index

| # | Title | Status | Date |
|---|-------|--------|------|
| 0001 | [Use a pnpm Workspace Monorepo](0001-use-a-pnpm-workspace-monorepo.md) | accepted | 2026-09-26 |
| 0002 | [Build Every Package with tsdown](0002-build-every-package-with-tsdown.md) | accepted | 2026-09-26 |
| 0003 | [Use Biome as the Only Linter and Formatter](0003-use-biome-as-the-only-linter-and-formatter.md) | accepted | 2026-09-26 |
| 0004 | [Test Each Package with Its Own React and PixiJS](0004-test-each-package-with-its-own-react-and-pixijs.md) | accepted | 2026-09-26 |
| 0005 | [Check Each Package as a Consumer Installs It](0005-check-each-package-as-a-consumer-installs-it.md) | accepted | 2026-09-26 |
| 0006 | [Use Conventional Commits](0006-use-conventional-commits.md) | accepted | 2026-09-26 |
| 0007 | [Version Each Package Independently with Changesets](0007-version-each-package-independently-with-changesets.md) | accepted | 2026-09-26 |
| 0008 | [Keep Deprecated APIs Until the Next Major](0008-keep-deprecated-apis-until-the-next-major.md) | accepted | 2026-09-26 |
| 0009 | [Throw for Impossible Operations and Warn for Mistakes](0009-throw-for-impossible-operations-and-warn-for-mistakes.md) | accepted | 2026-09-26 |
| 0010 | [Split the Library into a Core and Adapters](0010-split-the-library-into-a-core-and-adapters.md) | accepted | 2026-09-26 |
| 0011 | [Use One React Adapter for Each React Major](0011-use-one-react-adapter-for-each-react-major.md) | accepted | 2026-09-26 |
| 0012 | [Describe Each PixiJS Major as Adapter Data](0012-describe-each-pixijs-major-as-adapter-data.md) | accepted | 2026-09-26 |
| 0013 | [Let Adapters Depend Only on Core Types](0013-let-adapters-depend-only-on-core-types.md) | accepted | 2026-09-26 |
| 0014 | [Take Default Values from PixiJS or the Adapter](0014-take-default-values-from-pixijs-or-the-adapter.md) | accepted | 2026-09-26 |
| 0015 | [Restore the Default When a Prop Is Removed](0015-restore-the-default-when-a-prop-is-removed.md) | accepted | 2026-09-26 |
| 0016 | [Ship PixiJS Compat as Opt-In Subpaths](0016-ship-pixijs-compat-as-opt-in-subpaths.md) | accepted | 2026-09-29 |
| 0017 | [Keep a Shared Canvas Context When an Application Is Destroyed](0017-keep-a-shared-canvas-context-when-an-application-is-destroyed.md) | accepted | 2026-09-29 |
| 0018 | [Let the App List the PixiJS 8 Classes It Renders](0018-let-the-app-list-the-pixijs-8-classes-it-renders.md) | accepted | 2026-10-24 |
| 0019 | [Declare the Undeclared Imports of PixiJS Sub-Packages](0019-declare-the-undeclared-imports-of-pixijs-sub-packages.md) | accepted | 2026-10-25 |
| 0020 | [Let Filters Be Child Elements Whose Lifecycle the Core Owns](0020-let-filters-be-child-elements-whose-lifecycle-the-core-owns.md) | accepted | 2026-10-26 |
| 0021 | [Treat the Adapter Contract as a Public API](0021-treat-the-adapter-contract-as-a-public-api.md) | accepted | 2026-10-28 |
