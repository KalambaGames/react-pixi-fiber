// Bundles one entry per class-list tier against the built package and checks which PixiJS modules the bundle holds.
// Sizes change with every pixi.js release, so the script checks only which modules are present. Run after `build`.
import assert from "node:assert/strict";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { rolldown } from "rolldown";

const packageDir = dirname(dirname(fileURLToPath(import.meta.url)));

// Modules that only a class outside the tier-two list loads. `MeshRope` is in `scene/mesh-simple`. `RenderContainer` is
// in the directory of `Container`, so its probe is the file path.
const UNLISTED = [
  "dom/DOMContainer",
  "filters/defaults/alpha",
  "filters/defaults/blur",
  "filters/defaults/color-matrix",
  "filters/defaults/displacement",
  "filters/defaults/noise",
  "scene/container/RenderContainer",
  "scene/layers",
  "scene/mesh-perspective",
  "scene/mesh-plane",
  "scene/mesh-simple",
  "scene/particle-container",
  "scene/sprite-animated",
  "scene/sprite-nine-slice",
  "scene/sprite-tiling",
  "scene/text-bitmap",
  "scene/text-html",
];
// Modules that only `Application` loads, through `autoDetectRenderer`.
const RENDERERS = ["autoDetectRenderer", "CanvasRenderer", "WebGPURenderer"];
// `browserExt` imports `browserAll` on every renderer `init`, and `browserAll` loads these modules. `browserAll` itself has no code,
// so it is never a sourcemap source.
// Each tier that checks a module absent has an earlier tier that checks it present, so a wrong path fails the run.
const FLOOR = ["accessibility/AccessibilitySystem", "events/EventSystem"];

const tiers = {
  "tier one, pixi8": {
    code: 'import pixi8 from "@react-pixi-fiber/pixi-8";\nexport const adapter = pixi8();\n',
    present: [...FLOOR, ...UNLISTED, ...RENDERERS],
    absent: [],
  },
  "tier two, trimmed list with Application": {
    code: 'import { Application, Container, Sprite, Text } from "pixi.js";\nimport { pixi8WithComponents } from "@react-pixi-fiber/pixi-8";\nexport const adapter = pixi8WithComponents({ components: { Application, Container, Sprite, Text } });\n',
    present: [...FLOOR, ...RENDERERS],
    absent: UNLISTED,
  },
  // The own-renderer recipe of the README.
  "tier three, trimmed list without Application": {
    code: [
      'import { Container, Sprite, Text, Ticker, WebGLRenderer } from "pixi.js";',
      'import { pixi8WithComponents } from "@react-pixi-fiber/pixi-8";',
      "export const adapter = pixi8WithComponents({ components: { Container, Sprite, Text } });",
      "const renderer = new WebGLRenderer();",
      "await renderer.init({ width: 800, height: 600 });",
      "const stage = new Container();",
      "Ticker.shared.add(() => renderer.render(stage));",
      "export const app = { stage, ticker: Ticker.shared };",
      "",
    ].join("\n"),
    present: [...FLOOR, "gl/WebGLRenderer"],
    absent: [...UNLISTED, ...RENDERERS],
  },
};

const entry = "\0entry.js";
for (const [tier, { code, present, absent }] of Object.entries(tiers)) {
  const bundle = await rolldown({
    input: entry,
    logLevel: "silent",
    platform: "browser",
    plugins: [
      {
        name: "entry",
        // The entry is virtual, so its imports resolve as if from a file in this package.
        resolveId(source, importer) {
          if (source === entry) return entry;
          if (importer === entry) return this.resolve(source, join(packageDir, "index.js"));
          return null;
        },
        load: id => (id === entry ? code : null),
      },
    ],
    resolve: { conditionNames: ["import", "production"] },
  });
  const { output } = await bundle.generate({ format: "es", minify: true, sourcemap: true });
  await bundle.close();
  // `autoDetectRenderer` and `browserExt` load modules through dynamic imports, which land in chunks of their own.
  const sources = output.flatMap(chunk => chunk.map?.sources ?? []).filter(source => source.includes("pixi.js/lib/"));
  const has = name => sources.some(source => source.includes(name));
  for (const name of present) assert.ok(has(name), `${tier}: expected ${name} in the bundle`);
  for (const name of absent) assert.ok(!has(name), `${tier}: expected no ${name} in the bundle`);
  console.log(`ok    ${tier}: ${sources.length} pixi.js modules`);
}
