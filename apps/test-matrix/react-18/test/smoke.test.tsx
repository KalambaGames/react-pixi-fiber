import react18 from "@react-pixi-fiber/react-18";

import { smokeMatrix } from "../../pairs";

smokeMatrix("react-18", react18);
smokeMatrix("react-18 concurrent", () => react18({ root: "concurrent" }));
