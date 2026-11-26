import * as PIXI from "pixi.js";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import { Container, render, Text, unmount } from "../src/index";

describe("render and unmount", () => {
  it("renders synchronously into a PixiJS container and unmounts it", () => {
    const stage = new PIXI.Container();
    render(
      <Container>
        <Text text="Hello" />
      </Container>,
      stage
    );
    expect(stage.children).toHaveLength(1);
    expect(stage.children[0].children[0]).toBeInstanceOf(PIXI.Text);
    unmount(stage);
    expect(stage.children).toHaveLength(0);
  });

  it("returns false and warns once in development when unmounting a container that was never rendered into", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(unmount(new PIXI.Container())).toBe(false);
    expect(error.mock.calls.filter(c => /did not render into container provided/.test(c[0]))).toHaveLength(
      __DEV__ ? 1 : 0
    );
    error.mockRestore();
  });

  it("returns false without throwing when configure was never called", async () => {
    vi.resetModules();
    const { unmount: freshUnmount } = await import("../src/render");
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(freshUnmount({})).toBe(false);
    expect(error.mock.calls.filter(c => /did not render into container provided/.test(c[0]))).toHaveLength(
      __DEV__ ? 1 : 0
    );
    error.mockRestore();
  });

  it("returns true for every unmount of a container that was rendered into", () => {
    const stage = new PIXI.Container();
    render(<Container />, stage);
    expect(unmount(stage)).toBe(true);
    expect(unmount(stage)).toBe(true);
  });

  it("calls the callback after commit", () => {
    const callback = vi.fn();
    render(<Container />, new PIXI.Container(), callback);
    expect(callback).toHaveBeenCalledTimes(1);
  });
});
