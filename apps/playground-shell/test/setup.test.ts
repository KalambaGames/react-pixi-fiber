import { describe, expect, it } from "vitest";
import { setup } from "../src/parent/setup";

describe("setup", () => {
  it("shows the imports and the configure call", () => {
    expect(setup(8)).toEqual({
      code: [
        'import react19 from "@react-pixi-fiber/react-19";',
        'import pixi8 from "@react-pixi-fiber/pixi-8";',
        'import { configure } from "react-pixi-fiber";',
        "",
        "configure({ react: react19(), pixi: pixi8() });",
      ].join("\n"),
      summary: "React 19 and PixiJS 8",
    });
  });

  it("names the compat it configures", () => {
    expect(setup(7, 6)).toEqual({
      code: [
        'import react19 from "@react-pixi-fiber/react-19";',
        'import pixi7 from "@react-pixi-fiber/pixi-7";',
        'import compat from "@react-pixi-fiber/pixi-7/compat/pixi6";',
        'import { configure } from "react-pixi-fiber";',
        "",
        "configure({ react: react19(), pixi: pixi7({ compat }) });",
      ].join("\n"),
      summary: "React 19 and PixiJS 7 with the PixiJS 6 compat",
    });
  });
});
