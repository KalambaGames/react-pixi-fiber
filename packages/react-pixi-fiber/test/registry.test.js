import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("registry", () => {
  let registry;
  let error;
  beforeEach(async () => {
    vi.resetModules();
    registry = await import("../src/registry");
    error = vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => vi.restoreAllMocks());

  it("accepts a bare function as create", () => {
    const create = vi.fn(() => ({}));
    registry.registerComponent("Thing", create);
    expect(registry.getUserComponent("Thing").create).toBe(create);
  });

  it("maps the 2.x behavior keys to the new keys and warns once per key in development", () => {
    const legacy = {
      customDisplayObject: vi.fn(() => ({})),
      customApplyProps: vi.fn(),
      customDidAttach: vi.fn(),
      customWillDetach: vi.fn(),
    };
    registry.registerComponent("Legacy", legacy);
    const behavior = registry.getUserComponent("Legacy");
    expect(behavior.create).toBe(legacy.customDisplayObject);
    expect(behavior.applyProps).toBe(legacy.customApplyProps);
    expect(behavior.afterAdd).toBe(legacy.customDidAttach);
    expect(behavior.beforeRemove).toBe(legacy.customWillDetach);
    registry.registerComponent("Legacy2", legacy);
    expect(error).toHaveBeenCalledTimes(__DEV__ ? 4 : 0);
    if (__DEV__) expect(error.mock.calls.map(c => c[0]).join("\n")).toMatch(/customDisplayObject.*create/s);
  });

  it("throws when the behavior has no create", () => {
    expect(() => registry.registerComponent("Broken", {})).toThrow("Broken");
  });

  it("binds applyProps with applyDisplayObjectProps in this, and keeps afterAdd/beforeRemove off the instance", () => {
    const apply = vi.fn();
    const behavior = {
      create: () => ({}),
      applyProps() {
        return this;
      },
      afterAdd: vi.fn(),
      beforeRemove: vi.fn(),
    };
    const instance = registry.createRegisteredInstance("T", registry.normalizeBehavior("T", behavior), { a: 1 }, apply);
    const bound = registry.getBoundBehavior(instance);
    const context = bound.applyProps(instance, { a: 1 }, { a: 2 });
    context.applyDisplayObjectProps({ a: 1 }, { a: 2 });
    expect(apply).toHaveBeenCalledWith("T", instance, { a: 1 }, { a: 2 });
    expect(bound.afterAdd).toBe(behavior.afterAdd);
    expect(bound.beforeRemove).toBe(behavior.beforeRemove);
    expect(bound.tag).toBe("T");
    expect(registry.getInstanceTag(instance)).toBe("T");
    expect(instance._customApplyProps).toBeUndefined();
  });

  it("binds the child operations of a parent", () => {
    const behavior = { appendChild: vi.fn(), create: () => ({}), insertBefore: vi.fn(), removeChild: vi.fn() };
    const instance = registry.createRegisteredInstance("T", registry.normalizeBehavior("T", behavior), {}, vi.fn());
    const bound = registry.getBoundBehavior(instance);
    expect(bound.appendChild).toBe(behavior.appendChild);
    expect(bound.insertBefore).toBe(behavior.insertBefore);
    expect(bound.removeChild).toBe(behavior.removeChild);
    const plain = registry.getBoundBehavior(
      registry.createRegisteredInstance("U", registry.normalizeBehavior("U", { create: () => ({}) }), {}, vi.fn())
    );
    expect(plain).toEqual({ tag: "U" });
  });

  it("resolves the user entry before the adapter entry and names the source", () => {
    const adapter = { create: () => ({}) };
    const user = { create: () => ({}) };
    registry.registerAdapterBehaviors({ Sprite: adapter, Text: () => ({}) });
    expect(registry.resolveComponent("Sprite")).toEqual({ behavior: adapter, source: "adapter" });
    registry.registerComponent("Sprite", user);
    expect(registry.resolveComponent("Sprite")).toEqual({ behavior: user, source: "user" });
    expect(registry.getAdapterComponent("Sprite")).toEqual(adapter);
    expect(registry.resolveComponent("Nope")).toBeUndefined();
    expect(registry.resolveComponent("constructor")).toBeUndefined();
  });

  it("registerAdapterBehaviors normalizes every entry and replaces the previous set", () => {
    const create = () => ({});
    registry.registerAdapterBehaviors({ Text: create });
    expect(registry.getAdapterComponent("Text").create).toBe(create);
    registry.registerAdapterBehaviors({ Sprite: create });
    expect(registry.getAdapterComponent("Text")).toBeUndefined();
    expect(() => registry.registerAdapterBehaviors({ Broken: {} })).toThrow("Broken");
  });

  it("throws when create returns no object, naming the component", () => {
    for (const value of [null, undefined, 1, "x"]) {
      expect(() => registry.createRegisteredInstance("Odd", { create: () => value }, {}, () => {})).toThrow(
        "`create` of `Odd` returned"
      );
    }
  });

  it("keeps the new key when a legacy key sits next to it", () => {
    const create = () => ({});
    const legacy = () => ({});
    const behavior = registry.normalizeBehavior("Both", { create, customDisplayObject: legacy });
    expect(behavior.create).toBe(create);
    expect(behavior.customDisplayObject).toBeUndefined();
  });

  it("keeps kind through normalizeBehavior and onto the bound behavior", () => {
    const behavior = registry.normalizeBehavior("F", { create: () => ({}), kind: "filter" });
    expect(behavior.kind).toBe("filter");
    const instance = registry.createRegisteredInstance("F", behavior, {}, () => {});
    expect(registry.getBoundBehavior(instance).kind).toBe("filter");
    expect(registry.isFilterInstance(instance)).toBe(true);
    expect(registry.isFilterInstance({})).toBe(false);
  });

  it("names a filter when the create of a filter behavior returns a non-object", () => {
    const behavior = registry.normalizeBehavior("F", { create: () => 1, kind: "filter" });
    expect(() => registry.createRegisteredInstance("F", behavior, {}, () => {})).toThrow(
      "`create` of `F` returned `1`, expected a filter."
    );
  });
});
