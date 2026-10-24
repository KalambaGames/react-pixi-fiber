import { buildHash } from "./share";

export type Version = { devPort: number; label: string; path: string };

export const versions: Version[] = [
  { devPort: 5170, label: "PixiJS 7", path: "../pixi-7/" },
  { devPort: 5180, label: "PixiJS 8", path: "../pixi-8/" },
];

// The site serves the playgrounds side by side. In development each playground runs its own server.
// The link keeps the example, so switching versions shows the same example where both versions have it.
export function versionHref(
  version: Version,
  { hostname, port }: Pick<Location, "hostname" | "port">,
  exampleId?: string
): string {
  const base = versions.some(candidate => String(candidate.devPort) === port)
    ? `http://${hostname}:${version.devPort}/`
    : version.path;
  return exampleId ? `${base}${buildHash(exampleId)}` : base;
}
