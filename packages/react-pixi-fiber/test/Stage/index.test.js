import { afterEach, describe, expect, it, vi } from "vitest";

import Stage, { createStageClass } from "../../src/Stage";

describe("createStageClass", () => {
  afterEach(() => vi.restoreAllMocks());
  it("returns the function Stage and warns once in development", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(createStageClass()).toBe(Stage);
    expect(createStageClass()).toBe(Stage);
    expect(error).toHaveBeenCalledTimes(__DEV__ ? 1 : 0);
  });
});
