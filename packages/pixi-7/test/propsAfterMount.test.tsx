import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import * as PIXI from "pixi.js";
import react18 from "@react-pixi-fiber/react-18";
import { configure, ParticleContainer, render } from "react-pixi-fiber";
import pixi7 from "../src/index";

describe("constructor arguments changed after mount", () => {
  let root: PIXI.Container;
  beforeEach(() => {
    configure({ react: react18(), pixi: pixi7() });
    root = new PIXI.Container();
  });
  afterEach(() => vi.restoreAllMocks());

  // ParticleContainer has an `applyProps`, so React's fiber must reach the props it passes on for the warning.
  it("warns once under StrictMode when maxSize changes, and not on mount", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const warnings = () => error.mock.calls.filter(c => /reads `maxSize` only in its constructor/.test(String(c[0])));
    const show = (maxSize: number) =>
      render(
        <React.StrictMode>
          <ParticleContainer maxSize={maxSize} />
        </React.StrictMode>,
        root
      );
    show(10);
    expect(warnings()).toHaveLength(0);
    show(20);
    show(30);
    expect(warnings()).toHaveLength(__DEV__ ? 1 : 0);
  });
});
