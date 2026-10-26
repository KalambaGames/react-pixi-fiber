import { describe, it, expect, vi, afterEach } from "vitest";
import * as PIXI from "pixi.js";
import * as PixiPropertyOperations from "../src/PixiPropertyOperations";
import { setValueForProperty } from "../src/PixiPropertyOperations";
import * as hostOps from "../src/hostOps";
import { createRegisteredInstance, normalizeBehavior } from "../src/registry";
import { shouldIgnoreAttribute, shouldRemoveAttribute } from "../src/PixiProperty";
import { setPixiValue } from "../src/utils";
import { getPixiAdapter } from "../src/configure";
import { strictModeBit } from "@react-pixi-fiber/react-18";

// The mocks call the real implementations unless a test overrides them; `mockReset` restores that.
vi.mock("../src/PixiProperty", async importOriginal => {
  const actual = await importOriginal();
  return {
    ...actual,
    shouldIgnoreAttribute: vi.fn(actual.shouldIgnoreAttribute),
    shouldRemoveAttribute: vi.fn(actual.shouldRemoveAttribute),
  };
});
vi.mock("../src/utils", async importOriginal => {
  const actual = await importOriginal();
  return { ...actual, setPixiValue: vi.fn(actual.setPixiValue) };
});

// Fresh modules whose adapter has the given `defaults` override. The adapter has no `NineSlicePlane` alias, so the
// core's deprecated tag map is what resolves that tag.
async function withDefaults(defaults) {
  vi.resetModules();
  vi.doMock("../src/configure", async () => {
    const pixi = (await vi.importActual("@react-pixi-fiber/pixi-6")).default();
    const { NineSlicePlane, ...components } = pixi.components;
    const adapter = { ...pixi, components };
    const { registerAdapterComponents } = await import("../src/registry");
    registerAdapterComponents(components);
    return { getPixiAdapter: () => ({ ...adapter, defaults }), getStrictModeBit: () => strictModeBit };
  });
  return {
    ...(await import("../src/hostOps")),
    ...(await import("../src/PixiPropertyOperations")),
    ...(await import("../src/ReactPixiFiberComponent")),
    ...(await import("../src/PIXIComponent")),
  };
}

