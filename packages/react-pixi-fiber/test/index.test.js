import { describe, expect, it } from "vitest";

import { AppContext, AppProvider, withApp } from "../src/AppProvider";
import { usePixiApp, usePixiTicker } from "../src/hooks";
import * as ReactPixiFiber from "../src/index";
import { CustomPIXIComponent, CustomPIXIProperty, PIXIComponent, PIXIProperty } from "../src/PIXIComponent";
import { applyDisplayObjectProps, applyProps } from "../src/ReactPixiFiberComponent";
import { getInstanceTag } from "../src/registry";
import Stage, { createStageClass } from "../src/Stage";
import { TAGS } from "../src/tags";

describe("ReactPixiFiber public API", () => {
  it("should match snapshot", () => {
    expect(ReactPixiFiber).toMatchSnapshot();
  });

  it("provides expected utils", () => {
    expect(ReactPixiFiber.PIXIComponent).toEqual(PIXIComponent);
    expect(ReactPixiFiber.PIXIProperty).toEqual(PIXIProperty);
    expect(ReactPixiFiber.CustomPIXIComponent).toEqual(CustomPIXIComponent);
    expect(ReactPixiFiber.CustomPIXIProperty).toEqual(CustomPIXIProperty);
    expect(ReactPixiFiber.applyDisplayObjectProps).toEqual(applyDisplayObjectProps);
    expect(ReactPixiFiber.applyProps).toEqual(applyProps);
    expect(ReactPixiFiber.getInstanceTag).toEqual(getInstanceTag);
    expect(ReactPixiFiber.createStageClass).toEqual(createStageClass);
    expect(typeof ReactPixiFiber.render).toEqual("function");
    expect(typeof ReactPixiFiber.unmount).toEqual("function");
  });

  it("provides expected context utils", () => {
    expect(ReactPixiFiber.AppContext).toEqual(AppContext);
    expect(ReactPixiFiber.AppProvider).toEqual(AppProvider);
    expect(ReactPixiFiber.withApp).toEqual(withApp);
  });

  it("provides expected hooks", () => {
    expect(ReactPixiFiber.usePixiApp).toEqual(usePixiApp);
    expect(ReactPixiFiber.usePixiTicker).toEqual(usePixiTicker);
  });

  it("provides expected components", () => {
    for (const tag of Object.keys(TAGS)) expect(ReactPixiFiber[tag], tag).toEqual(TAGS[tag]);
    expect(ReactPixiFiber.NineSlicePlane).toEqual("NineSlicePlane");
    expect(ReactPixiFiber.Stage).toEqual(Stage);
  });
});
