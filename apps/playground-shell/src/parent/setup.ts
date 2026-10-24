// The configure code a page runs with, as an app would write it.
export function setup(pixiMajor: number, compatMajor?: number): { code: string; summary: string } {
  const pixi = `pixi${pixiMajor}`;
  const code = [
    'import react19 from "@react-pixi-fiber/react-19";',
    `import ${pixi} from "@react-pixi-fiber/pixi-${pixiMajor}";`,
    ...(compatMajor ? [`import compat from "@react-pixi-fiber/pixi-${pixiMajor}/compat/pixi${compatMajor}";`] : []),
    'import { configure } from "react-pixi-fiber";',
    "",
    `configure({ react: react19(), pixi: ${pixi}(${compatMajor ? "{ compat }" : ""}) });`,
  ].join("\n");
  const summary = `React 19 and PixiJS ${pixiMajor}${compatMajor ? ` with the PixiJS ${compatMajor} compat` : ""}`;
  return { code, summary };
}
