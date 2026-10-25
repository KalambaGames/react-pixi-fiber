// The import applies the layout mixin to every PixiJS container, so it comes before the Stage creates the app.
import "@pixi/layout";
import type { LayoutStyles } from "@pixi/layout";
import { LayoutContainer } from "@pixi/layout/components";
import { Text as PixiText, type TextStyleOptions } from "pixi.js";
import { useState } from "react";
import { PIXIComponent, Stage } from "react-pixi-fiber";

// A container that draws the background color and the rounded corners of its layout. The `layout` prop takes the
// styles that Yoga applies to it and to its children.
const Box = PIXIComponent<LayoutContainer, { layout: LayoutStyles }>("Box", { create: () => new LayoutContainer() });
// A text that takes part in the layout, so Yoga knows its size.
const Label = PIXIComponent<PixiText, { style: TextStyleOptions; text: string }>("Label", {
  create: () => new PixiText({ layout: true }),
});

const text = { fill: "white", fontFamily: "Arial", fontSize: 16 } as const;
const levels = Array.from({ length: 12 }, (_, index) => index + 1);

// A level select menu. Yoga places every box: the tiles wrap into as many rows as the width needs, with the same
// gaps, and the buttons share the last row. Nothing here computes a position.
export default function LayoutExample() {
  const [width, setWidth] = useState(400);
  return (
    <div>
      <label style={{ alignItems: "center", display: "flex", gap: 8, marginBottom: 8 }}>
        Canvas width
        <input
          max={400}
          min={200}
          onChange={event => setWidth(Number(event.target.value))}
          type="range"
          value={width}
        />
        {width}
      </label>
      <Stage options={{ background: 0x1099bb, height: 300, width }}>
        <Box layout={{ alignItems: "center", height: 300, justifyContent: "center", width }}>
          <Box
            layout={{
              backgroundColor: 0x0b3d5c,
              borderRadius: 16,
              flexDirection: "column",
              gap: 12,
              padding: 16,
              width: "90%",
            }}
          >
            <Label style={{ ...text, fontSize: 22, fontWeight: "bold" }} text="SELECT LEVEL" />
            <Box layout={{ flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
              {levels.map(level => (
                <Box
                  key={level}
                  layout={{
                    alignItems: "center",
                    backgroundColor: level <= 5 ? 0x2f8f5b : 0x4a5a6a,
                    borderRadius: 8,
                    height: 40,
                    justifyContent: "center",
                    width: 40,
                  }}
                >
                  <Label style={text} text={String(level)} />
                </Box>
              ))}
            </Box>
            <Box layout={{ flexDirection: "row", gap: 8 }}>
              {["Back", "Play"].map(label => (
                <Box
                  key={label}
                  layout={{
                    alignItems: "center",
                    backgroundColor: label === "Play" ? 0xe0902a : 0x4a5a6a,
                    borderRadius: 8,
                    flexGrow: 1,
                    height: 36,
                    justifyContent: "center",
                  }}
                >
                  <Label style={text} text={label} />
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      </Stage>
    </div>
  );
}
