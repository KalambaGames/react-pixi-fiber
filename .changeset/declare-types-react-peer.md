---
"react-pixi-fiber": patch
---

The core declares `@types/react` as an optional peer dependency, with the same range as `react`. With pnpm, the typings of the core now use the `@types/react` of the app. Before, they used the copy that pnpm hoists, which can be for a different React major. For example, an app on React 19 in a workspace that also has React 18 got a type error for `children`. The error was `Type 'bigint' is not assignable to type 'ReactNode'`. A project without `@types/react` needs no change.
