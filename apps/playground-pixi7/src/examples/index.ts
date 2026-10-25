import { type Example, setup } from "playground-shell/parent";
import Animated from "./Integrations/Animated.tsx?raw";
import AnimatedSprite from "./DisplayObjects/AnimatedSprite.tsx?raw";
import BitmapText from "./DisplayObjects/BitmapText.tsx?raw";
import Bunnymark from "./Features/Bunnymark.tsx?raw";
import BunnymarkCustomComponents from "./Features/BunnymarkCustomComponents.tsx?raw";
import CanvasProps from "./Features/CanvasProps.tsx?raw";
import Container from "./DisplayObjects/Container.tsx?raw";
import Deprecations from "./Features/Deprecations.tsx?raw";
import Events from "./Features/Events.tsx?raw";
import Graphics from "./DisplayObjects/Graphics.tsx?raw";
import Hooks from "./Features/Hooks.tsx?raw";
import HTMLText from "./DisplayObjects/HTMLText.tsx?raw";
import Layers from "./Features/Layers.tsx?raw";
import Mesh from "./DisplayObjects/Mesh.tsx?raw";
import MeshPlane from "./DisplayObjects/MeshPlane.tsx?raw";
import MeshRope from "./DisplayObjects/MeshRope.tsx?raw";
import MeshSimple from "./DisplayObjects/MeshSimple.tsx?raw";
import MigratingFromPixi6 from "./Migration/MigratingFromPixi6.tsx?raw";
import NineSliceSprite from "./DisplayObjects/NineSliceSprite.tsx?raw";
import OwnRenderer from "./Features/OwnRenderer.tsx?raw";
import ParticleContainer from "./DisplayObjects/ParticleContainer.tsx?raw";
import PIXIComponent from "./Features/PIXIComponent.tsx?raw";
import PIXIProperty from "./Features/PIXIProperty.tsx?raw";
import PointLikeProps from "./Features/PointLikeProps.tsx?raw";
import SmokeTest from "./Features/SmokeTest.tsx?raw";
import Sprite from "./DisplayObjects/Sprite.tsx?raw";
import Suspense from "./Features/Suspense.tsx?raw";
import Text from "./DisplayObjects/Text.tsx?raw";
import TilingSprite from "./DisplayObjects/TilingSprite.tsx?raw";

const example = (title: string, code: string): Example => ({
  code,
  configure: setup(7),
  group: "Display Objects",
  id: title.toLowerCase(),
  runner: "runner.html",
  title,
});

const feature = (name: string, title: string, code: string): Example => ({
  ...example(title, code),
  group: "Features",
  id: name.toLowerCase(),
});

const integration = (name: string, title: string, code: string): Example => ({
  ...feature(name, title, code),
  group: "Integrations",
});

const compat = (name: string, title: string, code: string): Example => ({
  ...feature(name, title, code),
  configure: setup(7, 6),
  group: "Migration",
  runner: "runner-compat-pixi6.html",
});

export const examples: Example[] = [
  example("AnimatedSprite", AnimatedSprite),
  example("BitmapText", BitmapText),
  example("Container", Container),
  example("Graphics", Graphics),
  example("HTMLText", HTMLText),
  example("Mesh", Mesh),
  example("MeshPlane", MeshPlane),
  example("MeshRope", MeshRope),
  example("MeshSimple", MeshSimple),
  example("NineSliceSprite", NineSliceSprite),
  example("ParticleContainer", ParticleContainer),
  example("Sprite", Sprite),
  example("Text", Text),
  example("TilingSprite", TilingSprite),
  feature("Bunnymark", "Bunnymark", Bunnymark),
  feature("BunnymarkCustomComponents", "Bunnymark with custom components", BunnymarkCustomComponents),
  feature("CanvasProps", "Canvas props", CanvasProps),
  feature("Deprecations", "Deprecations", Deprecations),
  feature("Events", "Events", Events),
  feature("Hooks", "Hooks", Hooks),
  feature("Layers", "Layers", Layers),
  feature("OwnRenderer", "Own renderer", OwnRenderer),
  feature("PIXIComponent", "PIXIComponent", PIXIComponent),
  feature("PIXIProperty", "PIXIProperty", PIXIProperty),
  feature("PointLikeProps", "Point-like props", PointLikeProps),
  feature("SmokeTest", "Smoke test", SmokeTest),
  feature("Suspense", "Suspense", Suspense),
  integration("Animated", "Animated", Animated),
  compat("MigratingFromPixi6", "Migrating from PixiJS 6", MigratingFromPixi6),
];
