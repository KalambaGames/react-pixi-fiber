import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as ReactPixiFiberComponent from "../src/ReactPixiFiberComponent";
import { createRegisteredInstance, normalizeBehavior, registerComponent } from "../src/registry";
import { setValueForProperty } from "../src/PixiPropertyOperations";

vi.mock("../src/PixiPropertyOperations", async importOriginal => ({
  ...(await importOriginal()),
  setValueForProperty: vi.fn(),
}));

const components = {
  Container: { create: vi.fn(() => ({ kind: "Container" })) },
  NineSliceSprite: { create: vi.fn(() => ({ kind: "NineSliceSprite" })) },
};
vi.mock("../src/configure", () => ({
  getPixiAdapter: () => ({
    components,
    properties: { boolean: [], numeric: [], positiveNumeric: [], vector: [], callback: [] },
    isPoint: () => false,
    copyPoint() {},
    defaults: { Defaulted: { alpha: 0.5 } },
  }),
}));

describe("createInstance", () => {
  let error;
  beforeEach(async () => {
    vi.resetModules();
    (await import("../src/registry")).registerAdapterComponents(components);
    error = vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => vi.restoreAllMocks());

  it("resolves the user registry before the adapter", async () => {
    const { registerComponent } = await import("../src/registry");
    const { createInstance } = await import("../src/ReactPixiFiberComponent");
    const user = { kind: "user" };
    registerComponent("Container", () => user);
    expect(createInstance("Container", {})).toBe(user);
    expect(createInstance("Container", {})).toBe(user);
    expect(error).toHaveBeenCalledTimes(__DEV__ ? 1 : 0); // "also defined by the adapter"
    if (__DEV__) expect(error.mock.calls[0][0]).toMatch(/`Container`.*PIXIComponent.*adapter/s);
  });
  it("resolves adapter components", async () => {
    const { createInstance } = await import("../src/ReactPixiFiberComponent");
    expect(createInstance("Container", { a: 1 })).toEqual({ kind: "Container" });
    expect(components.Container.create).toHaveBeenCalledWith({ a: 1 });
    expect(error).not.toHaveBeenCalled();
  });
  it("maps the deprecated NineSlicePlane tag to NineSliceSprite and warns once", async () => {
    const { createInstance } = await import("../src/ReactPixiFiberComponent");
    expect(createInstance("NineSlicePlane", {})).toEqual({ kind: "NineSliceSprite" });
    expect(createInstance("NineSlicePlane", {})).toEqual({ kind: "NineSliceSprite" });
    expect(error).toHaveBeenCalledTimes(__DEV__ ? 1 : 0);
    if (__DEV__) expect(error.mock.calls[0][0]).toMatch(/NineSlicePlane.*NineSliceSprite/s);
  });
  it("throws for an unknown tag naming the tag and configure", async () => {
    const { createInstance } = await import("../src/ReactPixiFiberComponent");
    expect(() => createInstance("Nope", {})).toThrow(/`Nope`.*PIXIComponent.*configure/s);
  });
});

describe("ReactPixiFiber", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("setInitialProperties", () => {
    const instance = {};
    const type = "type";
    const rawProps = { position: "0,0" };
    const rootContainer = {};
    const hostContext = {};

    // setInitialPixiProperties is internal to the module, so the tests observe what it does: call the bound
    // applyProps of a registered instance, or setValueForProperty for each prop
    it("calls the bound applyProps for registered instances with applyProps defined", () => {
      const applyProps = vi.fn();
      const instance = createRegisteredInstance(
        type,
        normalizeBehavior(type, { create: () => ({}), applyProps }),
        {},
        () => {}
      );
      ReactPixiFiberComponent.setInitialProperties(type, instance, rawProps, rootContainer, hostContext);

      expect(setValueForProperty).toHaveBeenCalledTimes(0);
      expect(applyProps).toHaveBeenCalledTimes(1);
      expect(applyProps).toHaveBeenCalledWith(instance, undefined, rawProps);
    });

    it("calls setInitialPixiProperties for registered instances without applyProps defined", () => {
      const instance = createRegisteredInstance(
        type,
        normalizeBehavior(type, () => ({})),
        {},
        () => {}
      );
      ReactPixiFiberComponent.setInitialProperties(type, instance, rawProps, rootContainer, hostContext);

      expect(setValueForProperty).toHaveBeenCalledTimes(1);
      expect(setValueForProperty).toHaveBeenCalledWith(type, instance, "position", rawProps.position);
    });

    it("calls setInitialPixiProperties for regular types", () => {
      ReactPixiFiberComponent.setInitialProperties(type, instance, rawProps, rootContainer, hostContext);

      expect(setValueForProperty).toHaveBeenCalledTimes(1);
      expect(setValueForProperty).toHaveBeenCalledWith(type, instance, "position", rawProps.position);
    });
  });

  describe("setInitialPixiProperties", () => {
    const instance = {};
    const type = "type";
    const rawProps = { children: [], position: "0,0", scale: 2 };
    const rootContainerElement = {};

    it("calls setValueForProperty for each prop that is not children", () => {
      ReactPixiFiberComponent.setInitialPixiProperties(type, instance, rawProps, rootContainerElement);
      expect(setValueForProperty).toHaveBeenCalledTimes(2);
      expect(setValueForProperty).not.toHaveBeenCalledWith(type, instance, "children", rawProps["children"]);
      expect(setValueForProperty).toHaveBeenCalledWith(type, instance, "position", rawProps["position"]);
      expect(setValueForProperty).toHaveBeenCalledWith(type, instance, "scale", rawProps["scale"]);
    });
  });

  describe("diffProperties", () => {
    const oldProps = { children: [1, 2], position: "0,0", scale: 2, text: "Hello World!" };
    const newProps = { children: [2], pivot: "0,0", scale: 2, text: "Goodbye World!" };

    it("returns null if props did not change", () => {
      expect(ReactPixiFiberComponent.diffProperties("Text", {}, {}, {})).toBeNull();
    });

    it("returns changed prop keys and values list if props changed", () => {
      expect(ReactPixiFiberComponent.diffProperties("Text", {}, oldProps, newProps)).toEqual([
        "position",
        undefined,
        "pivot",
        "0,0",
        "text",
        "Goodbye World!",
      ]);
    });
  });

  describe("applyDisplayObjectProps", () => {
    const instance = {};
    const type = "type";
    const oldProps = { position: "0,0" };
    const newProps = { position: "1,1" };

    it("calls updatePixiProperties with update payload", () => {
      ReactPixiFiberComponent.applyDisplayObjectProps(type, instance, oldProps, newProps);

      // updatePixiProperties is internal to the module, it calls setValueForProperty for each changed prop
      expect(setValueForProperty).toHaveBeenCalledTimes(1);
      expect(setValueForProperty).toHaveBeenCalledWith(type, instance, "position", newProps.position, undefined);
    });
  });

  describe("updateProperties", () => {
    const instance = {};
    const type = "type";
    const lastRawProps = { position: "0,0" };
    const nextRawProps = { position: "1,1" };
    const updatePayload = ["position", "1,1"];
    const internalInstanceHandle = {};

    // updatePixiProperties is internal to the module, so the tests observe what it does: call the bound
    // applyProps of a registered instance, or setValueForProperty for each prop
    it("calls the bound applyProps for registered instances with applyProps defined", () => {
      const applyProps = vi.fn();
      const instance = createRegisteredInstance(
        type,
        normalizeBehavior(type, { create: () => ({}), applyProps }),
        {},
        () => {}
      );
      ReactPixiFiberComponent.updateProperties(
        type,
        instance,
        updatePayload,
        lastRawProps,
        nextRawProps,
        internalInstanceHandle
      );

      expect(setValueForProperty).toHaveBeenCalledTimes(0);
      expect(applyProps).toHaveBeenCalledTimes(1);
      expect(applyProps).toHaveBeenCalledWith(instance, lastRawProps, nextRawProps);
    });

    it("passes both props with the adapter defaults to the bound applyProps", () => {
      const applyProps = vi.fn();
      const instance = createRegisteredInstance(
        "Defaulted",
        normalizeBehavior("Defaulted", { create: () => ({}), applyProps }),
        {},
        () => {}
      );
      ReactPixiFiberComponent.setInitialProperties("Defaulted", instance, { x: 1 });
      ReactPixiFiberComponent.updateProperties("Defaulted", instance, ["x", 2], { x: 1 }, { x: 2 });

      expect(applyProps.mock.calls).toEqual([
        [instance, undefined, { x: 1, alpha: 0.5 }],
        [instance, { x: 1, alpha: 0.5 }, { x: 2, alpha: 0.5 }],
      ]);
    });

    it("calls updatePixiProperties for registered instances without applyProps defined", () => {
      const instance = createRegisteredInstance(
        type,
        normalizeBehavior(type, () => ({})),
        {},
        () => {}
      );
      ReactPixiFiberComponent.updateProperties(
        type,
        instance,
        updatePayload,
        lastRawProps,
        nextRawProps,
        internalInstanceHandle
      );

      expect(setValueForProperty).toHaveBeenCalledTimes(1);
      expect(setValueForProperty).toHaveBeenCalledWith(
        type,
        instance,
        "position",
        nextRawProps.position,
        internalInstanceHandle
      );
    });

    it("calls updatePixiProperties for regular types", () => {
      ReactPixiFiberComponent.updateProperties(
        type,
        instance,
        updatePayload,
        lastRawProps,
        nextRawProps,
        internalInstanceHandle
      );

      expect(setValueForProperty).toHaveBeenCalledTimes(1);
      expect(setValueForProperty).toHaveBeenCalledWith(
        type,
        instance,
        "position",
        nextRawProps.position,
        internalInstanceHandle
      );
    });
  });

  describe("applyProps", () => {
    it("applyProps delegates to the component's applyProps or to the Display Object pipeline", () => {
      const custom = vi.fn();
      registerComponent("WithApply", { create: () => ({ kind: "custom" }), applyProps: custom });
      registerComponent("Plain", () => ({ kind: "plain" }));
      const a = ReactPixiFiberComponent.createInstance("WithApply", {});
      ReactPixiFiberComponent.applyProps(a, { x: 1 }, { x: 2 });
      expect(custom).toHaveBeenCalledWith(a, { x: 1 }, { x: 2 });
      const b = ReactPixiFiberComponent.createInstance("Plain", {});
      ReactPixiFiberComponent.applyProps(b, undefined, { x: 3 });
      expect(setValueForProperty).toHaveBeenCalledWith("Plain", b, "x", 3, undefined);
      expect(() => ReactPixiFiberComponent.applyProps({}, {}, {})).toThrow("react-pixi-fiber created");
    });

    it("passes both props with the adapter defaults to the component's applyProps, as a commit does", () => {
      const custom = vi.fn();
      registerComponent("Defaulted", { create: () => ({}), applyProps: custom });
      const instance = ReactPixiFiberComponent.createInstance("Defaulted", {});
      ReactPixiFiberComponent.applyProps(instance, {}, { x: 1 });
      expect(custom).toHaveBeenLastCalledWith(instance, { alpha: 0.5 }, { x: 1, alpha: 0.5 });
    });
  });

  describe("updatePixiProperties", () => {
    const instance = {};
    const type = "type";
    const lastRawProps = { children: [1, 2], position: "0,0", scale: 2 };
    const nextRawProps = { children: [2], position: "1,1", scale: 1 };
    const updatePayload = ["children", [2], "position", "1,1", "scale", 1];
    const internalInstanceHandle = {};

    it("calls setValueForProperty for each prop that is not children", () => {
      ReactPixiFiberComponent.updatePixiProperties(
        type,
        instance,
        updatePayload,
        lastRawProps,
        nextRawProps,
        internalInstanceHandle
      );
      expect(setValueForProperty).toHaveBeenCalledTimes(2);
      expect(setValueForProperty).not.toHaveBeenCalledWith(
        type,
        instance,
        "children",
        nextRawProps["children"],
        internalInstanceHandle
      );
      expect(setValueForProperty).toHaveBeenCalledWith(
        type,
        instance,
        "position",
        nextRawProps["position"],
        internalInstanceHandle
      );
      expect(setValueForProperty).toHaveBeenCalledWith(
        type,
        instance,
        "scale",
        nextRawProps["scale"],
        internalInstanceHandle
      );
    });
  });
});
