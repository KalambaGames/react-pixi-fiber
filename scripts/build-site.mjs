// Puts the built PixiJS 7 and PixiJS 8 playgrounds into one folder for Cloudflare Pages.
// Run through `pnpm build:site`: `pnpm build` builds every app, each playground with its base `/pixi-7/` or `/pixi-8/`.
import { cpSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const site = join(root, "site");

rmSync(site, { force: true, recursive: true });
cpSync(join(root, "apps/playground-pixi7/dist"), join(site, "pixi-7"), { recursive: true });
cpSync(join(root, "apps/playground-pixi8/dist"), join(site, "pixi-8"), { recursive: true });
// The sandboxed runner has the origin "null", so it loads its scripts and assets cross-origin.
writeFileSync(
  join(site, "_headers"),
  "/pixi-7/*\n  Access-Control-Allow-Origin: *\n/pixi-8/*\n  Access-Control-Allow-Origin: *\n"
);
writeFileSync(join(site, "_redirects"), "/ /pixi-8/ 302\n");
