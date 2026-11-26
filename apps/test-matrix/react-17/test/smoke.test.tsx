import react17 from "@react-pixi-fiber/react-17";

import { smokeMatrix } from "../../pairs";

smokeMatrix("react-17", react17);
smokeMatrix("react-17 concurrent", () => react17({ root: "concurrent" }));
