import { describe, it, expect, vi, beforeEach } from "vitest";

describe("PIXIFilter", () => {
  let mod;
  beforeEach(async () => {
    vi.resetModules();
    mod = await import("../src/PIXIFilter");
  });

  it("registers the type with kind filter, from a function or an object", async () => {
    const { getUserComponent } = await import("../src/registry");
    const A = mod.PIXIFilter("FilterA", () => ({ a: true }));
    const B = mod.PIXIFilter("FilterB", { create: () => ({ b: true }) });
    expect(A).toBe("FilterA");
    expect(B).toBe("FilterB");
    expect(getUserComponent("FilterA").kind).toBe("filter");
    expect(getUserComponent("FilterB").kind).toBe("filter");
  });
  it("throws for a type that is not a string", () => {
    expect(() => mod.PIXIFilter(1, () => ({}))).toThrow(
      "Invalid argument `type` of type `number` supplied to `PIXIFilter`"
    );
  });
});
