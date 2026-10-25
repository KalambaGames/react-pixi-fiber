import { describe, expect, it } from "vitest";
import { versionHref, versions } from "../src/versions";

const [pixi4, pixi5, pixi6, pixi7, pixi8] = versions;

describe("versionHref", () => {
  it("links to the other dev server from a playground dev server", () => {
    expect(versionHref(pixi7, { hostname: "localhost", port: "5180" })).toBe("http://localhost:5170/");
    expect(versionHref(pixi8, { hostname: "localhost", port: "5170" })).toBe("http://localhost:5180/");
    expect(versionHref(pixi6, { hostname: "localhost", port: "5180" })).toBe("http://localhost:5160/");
    expect(versionHref(pixi8, { hostname: "localhost", port: "5160" })).toBe("http://localhost:5180/");
    expect(versionHref(pixi5, { hostname: "localhost", port: "5180" })).toBe("http://localhost:5150/");
    expect(versionHref(pixi4, { hostname: "localhost", port: "5180" })).toBe("http://localhost:5140/");
  });

  it("keeps the example when it switches versions", () => {
    expect(versionHref(pixi7, { hostname: "localhost", port: "5180" }, "container")).toBe(
      "http://localhost:5170/#container"
    );
    expect(versionHref(pixi8, { hostname: "example.com", port: "" }, "container")).toBe("../pixi-8/#container");
  });

  it("links to the sibling folder on the site", () => {
    expect(versionHref(pixi4, { hostname: "example.com", port: "" })).toBe("../pixi-4/");
    expect(versionHref(pixi5, { hostname: "example.com", port: "" })).toBe("../pixi-5/");
    expect(versionHref(pixi6, { hostname: "example.com", port: "" })).toBe("../pixi-6/");
    expect(versionHref(pixi7, { hostname: "example.com", port: "" })).toBe("../pixi-7/");
  });
});
