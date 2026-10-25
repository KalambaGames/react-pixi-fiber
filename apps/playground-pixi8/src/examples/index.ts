import { type Example, setup } from "playground-shell/parent";
import Animated from "./Animated.tsx?raw";
import AnimatedSprite from "./AnimatedSprite.tsx?raw";
import BitmapText from "./BitmapText.tsx?raw";
import Bunnymark from "./Bunnymark.tsx?raw";
import BunnymarkCustomComponents from "./BunnymarkCustomComponents.tsx?raw";
import CanvasProps from "./CanvasProps.tsx?raw";
import Container from "./Container.tsx?raw";
import DOMContainer from "./DOMContainer.tsx?raw";
import Events from "./Events.tsx?raw";
import Graphics from "./Graphics.tsx?raw";
import Hooks from "./Hooks.tsx?raw";
import HTMLText from "./HTMLText.tsx?raw";
import Mesh from "./Mesh.tsx?raw";
import MeshPlane from "./MeshPlane.tsx?raw";
import MeshRope from "./MeshRope.tsx?raw";
import MeshSimple from "./MeshSimple.tsx?raw";
import MigratingFromPixi6 from "./MigratingFromPixi6.tsx?raw";
import MigratingFromPixi7 from "./MigratingFromPixi7.tsx?raw";
import NineSliceSprite from "./NineSliceSprite.tsx?raw";
import OwnRenderer from "./OwnRenderer.tsx?raw";
import ParticleContainer from "./ParticleContainer.tsx?raw";
import PerspectiveMesh from "./PerspectiveMesh.tsx?raw";
import PIXIComponent from "./PIXIComponent.tsx?raw";
import PIXIProperty from "./PIXIProperty.tsx?raw";
import PointLikeProps from "./PointLikeProps.tsx?raw";
import RenderContainer from "./RenderContainer.tsx?raw";
import RenderLayer from "./RenderLayer.tsx?raw";
import SmokeTest from "./SmokeTest.tsx?raw";
import Sprite from "./Sprite.tsx?raw";
import Suspense from "./Suspense.tsx?raw";
import Text from "./Text.tsx?raw";
import TilingSprite from "./TilingSprite.tsx?raw";

const example = (title: string, code: string): Example => ({
  code,
  configure: setup(8),
  group: "Scene Objects",
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

const compat = (version: 6 | 7, name: string, title: string, code: string): Example => ({
  ...feature(name, title, code),
  configure: setup(8, version),
  group: "Migration",
  runner: `runner-compat-pixi${version}.html`,
});

export const examples: Example[] = [
  example("AnimatedSprite", AnimatedSprite),
  example("BitmapText", BitmapText),
  example("Container", Container),
  example("DOMContainer", DOMContainer),
  example("Graphics", Graphics),
  example("HTMLText", HTMLText),
  example("Mesh", Mesh),
  example("MeshPlane", MeshPlane),
  example("MeshRope", MeshRope),
  example("MeshSimple", MeshSimple),
  example("NineSliceSprite", NineSliceSprite),
  example("ParticleContainer", ParticleContainer),
  example("PerspectiveMesh", PerspectiveMesh),
  example("RenderContainer", RenderContainer),
  example("RenderLayer", RenderLayer),
  example("Sprite", Sprite),
  example("Text", Text),
  example("TilingSprite", TilingSprite),
  feature("Bunnymark", "Bunnymark", Bunnymark),
  feature("BunnymarkCustomComponents", "Bunnymark with custom components", BunnymarkCustomComponents),
  feature("CanvasProps", "Canvas props", CanvasProps),
  feature("Events", "Events", Events),
  feature("Hooks", "Hooks", Hooks),
  feature("OwnRenderer", "Own renderer", OwnRenderer),
  feature("PIXIComponent", "PIXIComponent", PIXIComponent),
  feature("PIXIProperty", "PIXIProperty", PIXIProperty),
  feature("PointLikeProps", "Point-like props", PointLikeProps),
  feature("SmokeTest", "Smoke test", SmokeTest),
  feature("Suspense", "Suspense", Suspense),
  integration("Animated", "Animated", Animated),
  compat(6, "MigratingFromPixi6", "Migrating from PixiJS 6", MigratingFromPixi6),
  compat(7, "MigratingFromPixi7", "Migrating from PixiJS 7", MigratingFromPixi7),
];
