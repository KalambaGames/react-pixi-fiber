import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("PIXIComponent", () => {
  let mod;
  let error;
  beforeEach(async () => {
    vi.resetModules();
    mod = await import("../src/PIXIComponent");
    error = vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => vi.restoreAllMocks());

  it("registers and returns the type", () => {
    expect(mod.PIXIComponent("Thing", () => ({}))).toBe("Thing");
  });
  it("throws when the first argument is not a string, so the 2.x order fails loudly", () => {
    expect(() => mod.PIXIComponent(() => ({}), "Thing")).toThrow("PIXIComponent(type, behavior)");
  });
  it("CustomPIXIComponent keeps the 2.x argument order and warns once", () => {
    expect(mod.CustomPIXIComponent(() => ({}), "A")).toBe("A");
    expect(mod.CustomPIXIComponent(() => ({}), "B")).toBe("B");
    expect(error).toHaveBeenCalledTimes(__DEV__ ? 1 : 0);
    if (__DEV__) expect(error.mock.calls[0][0]).toMatch(/CustomPIXIComponent.*PIXIComponent\(type, behavior\)/s);
  });
  it("CustomPIXIProperty delegates to PIXIProperty and warns once", async () => {
    const { customProperties } = await import("../src/PixiProperty");
    mod.CustomPIXIProperty("Sprite", "foo", () => true);
    mod.CustomPIXIProperty("Sprite", "bar");
    if (__DEV__) {
      expect(customProperties.Sprite.foo).toBeDefined();
      expect(customProperties.Sprite.bar).toBeDefined();
      expect(error).toHaveBeenCalledTimes(1);
    } else {
      // PIXIProperty is a no-op in production: nothing is registered and nothing is logged.
      expect(customProperties.Sprite).toBeUndefined();
      expect(error).not.toHaveBeenCalled();
    }
  });
  it("PIXIProperty with no type registers the property under `*`", async () => {
    const { customProperties, getCustomPropertyInfo } = await import("../src/PixiProperty");
    mod.PIXIProperty(null, "zOrder");
    if (__DEV__) {
      expect(customProperties["*"].zOrder).toBeDefined();
      expect(getCustomPropertyInfo("zOrder", "AnyTag")).toBe(customProperties["*"].zOrder);
      expect(() => mod.PIXIProperty(undefined, "zOrder")).toThrow("already registered");
    } else {
      expect(customProperties["*"]).toBeUndefined();
    }
  });
  it("PIXIProperty accepts a name inherited from Object.prototype and rejects a second registration", () => {
    mod.PIXIProperty("Sprite", "foo");
    expect(() => mod.PIXIProperty("Sprite", "constructor")).not.toThrow();
    if (__DEV__) expect(() => mod.PIXIProperty("Sprite", "constructor")).toThrow("already registered");
  });
});
