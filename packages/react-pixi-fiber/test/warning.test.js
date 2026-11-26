import { afterEach, describe, expect, it, vi } from "vitest";

import warning from "../src/warning";

describe("warning", () => {
  afterEach(() => vi.restoreAllMocks());
  it("logs the formatted message with console.error when the condition fails", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    warning(false, "Prop `%s` on `<%s />`", "x", "Sprite");
    expect(error).toHaveBeenCalledWith("Warning: Prop `x` on `<Sprite />`");
  });
  it("is silent when the condition holds", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    warning(true, "never");
    expect(error).not.toHaveBeenCalled();
  });
});
