import react18 from "@react-pixi-fiber/react-18";

import { smoke3dSuite } from "../../../../packages/pixi3d-0/test/utils/smoke";

smoke3dSuite("react-18", react18);
smoke3dSuite("react-18 concurrent", () => react18({ root: "concurrent" }));
