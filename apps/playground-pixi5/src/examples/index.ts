import { type Example, setup } from "playground-shell/parent";
import Animated from "./Animated.tsx?raw";
import AnimatedSprite from "./AnimatedSprite.tsx?raw";
import BitmapText from "./BitmapText.tsx?raw";
import Bunnymark from "./Bunnymark.tsx?raw";
import BunnymarkCustomComponents from "./BunnymarkCustomComponents.tsx?raw";
import CanvasProps from "./CanvasProps.tsx?raw";
import Container from "./Container.tsx?raw";
import Deprecations from "./Deprecations.tsx?raw";
import Events from "./Events.tsx?raw";
import Graphics from "./Graphics.tsx?raw";
import Hooks from "./Hooks.tsx?raw";
import Layers from "./Layers.tsx?raw";
import Mesh from "./Mesh.tsx?raw";
import MeshPlane from "./MeshPlane.tsx?raw";
import MeshRope from "./MeshRope.tsx?raw";
import MeshSimple from "./MeshSimple.tsx?raw";
import NineSliceSprite from "./NineSliceSprite.tsx?raw";
import OwnRenderer from "./OwnRenderer.tsx?raw";
import ParticleContainer from "./ParticleContainer.tsx?raw";
import PIXIComponent from "./PIXIComponent.tsx?raw";
import PIXIProperty from "./PIXIProperty.tsx?raw";
import PointLikeProps from "./PointLikeProps.tsx?raw";
import SmokeTest from "./SmokeTest.tsx?raw";
import Sprite from "./Sprite.tsx?raw";
import Suspense from "./Suspense.tsx?raw";
import Text from "./Text.tsx?raw";
import TilingSprite from "./TilingSprite.tsx?raw";

const example = (title: string, code: string): Example => ({
  code,
  configure: setup(5),
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

export const examples: Example[] = [
  example("AnimatedSprite", AnimatedSprite),
  example("BitmapText", BitmapText),
  example("Container", Container),
  example("Graphics", Graphics),
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
];
