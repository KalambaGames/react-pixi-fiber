# 0003. Use Biome as the Only Linter and Formatter

**Status:** accepted
**Date:** 2026-09-26

## Context

Version 2.x used ESLint 7 for linting and Prettier 2 for formatting. Each tool had its own configuration and its own plugins. CI never ran ESLint, so lint errors could reach the main branch. All packages, apps, and build scripts of the workspace (see [0001](0001-use-a-pnpm-workspace-monorepo.md)) must follow the same style rules.

## Decision Drivers

- One configuration for the whole workspace, with no configuration in each package
- CI must check lint and format on every change
- The change of tool must not change the code style of 2.x, so the history stays readable

## Decision

Biome formats and lints the whole workspace. One `biome.json` at the repository root is the only configuration. Biome reads `.gitignore` to skip ignored files.

The formatter keeps the Prettier options of 2.x:

- 2-space indent and a line width of 120
- double quotes
- `es5` trailing commas
- no parentheses around a single arrow function parameter

The linter starts from no preset (`"preset": "none"`). It enables only the rules that match the ESLint setup of 2.x: the React rules and the two React hooks rules. `useExhaustiveDependencies` stays a warning. A `biome-ignore` comment with a reason suppresses a rule at one location.

Biome sorts the imports and exports of each file with the `organizeImports` action. No other assist action is on. Empty lines divide the imports into four groups, in this order:

1. Node.js modules
2. external packages
3. the packages of this workspace
4. aliases and relative paths

Biome does not format Markdown and YAML files.

`pnpm lint` checks. `pnpm format` writes. CI runs `pnpm lint` on every change.

## Considered Alternatives

### ESLint and Prettier, as in 2.x

This combination has the largest plugin ecosystem and most editors support it. But it needs two tools, two configurations, and upgrades of both from versions that are several majors old. The two tools can also disagree about formatting.

### ESLint only, with stylistic rules

One tool is enough for both jobs with the stylistic plugin. But ESLint is not a formatter, and its stylistic rules do not cover all the Prettier options of 2.x.

## Consequences

- One tool and one file configure lint and format, but contributors who know ESLint must learn the Biome rule names
- The code style of 2.x stays the same, so `git blame` stays useful. The exceptions are two formatting-only commits: Biome replaced Prettier in one, and sorted the imports in the other. `.git-blame-ignore-revs` lists both, so `git blame` skips them.
- The linter enables few rules, so it rarely blocks a change, but it also finds few problems. Enabling the recommended rules of Biome is a separate, later change.
- Biome does not enforce project conventions such as alphabetical order of components and props. Code review checks them.
- Biome does not check types. `pnpm check-types` stays a separate step.
