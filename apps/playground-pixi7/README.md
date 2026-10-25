# PixiJS 7 playground

The playground shows examples of react-pixi-fiber with PixiJS 7. Each example has a code editor and a live preview.
You can change the code and see the result.

The hosted playground is at https://react-pixi-fiber.pages.dev/pixi-7/.

## Run the playground

The playground loads the built packages of this repository. Before the first start, run these commands in the
repository root:

```sh
pnpm install
pnpm build
```

When you change a package, run `pnpm build` again.

To start the playground, run this command in the repository root:

```sh
pnpm start
```

This command starts the Vite development servers of all the playgrounds. This playground is at http://localhost:5170/.
When you change the playground or an example, the page updates. The version picker opens the other playgrounds on their
own dev servers. To start only this playground, run `pnpm --filter playground-pixi7 start`.

The playground uses development builds of React, react-pixi-fiber and the adapter. This is on purpose. The warnings
in the console are then readable.

## Check the production build

To make the production build and look at it in your browser, run these commands in the repository root:

```sh
pnpm --filter playground-pixi7 build
pnpm --filter playground-pixi7 preview
```

The preview frame loads its scripts from a different origin. If you use a different static server, the server must
send CORS headers. If it does not, the preview stays blank.

## Add an example

1. Create a TSX file in the folder of its sidebar group in `src/examples/`: `DisplayObjects/`, `Features/`,
   `Integrations/` or `Migration/`. The file has one default-exported function component.
2. In `src/examples/index.ts`, add a helper call to the `examples` list. The helper finds the source by the name of the
   file, so the name and the file name must be the same. Use `example("Name")` for a Display Object,
   `feature("Name", "Title")` for a feature, `integration("Name", "Title")` for an integration example, or
   `compat("Name", "Title")` for a migration example. Keep the entries in alphabetical order. Each group has its own
   part of the list.
3. If the example imports a new package or asset path, add it to `src/modules.ts`. The runner resolves only the imports
   in this map.

## Why the runner uses a sandbox

Example code runs in an iframe with `sandbox="allow-scripts"`. Code from a share link cannot reach the storage of
the page or other sites. The runner refuses to run outside a sandbox.

Your edits stay in the storage of your browser. The Share button packs the code into the URL hash. If you saved an
edit of an example, the playground shows your edit and not the example file. To load the example file, push Reset.
