import { mountPlayground } from "playground-shell/parent";
import { examples } from "./examples/index";

const root = document.getElementById("root");
if (!root) throw new Error("Missing #root");

mountPlayground({ examples, pixiMajor: 7, root });
