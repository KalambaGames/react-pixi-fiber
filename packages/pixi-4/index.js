const mod =
  process.env.NODE_ENV === "production"
    ? require("./dist/cjs/pixi-4.production.min.js")
    : require("./dist/cjs/pixi-4.development.js");

// Node ESM default-imports module.exports, so it has to be the factory itself. The assignments are spelled out
// because Node finds the named exports of a CommonJS file by static analysis.
module.exports = mod.default;
module.exports.default = mod.default;
module.exports.FXAAFilter = mod.FXAAFilter;
module.exports.NineSlicePlane = mod.NineSlicePlane;
module.exports.Plane = mod.Plane;
module.exports.Rope = mod.Rope;
