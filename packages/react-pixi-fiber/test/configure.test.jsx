import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import * as PIXI from "pixi.js";
import renderer, { act } from "react-test-renderer";
import react18 from "@react-pixi-fiber/react-18";

describe("configure", () => {
  let error;
  beforeEach(() => {
    vi.resetModules();
    error = vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => vi.restoreAllMocks());

  it("throws before the first render with the install line and the three setup lines for this React major", async () => {
    const { render, Container } = await import("../src/index");
    const major = React.version.split(".")[0];
    let thrown;
    try {
      render(<Container />, new PIXI.Container());
    } catch (e) {
      thrown = e;
    }
    expect(thrown).toBeDefined();
    expect(thrown.message).toContain(`npm install @react-pixi-fiber/react-${major} @react-pixi-fiber/pixi-N`);
    expect(thrown.message).toContain('import { configure } from "react-pixi-fiber";');
    expect(thrown.message).toContain(`import react${major} from "@react-pixi-fiber/react-${major}";`);
    expect(thrown.message).toContain('import pixiN from "@react-pixi-fiber/pixi-N";');
    expect(thrown.message).toContain(`configure({ react: react${major}(), pixi: pixiN() });`);
  });

  it("throws the same error from createInstance", async () => {
    const { createInstance } = await import("../src/ReactPixiFiberComponent");
    expect(() => createInstance("Container", {})).toThrow(/not configured/);
  });

  it("throws when given an uncalled factory", async () => {
    const { configure } = await import("../src/configure");
    const pixi6 = (await import("@react-pixi-fiber/pixi-6")).default;
    expect(() => configure({ react: react18, pixi: pixi6() })).toThrow(/`react` to be/);
    expect(() => configure({ react: react18(), pixi: pixi6 })).toThrow(/`pixi` to be/);
  });

  it("throws when the PixiJS adapter misses a member", async () => {
    const { configure } = await import("../src/configure");
    const adapter = (await import("@react-pixi-fiber/pixi-6")).default();
    for (const key of ["copyPoint", "destroyApplication", "isApplication", "isPoint", "properties"]) {
      expect(() => configure({ react: react18(), pixi: { ...adapter, [key]: undefined } })).toThrow(/`pixi` to be/);
    }
  });

  it("keeps the previous configuration when the new one throws", async () => {
    const { configure } = await import("../src/configure");
    const { createInstance } = await import("../src/ReactPixiFiberComponent");
    const adapter = (await import("@react-pixi-fiber/pixi-6")).default();
    configure({ react: react18(), pixi: adapter });
    const other = { ...adapter, behaviors: { Container: { create: () => new PIXI.Sprite() } } };
    const failing = {
      ...react18(),
      createRenderer: () => {
        throw new Error("createRenderer");
      },
    };
    expect(() => configure({ react: failing, pixi: other })).toThrow("createRenderer");
    expect(() => configure({ react: react18(), pixi: { ...other, behaviors: { Container: {} } } })).toThrow(/create/);
    expect(createInstance("Container", {})).toBeInstanceOf(PIXI.Container);
    expect(createInstance("Container", {})).not.toBeInstanceOf(PIXI.Sprite);
    expect(createInstance("Sprite", {})).toBeInstanceOf(PIXI.Sprite);
  });

  it("a second call after a render warns once in development and the new adapters win", async () => {
    const { configure } = await import("../src/configure");
    const { render, Container } = await import("../src/index");
    const adapter = (await import("@react-pixi-fiber/pixi-6")).default();
    configure({ react: react18(), pixi: adapter });
    render(<Container />, new PIXI.Container());
    const marker = new PIXI.Container();
    const other = { ...adapter, behaviors: { ...adapter.behaviors, Container: { create: () => marker } } };
    configure({ react: react18(), pixi: other });
    render(<Container />, new PIXI.Container());
    configure({ react: react18(), pixi: other });
    expect(error.mock.calls.filter(c => /configure.*called again/.test(c[0]))).toHaveLength(__DEV__ ? 1 : 0);
    const { createInstance } = await import("../src/ReactPixiFiberComponent");
    expect(createInstance("Container", {})).toBe(marker);
  });

  it("keeps updating and unmounting a tree rendered before a second call on its own renderer", async () => {
    const { configure } = await import("../src/configure");
    const { render, unmount, Container, Sprite } = await import("../src/index");
    const adapter = (await import("@react-pixi-fiber/pixi-6")).default();
    configure({ react: react18(), pixi: adapter });
    const stage = new PIXI.Container();
    render(<Container x={1} />, stage);
    const first = stage.children[0];
    configure({ react: react18(), pixi: adapter });
    render(
      <Container x={2}>
        <Sprite />
      </Container>,
      stage
    );
    expect(stage.children).toHaveLength(1);
    expect(stage.children[0]).toBe(first);
    expect(first.x).toBe(2);
    expect(first.children).toHaveLength(1);
    unmount(stage);
    expect(stage.children).toHaveLength(0);
  });

  it("a second unmount after a second call is still a no-op that returns true", async () => {
    const { configure } = await import("../src/configure");
    const { render, unmount, Container } = await import("../src/index");
    const adapter = (await import("@react-pixi-fiber/pixi-6")).default();
    configure({ react: react18(), pixi: adapter });
    const stage = new PIXI.Container();
    render(<Container />, stage);
    expect(unmount(stage)).toBe(true);
    configure({ react: react18(), pixi: adapter });
    expect(unmount(stage)).toBe(true);
  });

  it("unmounts a Stage mounted before a second call", async () => {
    const { configure } = await import("../src/configure");
    const Stage = (await import("../src/Stage")).default;
    const { Container } = await import("../src/index");
    const adapter = (await import("@react-pixi-fiber/pixi-6")).default();
    const app = { stage: new PIXI.Container(), renderer: { resize() {} } };
    const pixi = { ...adapter, createApplication: () => app, destroyApplication: vi.fn() };
    configure({ react: react18(), pixi });
    let tree;
    act(() => {
      tree = renderer.create(
        <Stage>
          <Container />
        </Stage>,
        { createNodeMock: () => ({}) }
      );
    });
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(app.stage.children).toHaveLength(1);
    configure({ react: react18(), pixi });
    expect(() => act(() => tree.unmount())).not.toThrow();
    expect(app.stage.children).toHaveLength(0);
  });

  it("throws the missing-configure error when an unconfigured Stage mounts", async () => {
    const Stage = (await import("../src/Stage")).default;
    expect(() => renderer.create(<Stage />, { createNodeMock: () => ({}) })).toThrow(/not configured/);
  });
});
