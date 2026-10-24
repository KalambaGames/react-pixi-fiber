// Puts the built pixi-7 examples and the PixiJS 8 playground into one folder for Cloudflare Pages.
// Run through `pnpm build:site`: `pnpm build` builds every app, the playground with the base `/pixi-8/`.
import { cpSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const site = join(root, "site");

rmSync(site, { force: true, recursive: true });
cpSync(join(root, "apps/examples/dist"), site, { recursive: true });
cpSync(join(root, "apps/playground-pixi8/dist"), join(site, "pixi-8"), { recursive: true });
// The sandboxed runner has the origin "null", so it loads its scripts and assets cross-origin.
writeFileSync(join(site, "_headers"), "/pixi-8/*\n  Access-Control-Allow-Origin: *\n");
