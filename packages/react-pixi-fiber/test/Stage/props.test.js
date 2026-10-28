import { describe, it, expect } from "vitest";
import { STAGE_PROP_NAMES, getCanvasProps, getContainerProps } from "../../src/Stage/props";
import { getStandardNames } from "../../src/PixiProperty";
import { getPixiAdapter } from "../../src/configure";
import pixi6 from "@react-pixi-fiber/pixi-6";

const adapter = pixi6();

const typedNames = Object.values(getStandardNames(adapter));
const toProps = names => Object.fromEntries(names.map(name => [name, 1]));

describe("Container and canvas prop split", () => {
  it("puts the typed names and the adapter's untyped Container names on app.stage", () => {
    const names = [...typedNames, ...adapter.properties.untypedContainer];
    expect(Object.keys(getContainerProps(toProps(names))).sort()).toEqual([...new Set(names)].sort());
    expect(getCanvasProps(toProps(names))).toEqual({});
  });

  it("puts a miscased typed name on app.stage, as 2.x did", () => {
    expect(getContainerProps({ buttonmode: true })).toEqual({ buttonmode: true });
    expect(getCanvasProps({ buttonmode: true })).toEqual({});
  });

  it("puts other props on the canvas", () => {
    const props = { className: "c", id: "i", style: {} };
    expect(getCanvasProps(props)).toEqual(props);
    expect(getContainerProps(props)).toEqual({});
  });

  it("puts Stage's own props on neither, except the typed width and height", () => {
    expect(getCanvasProps(toProps(STAGE_PROP_NAMES))).toEqual({});
    expect(Object.keys(getContainerProps(toProps(STAGE_PROP_NAMES))).sort()).toEqual(["height", "width"]);
  });

  it("keeps an own prop off app.stage even when the adapter lists it as a Container property", () => {
    const { untypedContainer } = getPixiAdapter().properties;
    untypedContainer.push("bridgeContexts");
    try {
      expect(getContainerProps({ bridgeContexts: [], width: 1 })).toEqual({ width: 1 });
    } finally {
      untypedContainer.pop();
    }
  });
});

describe("getCanvasProps", () => {
  it("extracts <canvas /> related props from all props", () => {
    const allProps = {
      className: "canvas--responsive",
      options: {
        height: 200,
        width: 200,
      },
      position: "100,0",
      scale: 2,
      style: {
        position: "relative",
      },
    };
    const canvasProps = {
      className: allProps.className,
      style: allProps.style,
    };
    expect(getCanvasProps(allProps)).toEqual(canvasProps);
  });

  it("does not forward Stage's own props to the canvas", () => {
    const props = {
      app: {},
      bridgeContexts: [],
      destroyOptions: true,
      options: {},
      children: null,
      onBeforeDestroy: () => {},
      onInit: () => {},
      width: 1,
      height: 2,
      className: "c",
    };
    expect(getCanvasProps(props)).toEqual({ className: "c" });
  });
});

describe("getContainerProps", () => {
  it("extracts Container related props from all props", () => {
    const allProps = {
      className: "canvas--responsive",
      options: {
        height: 200,
        width: 200,
      },
      position: "100,0",
      scale: 2,
      style: {
        position: "relative",
      },
    };
    const containerProps = {
      position: allProps.position,
      scale: allProps.scale,
    };
    expect(getContainerProps(allProps)).toEqual(containerProps);
  });
});
