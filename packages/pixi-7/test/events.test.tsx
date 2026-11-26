import * as PIXI from "pixi.js";
import React from "react";
import renderer, { act } from "react-test-renderer";
import { describe, expect, it, vi } from "vitest";

import { configure, Sprite, Stage } from "react-pixi-fiber";
import react18 from "@react-pixi-fiber/react-18";

import pixi7 from "../src/index";

async function mount(element: React.ReactElement) {
  configure({ react: react18(), pixi: pixi7() });
  let app: PIXI.Application | null = null;
  const stage = (el: React.ReactElement) => (
    <Stage
      options={{ width: 800, height: 600 }}
      onInit={a => {
        app = a as PIXI.Application;
      }}
    >
      {el}
    </Stage>
  );
  const tree = renderer.create(stage(element), { createNodeMock: () => document.createElement("canvas") });
  await act(async () => {
    await new Promise(r => setTimeout(r, 0));
  });
  return { app: app! as PIXI.Application, tree, update: (el: React.ReactElement) => act(() => tree.update(stage(el))) };
}

describe("pixi7 scale updates", () => {
  it("applies Point, number and object scale values on update", async () => {
    const { app, tree, update } = await mount(<Sprite scale={new PIXI.Point(1, 1)} />);
    const sprite = app.stage.children[0] as PIXI.Sprite;
    update(<Sprite scale={new PIXI.Point(1.25, 1.25)} />);
    expect(sprite.scale.x).toBe(1.25);
    update(<Sprite scale={2} />);
    expect([sprite.scale.x, sprite.scale.y]).toEqual([2, 2]);
    update(<Sprite scale={{ x: 3, y: 4 }} />);
    expect([sprite.scale.x, sprite.scale.y]).toEqual([3, 4]);
    act(() => tree.unmount());
  });
});

describe("pixi7 event props", () => {
  it("sets onpointerdown and interactive on the instance, and the federated event reaches the handler", async () => {
    configure({ react: react18(), pixi: pixi7() });
    const handler = vi.fn();
    let app: PIXI.Application | null = null;
    const tree = renderer.create(
      <Stage
        options={{ width: 8, height: 8 }}
        onInit={a => {
          app = a as PIXI.Application;
        }}
      >
        <Sprite interactive onpointerdown={handler} cursor="pointer" />
      </Stage>,
      { createNodeMock: () => document.createElement("canvas") }
    );
    await act(async () => {
      await new Promise(r => setTimeout(r, 0));
    });
    const sprite = app!.stage.children[0] as PIXI.Sprite;
    expect(sprite.onpointerdown).toBe(handler);
    expect(sprite.eventMode).toBe("static");
    expect(sprite.cursor).toBe("pointer");
    const event = new PIXI.FederatedPointerEvent(app!.renderer.events.rootBoundary);
    event.type = "pointerdown";
    app!.renderer.events.rootBoundary.rootTarget = app!.stage;
    event.target = sprite;
    app!.renderer.events.rootBoundary.dispatchEvent(event, "pointerdown");
    expect(handler).toHaveBeenCalledTimes(1);
    act(() => tree.unmount());
  });
  it("puts the React DOM handler onClick on the canvas and onclick on app.stage", async () => {
    configure({ react: react18(), pixi: pixi7() });
    const onClick = () => {};
    const onclick = () => {};
    let app: PIXI.Application | null = null;
    const tree = renderer.create(
      <Stage
        onClick={onClick}
        onclick={onclick}
        onInit={a => {
          app = a as PIXI.Application;
        }}
        options={{ width: 8, height: 8 }}
      />,
      { createNodeMock: () => document.createElement("canvas") }
    );
    await act(async () => {
      await new Promise(r => setTimeout(r, 0));
    });
    const props = (tree.toJSON() as { props: Record<string, unknown> }).props;
    expect(props.onClick).toBe(onClick);
    expect(props).not.toHaveProperty("onclick");
    expect(app!.stage.onclick).toBe(onclick);
    expect((app!.stage as unknown as Record<string, unknown>).onClick).toBeUndefined();
    act(() => tree.unmount());
  });
});

describe("pixi7 DOM pointer events", () => {
  it("runs onpointerdown from a pointerdown on the view and applies the state update", async () => {
    const Scene = () => {
      const [scale, setScale] = React.useState(1);
      return (
        <Sprite
          cursor="pointer"
          interactive
          onpointerdown={() => setScale(s => s * 1.25)}
          scale={new PIXI.Point(scale, scale)}
          texture={PIXI.Texture.WHITE}
          x={400}
          y={300}
          anchor={new PIXI.Point(0.5, 0.5)}
        />
      );
    };
    const { app, tree } = await mount(<Scene />);
    const view = app.view as HTMLCanvasElement;
    view.getBoundingClientRect = () =>
      ({ x: 0, y: 0, left: 0, top: 0, right: 800, bottom: 600, width: 800, height: 600 }) as DOMRect;
    const sprite = app.stage.children[0] as PIXI.Sprite;
    // The mocked WebGL context does not render, so do what a render does for hit testing.
    (app.renderer as any).objectRenderer.lastObjectRendered = app.stage;
    const parent = app.stage.enableTempParent();
    app.stage.updateTransform();
    app.stage.disableTempParent(parent);
    await act(async () => {
      view.dispatchEvent(
        new PointerEvent("pointerdown", {
          bubbles: true,
          button: 0,
          buttons: 1,
          clientX: 400,
          clientY: 300,
          isPrimary: true,
          pointerId: 1,
          pointerType: "mouse",
        })
      );
    });
    expect(sprite.scale.x).toBe(1.25);
    act(() => tree.unmount());
  });
});
