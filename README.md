<div align="center">
  <img alt="ReactPixiFiber" src="./packages/react-pixi-fiber/react-pixi.svg" width="500" />
</div>

# react-pixi-fiber repository

This repository holds [`react-pixi-fiber`](./packages/react-pixi-fiber), a React Fiber renderer for [PixiJS](https://pixijs.com/), its React and PixiJS adapters, and the playgrounds. Package documentation lives in the [package README](./packages/react-pixi-fiber/README.md).

Try the playgrounds in your browser: [PixiJS 8](https://react-pixi-fiber.pages.dev/pixi-8/), [PixiJS 7](https://react-pixi-fiber.pages.dev/pixi-7/), [PixiJS 6](https://react-pixi-fiber.pages.dev/pixi-6/), [PixiJS 5](https://react-pixi-fiber.pages.dev/pixi-5/) and [PixiJS 4](https://react-pixi-fiber.pages.dev/pixi-4/).

## Layout

| Path | Package | Peer dependencies |
| --- | --- | --- |
| [`packages/pixi-4`](./packages/pixi-4) | `@react-pixi-fiber/pixi-4`, the PixiJS 4 adapter | `@types/pixi.js` ^4.8.9 (optional), `pixi.js` ^4.4.0, `react-pixi-fiber` ^3.0.0 |
| [`packages/pixi-5`](./packages/pixi-5) | `@react-pixi-fiber/pixi-5`, the PixiJS 5 adapter | `pixi.js` ^5.0.0, `react-pixi-fiber` ^3.0.0 |
| [`packages/pixi-6`](./packages/pixi-6) | `@react-pixi-fiber/pixi-6`, the PixiJS 6 adapter | `pixi.js` ^6.0.0, `react-pixi-fiber` ^3.0.0 |
| [`packages/pixi-7`](./packages/pixi-7) | `@react-pixi-fiber/pixi-7`, the PixiJS 7 adapter | `pixi.js` ^7.2.0, `react-pixi-fiber` ^3.0.0 |
| [`packages/pixi-8`](./packages/pixi-8) | `@react-pixi-fiber/pixi-8`, the PixiJS 8 adapter | `pixi.js` ^8.9.0, `react-pixi-fiber` ^3.0.0 |
| [`packages/react-17`](./packages/react-17) | `@react-pixi-fiber/react-17`, the React 17 adapter, bundles `react-reconciler` 0.26.2 | `react` ^17.0.2, `react-pixi-fiber` ^3.0.0 |
| [`packages/react-18`](./packages/react-18) | `@react-pixi-fiber/react-18`, the React 18 adapter, bundles `react-reconciler` 0.29.2 | `react` ^18.3.1, `react-pixi-fiber` ^3.0.0 |
| [`packages/react-19`](./packages/react-19) | `@react-pixi-fiber/react-19`, the React 19 adapter, bundles `react-reconciler` 0.34.0 | `react` ^19.3.0, `react-pixi-fiber` ^3.0.0 |
| [`packages/react-pixi-fiber`](./packages/react-pixi-fiber) | `react-pixi-fiber`, the core with the components, `Stage` and `configure` | `react` >=17.0.0 <20.0.0 |

[`apps/playground-pixi4`](./apps/playground-pixi4), [`apps/playground-pixi5`](./apps/playground-pixi5), [`apps/playground-pixi6`](./apps/playground-pixi6), [`apps/playground-pixi7`](./apps/playground-pixi7) and [`apps/playground-pixi8`](./apps/playground-pixi8) hold the playgrounds, built with Vite on the local packages. [`apps/playground-shell`](./apps/playground-shell) holds the code they share.

An app installs the core, one React adapter and one PixiJS adapter. Every PixiJS adapter implements all 13 core tags; the [compatibility matrix](./packages/react-pixi-fiber/README.md#compatibility-matrix) and the version notes (React 17, React 19, PixiJS 4 and PixiJS 8) are in the package README, and each adapter's README lists its supported features.

The repository is a [pnpm](https://pnpm.io) workspace. The pnpm version is pinned in the `packageManager` field of `package.json`, and Node comes from `.nvmrc`.

## Development

Run these in the repository root:

```sh
pnpm install           # install every workspace package
pnpm build             # build every package, the playgrounds load the built files
pnpm test              # run the tests of every package
pnpm lint              # check formatting and lint with Biome
pnpm format            # apply Biome formatting and safe fixes
pnpm check-types       # typecheck every package, the TypeScript fixture, the playgrounds and the scripts (after pnpm build)
pnpm check-package     # pack every package and check what Node and esbuild resolve (after pnpm build)
pnpm check-bundle      # bundle the entries of each package that has a bundle check and check which modules each bundle holds (after pnpm build)
pnpm start             # start the dev servers of all playgrounds
```

Rebuild the packages after changing their source before running or typechecking the playgrounds.

## Hosted playgrounds

[Cloudflare Pages](https://pages.cloudflare.com) builds the playgrounds from this repository with `pnpm build:site` and serves the `site` directory: the PixiJS 4 playground at `/pixi-4/`, the PixiJS 5 playground at `/pixi-5/`, the PixiJS 6 playground at `/pixi-6/`, the PixiJS 7 playground at `/pixi-7/` and the PixiJS 8 playground at `/pixi-8/`. The root redirects to `/pixi-8/`. Pushes to `develop` deploy to https://react-pixi-fiber.pages.dev, and every pull request gets a preview URL, posted as a comment on the pull request.

## Contributing

See the [Contributing Guide](./CONTRIBUTING.md), the [Code of Conduct](./CODE_OF_CONDUCT.md) and the [changelog](./packages/react-pixi-fiber/CHANGELOG.md).

## License

[MIT](./LICENSE)
