const mod =
  process.env.NODE_ENV === "production"
    ? require("./dist/cjs/pixi-8.production.min.js")
    : require("./dist/cjs/pixi-8.development.js");

// Node ESM default-imports module.exports, so it has to be the factory itself. The assignments are spelled out
// because Node finds the named exports of a CommonJS file by static analysis.
module.exports = mod.default;
module.exports.default = mod.default;
module.exports.allClasses = mod.allClasses;
module.exports.pixi8WithClasses = mod.pixi8WithClasses;
module.exports.DOMContainer = mod.DOMContainer;
module.exports.HTMLText = mod.HTMLText;
module.exports.Particle = mod.Particle;
module.exports.PerspectiveMesh = mod.PerspectiveMesh;
module.exports.RenderContainer = mod.RenderContainer;
module.exports.RenderLayer = mod.RenderLayer;
