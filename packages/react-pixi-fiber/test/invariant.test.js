import { describe, expect, it } from "vitest";

import invariant from "../src/invariant";

describe("invariant", () => {
  it("does nothing when the condition holds", () => {
    expect(() => invariant(true, "never %s", "shown")).not.toThrow();
  });
  it("throws the formatted message when the condition fails", () => {
    expect(() => invariant(false, "Expected `%s`, got `%s`", "string", "number")).toThrow(
      "Expected `string`, got `number`"
    );
  });
});
