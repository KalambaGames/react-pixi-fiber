import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import type { TsdownHooks } from "tsdown";

import { createTsdownConfig } from "../../scripts/tsdown.config.ts";

// src/index.ts exports `Stage` as a value and a type (a local type alias next to the imported value).
// rolldown-plugin-dts 0.27 keeps the type and drops the value from the bundled declarations, so this hook
// declares the value in the declaration files each build wrote (a Rolldown plugin misses the CJS ones).
// It does nothing once the bundler keeps the value, for example when `Stage` becomes a local declaration
// that is both a value and a type (the bundler keeps those, like the tag constants).
const declareStageValue: TsdownHooks["build:done"] = ({ chunks }) => {
  for (const chunk of chunks) {
    if (!/\.d\.m?ts$/.test(chunk.fileName)) continue;
    const path = join(chunk.outDir, chunk.fileName);
    const code = readFileSync(path, "utf8");
    if (/\bdeclare (?:const|let|function|class) Stage\b|\b\w+ as Stage\b/.test(code)) continue;
    if (!/\btype Stage = StageComponent;/.test(code)) {
      throw new Error(`${path}: found neither a \`Stage\` value nor its type, see declareStageValue`);
    }
    writeFileSync(path, `${code}\ndeclare const Stage: StageComponent;\n`);
  }
};

export default createTsdownConfig({
  name: "react-pixi-fiber",
  external: ["react"],
  hooks: { "build:done": declareStageValue },
  tsconfig: "tsconfig.build.json",
});
