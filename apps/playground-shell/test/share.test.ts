import { describe, expect, it } from "vitest";
import { buildHash, decodeCode, encodeCode, hashCode, parseHash } from "../src/share";

describe("share codec", () => {
  it("round-trips a large string with non-ASCII text as base64url", async () => {
    const code = 'export default () => <Text text="zażółć gęślą jaźń 日本語 🎉" />;\n'.repeat(60);
    expect(code.length).toBeGreaterThan(3000);
    const encoded = await encodeCode(code);
    expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(await decodeCode(encoded)).toBe(code);
  });

  it("rejects bad data", async () => {
    await expect(decodeCode("not-valid")).rejects.toThrow();
    const encoded = await encodeCode("some reasonably long code ".repeat(100));
    await expect(decodeCode(encoded.slice(0, Math.floor(encoded.length / 2)))).rejects.toThrow();
  });

  it("parses and builds hashes", () => {
    expect(parseHash("#sprite&code=abc")).toEqual({ exampleId: "sprite", code: "abc" });
    expect(parseHash("sprite")).toEqual({ exampleId: "sprite", code: null });
    expect(parseHash("")).toEqual({ exampleId: null, code: null });
    expect(buildHash("sprite", "abc")).toBe("#sprite&code=abc");
    expect(buildHash("sprite")).toBe("#sprite");
    expect(parseHash(buildHash("sprite", "abc"))).toEqual({ exampleId: "sprite", code: "abc" });
  });

  it("hashes with FNV-1a 32-bit", () => {
    expect(hashCode("")).toBe("811c9dc5");
    expect(hashCode("a")).toBe("e40c292c");
  });
});
