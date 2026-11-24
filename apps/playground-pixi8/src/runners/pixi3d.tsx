import react19 from "@react-pixi-fiber/react-19";
import pixi8 from "@react-pixi-fiber/pixi-8";
import pixi3d0 from "@react-pixi-fiber/pixi3d-0";
import { createRoot } from "react-dom/client";
import { configure } from "react-pixi-fiber";
import { startRunner } from "playground-shell/runner";
import { lazyModules, modules } from "../modules";

// The setup panel in src/examples/index.ts shows the same setup.
configure({ react: react19(), pixi: pixi8(), pixi3d: pixi3d0() });

const container = document.getElementById("root");
if (!container) throw new Error("Missing #root");
const root = createRoot(container);

startRunner({ lazyModules, modules, render: Component => root.render(<Component />) });
