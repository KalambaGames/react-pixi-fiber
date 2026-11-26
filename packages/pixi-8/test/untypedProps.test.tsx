import * as PIXI from "pixi.js";
import React, { StrictMode } from "react";
import renderer, { act } from "react-test-renderer";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Container, configure, Sprite, Stage } from "react-pixi-fiber";
import react18 from "@react-pixi-fiber/react-18";

import pixi8 from "../src/index";

afterEach(() => vi.restoreAllMocks());

async function mount(element: (onInit: (app: unknown) => void) => React.ReactElement) {
  configure({ react: react18(), pixi: pixi8() });
  let app: PIXI.Application | null = null;
  const tree = renderer.create(
    element(a => {
      app = a as PIXI.Application;
    }),
    { createNodeMock: () => document.createElement("canvas") }
  );
  await act(async () => {
    await new Promise(r => setTimeout(r, 0));
  });
  return { app: app! as PIXI.Application, tree };
}

describe("pixi8() properties PixiJS 8 leaves untyped", () => {
  it("sets onRender on a Container without an event handler warning under StrictMode", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const onRender = () => {};
    const { app, tree } = await mount(onInit => (
      <Stage onInit={onInit} options={{ height: 8, width: 8 }}>
        <StrictMode>
          <Container onRender={onRender} />
        </StrictMode>
      </Stage>
    ));
    expect((app.stage.children[0] as PIXI.Container).onRender).toBe(onRender);
    expect(error.mock.calls.filter(c => /Invalid event handler prop/.test(String(c[0])))).toHaveLength(0);
    act(() => tree.unmount());
  });
  it("points a React-style event prop to the PixiJS 8 name under StrictMode", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const { tree } = await mount(onInit => (
      <Stage onInit={onInit} options={{ height: 8, width: 8 }}>
        <StrictMode>
          {/* @ts-expect-error onClick is not a PixiJS 8 Container prop */}
          <Container onClick={() => {}} />
          {/* @ts-expect-error onDoubleClick is not a PixiJS 8 Container prop */}
          <Container onDoubleClick={() => {}} />
        </StrictMode>
      </Stage>
    ));
    const messages = error.mock.calls.map(c => String(c[0]));
    expect(messages.filter(m => /Invalid prop `onClick`.*Did you mean `onclick`\?/.test(m))).toHaveLength(
      __DEV__ ? 1 : 0
    );
    expect(
      messages.filter(m => /Invalid event handler prop `onDoubleClick`.*for example `onclick`\./.test(m))
    ).toHaveLength(__DEV__ ? 1 : 0);
    act(() => tree.unmount());
  });
  it("puts blendMode and interactive on app.stage, not on the canvas", async () => {
    const { app, tree } = await mount(onInit => (
      <Stage interactive onInit={onInit} options={{ height: 8, width: 8 }} blendMode="add" />
    ));
    expect(app.stage.blendMode).toBe("add");
    expect(app.stage.interactive).toBe(true);
    const props = (tree.toJSON() as { props: Record<string, unknown> }).props;
    expect(props).not.toHaveProperty("blendMode");
    expect(props).not.toHaveProperty("interactive");
    act(() => tree.unmount());
  });
  it("puts boundsArea and cullArea on app.stage, not on the canvas", async () => {
    const area = new PIXI.Rectangle(0, 0, 4, 4);
    const { app, tree } = await mount(onInit => (
      <Stage boundsArea={area} cullArea={area} onInit={onInit} options={{ height: 8, width: 8 }} />
    ));
    expect(app.stage.boundsArea).toBe(area);
    expect(app.stage.cullArea).toBe(area);
    const props = (tree.toJSON() as { props: Record<string, unknown> }).props;
    expect(props).not.toHaveProperty("boundsArea");
    expect(props).not.toHaveProperty("cullArea");
    act(() => tree.unmount());
  });
  it("puts tint on app.stage, not on the canvas", async () => {
    const { app, tree } = await mount(onInit => (
      <Stage onInit={onInit} options={{ height: 8, width: 8 }} tint={0xff0000} />
    ));
    expect(app.stage.tint).toBe(0xff0000);
    expect((tree.toJSON() as { props: Record<string, unknown> }).props).not.toHaveProperty("tint");
    act(() => tree.unmount());
  });
  it("puts the React DOM handler onClick on the canvas, and onclick and onRender on app.stage", async () => {
    const onClick = () => {};
    const onclick = () => {};
    const onRender = () => {};
    const { app, tree } = await mount(onInit => (
      <Stage
        onClick={onClick}
        onclick={onclick}
        onInit={onInit}
        onRender={onRender}
        options={{ height: 8, width: 8 }}
      />
    ));
    const props = (tree.toJSON() as { props: Record<string, unknown> }).props;
    expect(props.onClick).toBe(onClick);
    expect(props).not.toHaveProperty("onclick");
    expect(props).not.toHaveProperty("onRender");
    expect(app.stage.onclick).toBe(onclick);
    expect(app.stage.onRender).toBe(onRender);
    expect((app.stage as unknown as Record<string, unknown>).onClick).toBeUndefined();
    act(() => tree.unmount());
  });

  it("clears mask, filters and cursor when the props are removed", async () => {
    const mask = new PIXI.Graphics();
    const filter = new PIXI.BlurFilter();
    const { app, tree } = await mount(onInit => (
      <Stage onInit={onInit} options={{ height: 8, width: 8 }}>
        <Sprite cursor="pointer" filters={[filter]} mask={mask} texture={PIXI.Texture.WHITE} />
      </Stage>
    ));
    const sprite = app.stage.children[0] as PIXI.Sprite;
    expect(sprite.mask).toBe(mask);
    await act(async () => {
      tree.update(
        <Stage onInit={() => {}} options={{ height: 8, width: 8 }}>
          <Sprite texture={PIXI.Texture.WHITE} />
        </Stage>
      );
    });
    expect(sprite.mask).toBeFalsy();
    expect(sprite.filters).toBeFalsy();
    expect(sprite.cursor).toBeFalsy();
    act(() => tree.unmount());
  });
});
