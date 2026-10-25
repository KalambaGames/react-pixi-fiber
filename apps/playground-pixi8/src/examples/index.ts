import { type Example, setup } from "playground-shell/parent";

const sources = import.meta.glob<string>("./*/*.tsx", { import: "default", query: "?raw" });

// An example loads its source from the file named after it, so a wrong name fails when the playground starts.
const source = (path: string) => {
  const load = sources[path];
  if (!load) throw new Error(`No example source at ${path}`);
  return load;
};

const example = (title: string, load = source(`./SceneObjects/${title}.tsx`)): Example => ({
  configure: setup(8),
  group: "Scene Objects",
  id: title.toLowerCase(),
  load,
  runner: "runner.html",
  title,
});

const feature = (name: string, title: string, load = source(`./Features/${name}.tsx`)): Example => ({
  ...example(title, load),
  group: "Features",
  id: name.toLowerCase(),
});

const integration = (name: string, title: string): Example => ({
  ...feature(name, title, source(`./Integrations/${name}.tsx`)),
  group: "Integrations",
});

const compat = (version: 6 | 7, name: string, title: string): Example => ({
  ...feature(name, title, source(`./Migration/${name}.tsx`)),
  configure: setup(8, version),
  group: "Migration",
  runner: `runner-compat-pixi${version}.html`,
});

export const examples: Example[] = [
  example("AnimatedSprite"),
  example("BitmapText"),
  example("Container"),
  example("DOMContainer"),
  example("Graphics"),
  example("HTMLText"),
  example("Mesh"),
  example("MeshPlane"),
  example("MeshRope"),
  example("MeshSimple"),
  example("NineSliceSprite"),
  example("ParticleContainer"),
  example("PerspectiveMesh"),
  example("RenderContainer"),
  example("RenderLayer"),
  example("Sprite"),
  example("Text"),
  example("TilingSprite"),
  feature("Bunnymark", "Bunnymark"),
  feature("BunnymarkCustomComponents", "Bunnymark with custom components"),
  feature("CanvasProps", "Canvas props"),
  feature("Events", "Events"),
  feature("Hooks", "Hooks"),
  feature("OwnRenderer", "Own renderer"),
  feature("PIXIComponent", "PIXIComponent"),
  feature("PIXIProperty", "PIXIProperty"),
  feature("PointLikeProps", "Point-like props"),
  feature("SmokeTest", "Smoke test"),
  feature("Suspense", "Suspense"),
  integration("Animated", "Animated"),
  integration("GSAP", "GSAP"),
  integration("Layout", "Layout"),
  integration("Leva", "Leva"),
  integration("MatterJS", "Matter.js"),
  integration("Motion", "Motion"),
  integration("PixiStats", "pixi-stats"),
  integration("ReactSpring", "react-spring"),
  integration("Sound", "Sound"),
  integration("Tilemap", "Tilemap"),
  integration("UI", "UI"),
  integration("Viewport", "Viewport"),
  integration("Zustand", "zustand"),
  compat(6, "MigratingFromPixi6", "Migrating from PixiJS 6"),
  compat(7, "MigratingFromPixi7", "Migrating from PixiJS 7"),
];
