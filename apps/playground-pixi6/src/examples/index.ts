import { type Example, setup } from "playground-shell/parent";

const sources = import.meta.glob<string>("./*/*.tsx", { import: "default", query: "?raw" });

// An example loads its source from the file named after it, so a wrong name fails when the playground starts.
const source = (path: string) => {
  const load = sources[path];
  if (!load) throw new Error(`No example source at ${path}`);
  return load;
};

const example = (title: string, load = source(`./DisplayObjects/${title}.tsx`)): Example => ({
  configure: setup(6),
  group: "Display Objects",
  id: title.toLowerCase(),
  load,
  runner: "runner.html",
  title,
});

const feature = (name: string, title: string, load = source(`./Features/${name}.tsx`)): Example => ({
  ...example(title, load),
  // The id before the group prefix.
  aliases: [name.toLowerCase()],
  group: "Features",
  id: `features-${name.toLowerCase()}`,
});

const filter = (name: string, title: string): Example => ({
  ...example(title, source(`./Filters/${name}.tsx`)),
  group: "Filters",
  id: `filters-${name.toLowerCase()}`,
});

const integration = (name: string, title: string): Example => ({
  ...feature(name, title, source(`./Integrations/${name}.tsx`)),
  group: "Integrations",
  id: `integrations-${name.toLowerCase()}`,
});

export const examples: Example[] = [
  example("AnimatedSprite"),
  example("BitmapText"),
  example("Container"),
  example("Graphics"),
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
  filter("Basic", "Basic"),
  filter("Animated", "Animated"),
  integration("Animated", "Animated"),
  integration("GSAP", "GSAP"),
  integration("Leva", "Leva"),
  integration("MatterJS", "Matter.js"),
  integration("Motion", "Motion"),
  integration("ReactSpring", "react-spring"),
  integration("Sound", "Sound"),
  integration("Spine", "Spine"),
  integration("Tilemap", "Tilemap"),
  integration("Viewport", "Viewport"),
  integration("Zustand", "zustand"),
];
