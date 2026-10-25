import react19 from "@react-pixi-fiber/react-19";
import pixi6 from "@react-pixi-fiber/pixi-6";
import { createRoot } from "react-dom/client";
import { configure } from "react-pixi-fiber";
import { startRunner } from "playground-shell/runner";
import { modules } from "../modules";

configure({ react: react19(), pixi: pixi6() });

const container = document.getElementById("root");
if (!container) throw new Error("Missing #root");
const root = createRoot(container);

startRunner({ modules, render: Component => root.render(<Component />) });
