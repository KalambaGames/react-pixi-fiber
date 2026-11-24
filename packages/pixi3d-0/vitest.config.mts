import { createVitestConfig } from "../../scripts/vitest.config.ts";

// The PixiJS 8 adapter's source takes `pixi.js` from its own package, an older release than `@pixi/3d` needs.
export default createVitestConfig({ root: import.meta.dirname, ownModules: ["pixi.js"] });
