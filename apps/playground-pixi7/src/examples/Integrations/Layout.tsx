import { Layout as PixiLayout, type LayoutOptions } from "@pixi/layout";
import { useState } from "react";
import { PIXIComponent, Stage } from "react-pixi-fiber";

type LayoutProps = { options: LayoutOptions; parentHeight: number; parentWidth: number };

// The layout arranges its own children. It needs the size of its parent, so a change of that size resizes it.
const Layout = PIXIComponent<PixiLayout, LayoutProps>("Layout", {
  create: ({ options }) => new PixiLayout(options),
  applyProps: function (instance, oldProps, newProps) {
    const { options, parentHeight, parentWidth, ...newPropsRest } = newProps;
    const {
      options: oldOptions,
      parentHeight: oldParentHeight,
      parentWidth: oldParentWidth,
      ...oldPropsRest
    }: Partial<LayoutProps> = oldProps || {};
    instance.resize(parentWidth, parentHeight);
    this.applyDisplayObjectProps(oldPropsRest, newPropsRest);
  },
});

const text = { color: "white", fontFamily: "Arial", fontSize: 16 } as const;
const row = (label: string, value: string): LayoutOptions => ({
  content: {
    label: { content: label, styles: { ...text, marginLeft: 20, position: "left" } },
    value: { content: value, styles: { ...text, color: 0xffd34d, marginRight: 20, position: "right" } },
  },
  styles: { display: "block", height: 28, marginTop: 6, width: "100%" },
});
const button = (label: string): LayoutOptions => ({
  content: label,
  styles: {
    ...text,
    background: 0x2f8f5b,
    borderRadius: 8,
    display: "inline-block",
    height: 36,
    marginRight: 10,
    marginTop: 14,
    textAlign: "center",
    verticalAlign: "middle",
    width: 100,
  },
});

// A pause menu: a title, rows with a label on the left and a value on the right, and a row of buttons.
const menu: LayoutOptions = {
  content: {
    title: {
      content: "PAUSED",
      styles: {
        ...text,
        display: "block",
        fontSize: 24,
        fontWeight: "bold",
        height: 36,
        paddingLeft: 20,
        width: "100%",
      },
    },
    level: row("Level", "3 – Carrot Fields"),
    score: row("Score", "12 400"),
    time: row("Time", "04:17"),
    buttons: {
      content: [button("Resume"), button("Quit")],
      styles: { display: "block", height: 50, paddingLeft: 20, width: "100%" },
    },
  },
  styles: {
    background: 0x0b3d5c,
    borderRadius: 16,
    height: "auto",
    paddingBottom: 20,
    paddingTop: 20,
    position: "center",
    width: "80%",
  },
};

export default function LayoutExample() {
  const [width, setWidth] = useState(400);
  return (
    <div>
      <label style={{ alignItems: "center", display: "flex", gap: 8, marginBottom: 8 }}>
        Area width
        <input
          max={400}
          min={340}
          onChange={event => setWidth(Number(event.target.value))}
          type="range"
          value={width}
        />
        {width}
      </label>
      <Stage options={{ backgroundColor: 0x1099bb, height: 300, width: 400 }}>
        <Layout options={menu} parentHeight={300} parentWidth={width} />
      </Stage>
    </div>
  );
}
