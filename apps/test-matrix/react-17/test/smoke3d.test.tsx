import react17 from "@react-pixi-fiber/react-17";

import { smoke3dSuite } from "../../../../packages/pixi3d-0/test/utils/smoke";

smoke3dSuite("react-17", react17);
smoke3dSuite("react-17 concurrent", () => react17({ root: "concurrent" }));
