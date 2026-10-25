import react19 from "@react-pixi-fiber/react-19";
import pixi8 from "@react-pixi-fiber/pixi-8";
import compat from "@react-pixi-fiber/pixi-8/compat/pixi7";
import { createRoot } from "react-dom/client";
import { configure } from "react-pixi-fiber";
import { startRunner } from "playground-shell/runner";
import { lazyModules, modules } from "../modules";

configure({ react: react19(), pixi: pixi8({ compat }) });

const container = document.getElementById("root");
if (!container) throw new Error("Missing #root");
const root = createRoot(container);

startRunner({ lazyModules, modules, render: Component => root.render(<Component />) });
