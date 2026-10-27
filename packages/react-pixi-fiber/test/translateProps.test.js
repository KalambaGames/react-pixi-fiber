import { describe, it, expect, vi } from "vitest";
import { createInstance, diffProperties, setInitialProperties } from "../src/ReactPixiFiberComponent";
import { validateProperties } from "../src/hostOps";
import { registerAdapterBehaviors, registerComponent } from "../src/registry";
import { createFakeNode, fakePixiAdapter } from "./utils/fakePixiAdapter";

const adapter = vi.hoisted(() => ({ current: null }));

vi.mock("../src/configure", () => ({
  getPixiAdapter: () => adapter.current,
  getStackAddendum: () => "",
  getStrictModeBit: () => 8,
}));

adapter.current = fakePixiAdapter();
adapter.current.properties.numeric.push("native");
adapter.current.translateProps = (type, props) => {
  if (!("legacy" in props)) return props;
  const { legacy, ...rest } = props;
  return { ...rest, native: legacy };
};
registerAdapterBehaviors(adapter.current.behaviors);

describe("translateProps", () => {
  it("translates props on initial set and on both sides of a diff, and hands raw props to applyProps", () => {
    const instance = createFakeNode("Sprite");
    setInitialProperties("Sprite", instance, { legacy: 1 });
    expect(instance.native).toBe(1);
    expect(instance.legacy).toBeUndefined();
    expect(diffProperties("Sprite", instance, { legacy: 1 }, { legacy: 2 })).toEqual(["native", 2]);
    const applyProps = vi.fn();
    registerComponent("Custom", { create: () => createFakeNode("Custom"), applyProps });
    const custom = createInstance("Custom", { legacy: 3 });
    setInitialProperties("Custom", custom, { legacy: 3 });
    expect(applyProps).toHaveBeenCalledWith(custom, undefined, { legacy: 3 });
  });

  it("validates the translated props", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    // `native` is numeric in the table and `legacy` is untyped, so only the translated name gets a type warning.
    validateProperties("Sprite", { legacy: true }, { mode: 8, return: null });
    const warnings = error.mock.calls.filter(c => /Invalid value for prop `native` on `<Sprite \/>`/.test(c[0]));
    expect(warnings).toHaveLength(__DEV__ ? 1 : 0);
    error.mockRestore();
  });
});
