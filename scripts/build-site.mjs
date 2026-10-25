// Puts the built PixiJS 4, 5, 6, 7 and 8 playgrounds into one folder for Cloudflare Pages.
// Run through `pnpm build:site`: `pnpm build` builds every app, each playground with its base `/pixi-<major>/`.
import { cpSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const site = join(root, "site");
const majors = [4, 5, 6, 7, 8];

rmSync(site, { force: true, recursive: true });
for (const major of majors) {
  cpSync(join(root, `apps/playground-pixi${major}/dist`), join(site, `pixi-${major}`), { recursive: true });
}
// The sandboxed runner has the origin "null", so it loads its scripts and assets cross-origin.
writeFileSync(
  join(site, "_headers"),
  majors.map(major => `/pixi-${major}/*\n  Access-Control-Allow-Origin: *\n`).join("")
);
writeFileSync(join(site, "_redirects"), "/ /pixi-8/ 302\n");