describe("PixiPropertyOperations", () => {
  afterEach(() => {
    setPixiValue.mockReset();
    shouldIgnoreAttribute.mockReset();
    shouldRemoveAttribute.mockReset();
    vi.doUnmock("../src/configure");
    vi.restoreAllMocks();
  });

  describe("setValueForProperty", () => {
    it("should not call setPixiValue if property should be ignored", () => {
      shouldIgnoreAttribute.mockImplementation(() => true);
      PixiPropertyOperations.setValueForProperty("Sprite", {}, "ignoredProp", "unsetValue");
      expect(setPixiValue).toHaveBeenCalledTimes(0);
    });

    it("should call setPixiValue with default value if property should be removed and default is available", () => {
      const instance = { roundPixels: false };
      shouldRemoveAttribute.mockImplementation(() => true);
      PixiPropertyOperations.setValueForProperty("Sprite", instance, "roundPixels", undefined);
      expect(setPixiValue).toHaveBeenCalledTimes(1);
      expect(setPixiValue).toHaveBeenCalledWith(instance, "roundPixels", false, getPixiAdapter());
    });

    it("should not call setPixiValue if property should be removed and default is not available", () => {
      shouldRemoveAttribute.mockImplementation(() => true);
      PixiPropertyOperations.setValueForProperty("Sprite", {}, "unknownProp", undefined);
      expect(setPixiValue).toHaveBeenCalledTimes(0);
    });

    it("should not call setPixiValue if property should be removed and defaults are not available", () => {
      shouldRemoveAttribute.mockImplementation(() => true);
      PixiPropertyOperations.setValueForProperty("UnknownType", {}, "unknownProp", undefined);
      expect(setPixiValue).toHaveBeenCalledTimes(0);
    });

    it("should call setPixiValue with provided value if property should not be removed", () => {
      const instance = {};
      PixiPropertyOperations.setValueForProperty("Sprite", instance, "roundPixels", true);
      expect(setPixiValue).toHaveBeenCalledTimes(1);
      expect(setPixiValue).toHaveBeenCalledWith(instance, "roundPixels", true, getPixiAdapter());
    });
  });

  describe("resetting a prop to its default", () => {
    it("restores the value PixiJS had before the first write", () => {
      const sprite = new PIXI.Sprite(PIXI.Texture.WHITE);
      setValueForProperty("Sprite", sprite, "alpha", 0.5);
      setValueForProperty("Sprite", sprite, "alpha", undefined);
      expect(sprite.alpha).toBe(1);
      setValueForProperty("Sprite", sprite, "blendMode", PIXI.BLEND_MODES.ADD);
      setValueForProperty("Sprite", sprite, "blendMode", undefined);
      expect(sprite.blendMode).toBe(PIXI.BLEND_MODES.NORMAL);
    });
    it("restores a point from the recorded { x, y }", () => {
      const sprite = new PIXI.Sprite(PIXI.Texture.WHITE);
      setValueForProperty("Sprite", sprite, "scale", [2, 3]);
      setValueForProperty("Sprite", sprite, "scale", undefined);
      expect([sprite.scale.x, sprite.scale.y]).toEqual([1, 1]);
    });
    it("restores a constructor-consumed prop to the initial prop value", () => {
      const text = new PIXI.Text("hello");
      setValueForProperty("Text", text, "text", "hello");
      setValueForProperty("Text", text, "text", "changed");
      setValueForProperty("Text", text, "text", undefined);
      expect(text.text).toBe("hello");
    });
    it("prefers the adapter defaults override over the recorded value", async () => {
      vi.resetModules();
      vi.doMock("../src/configure", async () => {
        const adapter = (await vi.importActual("@react-pixi-fiber/pixi-6")).default();
        return {
          getPixiAdapter: () => ({ ...adapter, defaults: { Sprite: { alpha: 0.25 } } }),
          getStrictModeBit: () => strictModeBit,
        };
      });
      const { setValueForProperty } = await import("../src/PixiPropertyOperations");
      const sprite = new PIXI.Sprite(PIXI.Texture.WHITE);
      setValueForProperty("Sprite", sprite, "alpha", 0.5);
      setValueForProperty("Sprite", sprite, "alpha", undefined);
      expect(sprite.alpha).toBe(0.25);
      vi.doUnmock("../src/configure");
    });
    it("warns under StrictMode about an invalid value it resets, not about an undefined one", () => {
      const error = vi.spyOn(console, "error").mockImplementation(() => {});
      const strict = { mode: strictModeBit, return: null };
      const sprite = new PIXI.Sprite(PIXI.Texture.WHITE);
      setValueForProperty("Sprite", sprite, "alpha", 0.5, strict);
      setValueForProperty("Sprite", sprite, "alpha", undefined, strict);
      expect(error).not.toHaveBeenCalled();
      setValueForProperty("Sprite", sprite, "alpha", -1, strict);
      expect(sprite.alpha).toBe(1);
      const warnings = error.mock.calls.filter(c => /Received `-1` for prop `alpha`/.test(String(c[0])));
      expect(warnings).toHaveLength(__DEV__ ? 1 : 0);
    });
    it("warns once for each prop name about invalid values", () => {
      const error = vi.spyOn(console, "error").mockImplementation(() => {});
      const strict = { mode: strictModeBit, return: null };
      const first = new PIXI.Sprite(PIXI.Texture.WHITE);
      const second = new PIXI.Sprite(PIXI.Texture.WHITE);
      setValueForProperty("Sprite", first, "rotation", "spin", strict);
      setValueForProperty("Sprite", first, "rotation", "spin", strict);
      setValueForProperty("Sprite", second, "rotation", "turn", strict);
      const warnings = error.mock.calls.filter(c => /for prop `rotation`/.test(String(c[0])));
      expect(warnings).toHaveLength(__DEV__ ? 1 : 0);
    });
    it("resets an invalid value of a point prop that the adapter table does not list", () => {
      const error = vi.spyOn(console, "error").mockImplementation(() => {});
      const strict = { mode: strictModeBit, return: null };
      const instance = new PIXI.Container();
      instance.offset = new PIXI.Point(1, 2);
      setValueForProperty("Container", instance, "offset", "a,b", strict);
      expect([instance.offset.x, instance.offset.y]).toEqual([1, 2]);
      setValueForProperty("Container", instance, "offset", [3, 4, 5], strict);
      expect([instance.offset.x, instance.offset.y]).toEqual([1, 2]);
      const warnings = error.mock.calls.filter(c => /for prop `offset`/.test(String(c[0])));
      expect(warnings).toHaveLength(__DEV__ ? 1 : 0);
    });
    it("writes null to a point prop and lets the PixiJS setter throw", () => {
      const sprite = new PIXI.Sprite(PIXI.Texture.WHITE);
      expect(() => setValueForProperty("Sprite", sprite, "scale", null)).toThrow(TypeError);
      const instance = new PIXI.Container();
      instance.offset = new PIXI.Point(1, 2);
      setValueForProperty("Container", instance, "offset", null);
      expect(instance.offset).toBeNull();
    });
    it("writes null to a callback prop without a warning", () => {
      const error = vi.spyOn(console, "error").mockImplementation(() => {});
      const strict = { mode: strictModeBit, return: null };
      const sprite = new PIXI.Sprite(PIXI.Texture.WHITE);
      setValueForProperty("Sprite", sprite, "click", () => {}, strict);
      setValueForProperty("Sprite", sprite, "click", null, strict);
      expect(sprite.click).toBeNull();
      expect(error).not.toHaveBeenCalled();
    });
    it("ignores an undefined value when nothing was recorded and no override exists", () => {
      const instance = new PIXI.Container();
      setValueForProperty("Container", instance, "nothingHere", undefined);
      expect("nothingHere" in instance).toBe(false);
    });
    it("clears a prop whose recorded default is undefined", () => {
      const instance = new PIXI.Container();
      setValueForProperty("Container", instance, "custom", "set");
      setValueForProperty("Container", instance, "custom", undefined);
      expect("custom" in instance).toBe(true);
      expect(instance.custom).toBeUndefined();
    });
    it("reads the override of the tag a deprecated tag maps to", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      const m = await withDefaults({ NineSliceSprite: { alpha: 0.25 } });
      const texture = PIXI.Texture.WHITE;
      const plane = m.createInstance("NineSlicePlane", {
        texture,
        leftWidth: 1,
        topHeight: 1,
        rightWidth: 1,
        bottomHeight: 1,
      });
      m.setValueForProperty("NineSlicePlane", plane, "alpha", 0.5);
      m.setValueForProperty("NineSlicePlane", plane, "alpha", undefined);
      expect(plane.alpha).toBe(0.25);
    });
    it("reads the override of the tag a user registered, without mapping it", async () => {
      const m = await withDefaults({ NineSliceSprite: { alpha: 0.25 }, NineSlicePlane: { alpha: 0.75 } });
      m.PIXIComponent("NineSlicePlane", { create: () => new PIXI.Container() });
      const instance = m.createInstance("NineSlicePlane", {});
      m.setValueForProperty("NineSlicePlane", instance, "alpha", 0.5);
      m.setValueForProperty("NineSlicePlane", instance, "alpha", undefined);
      expect(instance.alpha).toBe(0.75);
    });
  });

  describe("adapter defaults at construction", () => {
    const mount = (m, type, props) => {
      const instance = m.createInstance(type, props);
      m.setInitialProperties(type, instance, props);
      return instance;
    };

    it("fills a prop that is missing or undefined", async () => {
      const m = await withDefaults({ Sprite: { alpha: 0.5 } });
      expect(mount(m, "Sprite", {}).alpha).toBe(0.5);
      expect(mount(m, "Sprite", { alpha: undefined }).alpha).toBe(0.5);
      expect(mount(m, "Sprite", { alpha: 0.25 }).alpha).toBe(0.25);
    });
    it("mounts with the value a removal resets to", async () => {
      const m = await withDefaults({ Sprite: { alpha: 0.5 } });
      const instance = mount(m, "Sprite", { alpha: 1 });
      m.setValueForProperty("Sprite", instance, "alpha", undefined);
      expect(instance.alpha).toBe(mount(m, "Sprite", {}).alpha);
    });
    it("keeps the default of visible when a hidden instance is revealed", async () => {
      const m = await withDefaults({ Sprite: { visible: false } });
      const instance = mount(m, "Sprite", {});
      m.hideInstance(instance);
      m.unhideInstance(instance, {});
      expect(instance.visible).toBe(false);
      m.unhideInstance(instance, { visible: true });
      expect(instance.visible).toBe(true);
    });
    it("passes the filled props to create", async () => {
      const m = await withDefaults({ Text: { text: "default" } });
      expect(m.createInstance("Text", {}).text).toBe("default");
    });
    it("keeps an explicit null", async () => {
      const m = await withDefaults({ Custom: { value: 1 } });
      const create = vi.fn(() => new PIXI.Container());
      m.PIXIComponent("Custom", { create });
      m.createInstance("Custom", { value: null });
      expect(create).toHaveBeenCalledWith({ value: null });
    });
    it("fills the props of a PIXIComponent tag, its own applyProps included", async () => {
      const m = await withDefaults({ Custom: { value: 1 } });
      const create = vi.fn(() => new PIXI.Container());
      const applyProps = vi.fn();
      m.PIXIComponent("Custom", { create, applyProps });
      mount(m, "Custom", { other: 2 });
      expect(create).toHaveBeenCalledWith({ other: 2, value: 1 });
      expect(applyProps).toHaveBeenCalledWith(expect.anything(), undefined, { other: 2, value: 1 });
    });
    it("leaves the props unchanged without a defaults entry", async () => {
      const m = await withDefaults(undefined);
      const props = {};
      const create = vi.fn(() => new PIXI.Container());
      m.PIXIComponent("Custom", { create });
      m.createInstance("Custom", props);
      expect(create.mock.calls[0][0]).toBe(props);
      expect(mount(m, "Sprite", {}).alpha).toBe(1);
    });
  });

  describe("a filters prop next to filter children", () => {
    const message = "`<Sprite />` has both a `filters` prop and filter children.";
    const filterInstance = () =>
      createRegisteredInstance(
        "F",
        normalizeBehavior("F", { create: () => ({ destroy: vi.fn(), enabled: true }), kind: "filter" }),
        {},
        () => {}
      );

    it("throws when the filters prop is written on a parent with filter children, also on the first write", () => {
      const sprite = new PIXI.Sprite();
      hostOps.appendChild(sprite, filterInstance());
      expect(() => setValueForProperty("Sprite", sprite, "filters", [new PIXI.filters.AlphaFilter()])).toThrow(message);
    });

    it("throws on a later filters value after a skipped removal", () => {
      const sprite = new PIXI.Sprite();
      hostOps.appendChild(sprite, filterInstance());
      setValueForProperty("Sprite", sprite, "filters", undefined);
      expect(() => setValueForProperty("Sprite", sprite, "filters", [])).toThrow(message);
    });

    it("skips a null or undefined filters write on a parent with filter children", () => {
      const sprite = new PIXI.Sprite();
      const f = filterInstance();
      hostOps.appendChild(sprite, f);
      for (const value of [undefined, null]) {
        expect(() => setValueForProperty("Sprite", sprite, "filters", value)).not.toThrow();
        expect(sprite.filters).toHaveLength(1);
        expect(sprite.filters[0]).toBe(f);
      }
    });

    it("warns under StrictMode about an update of a prop the filter did not have before the first write", () => {
      const error = vi.spyOn(console, "error").mockImplementation(() => {});
      const strict = { mode: strictModeBit, return: null };
      const filter = createRegisteredInstance(
        "Noise",
        normalizeBehavior("Noise", { create: () => ({ destroy: vi.fn(), enabled: true, noise: 0 }), kind: "filter" }),
        {},
        () => {}
      );
      setValueForProperty("Noise", filter, "seed", 1);
      setValueForProperty("Noise", filter, "noise", 0.5);
      setValueForProperty("Noise", filter, "enabled", false);
      expect(error).not.toHaveBeenCalled();
      setValueForProperty("Noise", filter, "noise", 0.75, strict);
      setValueForProperty("Noise", filter, "enabled", true, strict);
      expect(error).not.toHaveBeenCalled();
      setValueForProperty("Noise", filter, "seed", 2, strict);
      setValueForProperty("Noise", filter, "seed", 3, strict);
      const warnings = error.mock.calls.filter(c => /reads `seed` only in its constructor/.test(String(c[0])));
      expect(warnings).toHaveLength(__DEV__ ? 1 : 0);
    });

    it("throws when the first filter child mounts on a parent with a filters value", () => {
      const sprite = createRegisteredInstance(
        "Sprite",
        normalizeBehavior("Sprite", { create: () => new PIXI.Sprite() }),
        {},
        () => {}
      );
      setValueForProperty("Sprite", sprite, "filters", [new PIXI.filters.AlphaFilter()]);
      expect(() => hostOps.appendChild(sprite, filterInstance())).toThrow(message);
    });

    it("takes a filters value after the filter children are removed", () => {
      const sprite = new PIXI.Sprite();
      const f = filterInstance();
      const alpha = new PIXI.filters.AlphaFilter();
      hostOps.appendChild(sprite, f);
      hostOps.removeChild(sprite, f);
      setValueForProperty("Sprite", sprite, "filters", [alpha]);
      expect(sprite.filters).toHaveLength(1);
      expect(sprite.filters[0]).toBe(alpha);
    });
  });
});
