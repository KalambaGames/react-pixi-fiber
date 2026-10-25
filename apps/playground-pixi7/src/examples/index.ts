import { type Example, setup } from "playground-shell/parent";

const sources = import.meta.glob<string>("./*/*.tsx", { import: "default", query: "?raw" });

// An example loads its source from the file named after it, so a wrong name fails when the playground starts.
const source = (path: string) => {
  const load = sources[path];
  if (!load) throw new Error(`No example source at ${path}`);
  return load;
};

const example = (title: string, load = source(`./DisplayObjects/${title}.tsx`)): Example => ({
  configure: setup(7),
  group: "Display Objects",
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

const compat = (name: string, title: string): Example => ({
  ...feature(name, title, source(`./Migration/${name}.tsx`)),
  configure: setup(7, 6),
  group: "Migration",
  runner: "runner-compat-pixi6.html",
});

export const examples: Example[] = [
  example("AnimatedSprite"),
  example("BitmapText"),
  example("Container"),
  example("Graphics"),
  example("HTMLText"),
  example("Mesh"),
  example("MeshPlane"),
  example("MeshRope"),
  example("MeshSimple"),
  example("NineSliceSprite"),
  example("ParticleContainer"),
  example("Sprite"),
  example("Text"),
  example("TilingSprite"),
  feature("Bunnymark", "Bunnymark"),
  feature("BunnymarkCustomComponents", "Bunnymark with custom components"),
  feature("CanvasProps", "Canvas props"),
  feature("Deprecations", "Deprecations"),
  feature("Events", "Events"),
  feature("Hooks", "Hooks"),
  feature("Layers", "Layers"),
  feature("OwnRenderer", "Own renderer"),
  feature("PIXIComponent", "PIXIComponent"),
  feature("PIXIProperty", "PIXIProperty"),
  feature("PointLikeProps", "Point-like props"),
  feature("SmokeTest", "Smoke test"),
  feature("Suspense", "Suspense"),
  integration("Animated", "Animated"),
  integration("GSAP", "GSAP"),
  integration("Leva", "Leva"),
  integration("MatterJS", "Matter.js"),
  integration("Motion", "Motion"),
  integration("ReactSpring", "react-spring"),
  integration("Viewport", "Viewport"),
  integration("Zustand", "zustand"),
  compat("MigratingFromPixi6", "Migrating from PixiJS 6"),
];
