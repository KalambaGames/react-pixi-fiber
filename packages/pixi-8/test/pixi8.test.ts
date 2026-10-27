import { describe, it, expect, vi } from "vitest";
import * as PIXI from "pixi.js";
import { DISPLAY_OBJECT_TAGS, FILTER_TAGS, TAGS } from "../../react-pixi-fiber/src/tags";
import react18 from "@react-pixi-fiber/react-18";
import { configure, PIXIComponent } from "react-pixi-fiber";
import { createInstance } from "../../react-pixi-fiber/src/ReactPixiFiberComponent";
import { factories } from "../src/factories";
import pixi8, {
  allClasses,
  DOMContainer,
  HTMLText,
  Particle,
  PerspectiveMesh,
  pixi8WithClasses,
  RenderContainer,
  RenderLayer,
} from "../src/index";

const texture = PIXI.Texture.WHITE;
const EXTRA_TAGS = {
  DOMContainer,
  HTMLText,
  Particle,
  PerspectiveMesh,
  RenderContainer,
  RenderLayer,
} as Record<string, unknown>;

describe("pixi8", () => {
  const adapter = pixi8();
  it("implements the 18 core tags and the six PixiJS 8 tags", () => {
    for (const [name, value] of Object.entries(EXTRA_TAGS)) expect(value).toBe(name);
    expect(Object.keys(adapter.components).sort()).toEqual([...Object.keys(TAGS), ...Object.keys(EXTRA_TAGS)].sort());
    for (const tag of Object.keys(adapter.components))
      expect(typeof adapter.components[tag].create, tag).toBe("function");
  });
  it("marks the filter tags, and no Display Object tag, with kind filter", () => {
    for (const tag of [...Object.keys(FILTER_TAGS)]) expect(adapter.components[tag].kind, tag).toBe("filter");
    for (const tag of Object.keys(DISPLAY_OBJECT_TAGS)) expect(adapter.components[tag].kind, tag).toBeUndefined();
  });
  it("lists origin as a point", () => {
    expect(adapter.properties.vector).toContain("origin");
    expect(adapter.properties.untypedContainer).not.toContain("origin");
  });

  it("lists the on-prefixed event properties as callbacks", () => {
    expect(adapter.properties.callback).toContain("onclick");
    expect(adapter.properties.callback).not.toContain("click");
  });
  it("passes the defaults override through", () => {
    expect(pixi8({ defaults: { Text: { text: "" } } }).defaults).toEqual({
      Text: { text: "" },
    });
    expect(adapter.defaults).toBeUndefined();
  });
  it("createApplication is async and destroyApplication forwards removeView", async () => {
    const pending = adapter.createApplication({ width: 4, height: 4 });
    expect(pending).toBeInstanceOf(Promise);
    const app = (await pending) as PIXI.Application;
    expect(app).toBeInstanceOf(PIXI.Application);
    expect(adapter.isApplication(app)).toBe(true);
    expect(adapter.isApplication({})).toBe(false);
    adapter.destroyApplication(app, false, true);
  });
  it("passes the view option as the canvas", async () => {
    const view = document.createElement("canvas");
    const app = (await adapter.createApplication({ height: 4, view, width: 4 })) as PIXI.Application;
    expect(app.canvas).toBe(view);
    adapter.destroyApplication(app, false, true);
  });
  it("keeps the WebGL context of a canvas still in the document when it destroys an application", async () => {
    const lost = async (connected: boolean) => {
      const view = document.createElement("canvas");
      if (connected) document.body.appendChild(view);
      const app = (await adapter.createApplication({ height: 4, view, width: 4 })) as PIXI.Application;
      const ext = (app.renderer as PIXI.WebGLRenderer).context.extensions.loseContext!;
      const loseContext = vi.spyOn(ext, "loseContext");
      adapter.destroyApplication(app, false, true);
      view.remove();
      return loseContext.mock.calls.length;
    };
    expect(await lost(true)).toBe(0);
    expect(await lost(false)).toBe(1);
    const gpuApp = { destroy: vi.fn(), renderer: {} };
    adapter.destroyApplication(gpuApp, false, true);
    expect(gpuApp.destroy).toHaveBeenCalledWith({ removeView: false }, true);
  });
  it("handles points", () => {
    expect(adapter.isPoint(new PIXI.ObservablePoint({ _onUpdate: () => {} }))).toBe(true);
    expect(adapter.isPoint([1, 2])).toBe(false);
    const target = new PIXI.Point();
    adapter.copyPoint(target, { x: 1, y: 2 });
    expect([target.x, target.y]).toEqual([1, 2]);
  });
  it("throws on classes, naming pixi8WithClasses", () => {
    expect(() => pixi8({ classes: { Sprite: PIXI.Sprite } } as any)).toThrow(
      "`pixi8` takes no `classes`. Pass them to `pixi8WithClasses` from `@react-pixi-fiber/pixi-8`."
    );
  });
  it("has no translateProps without compat in production", () => {
    expect(adapter.translateProps === undefined).toBe(!__DEV__);
  });
});

describe("pixi8 prop writes", () => {
  it("sets a color string tint, which PixiJS 8 accepts", async () => {
    const { setValueForProperty } = await import("../../react-pixi-fiber/src/PixiPropertyOperations");
    configure({ react: react18(), pixi: pixi8() });
    const sprite = new PIXI.Sprite(texture);
    setValueForProperty("Sprite", sprite, "tint", "#ff0000");
    expect(sprite.tint).toBe(0xff0000);
  });
});

describe("pixi8WithClasses({ classes })", () => {
  const M1 = "`pixi8WithClasses` needs `classes`. Pass the PixiJS classes the app renders.";
  it("throws without classes", () => {
    expect(() => (pixi8WithClasses as any)()).toThrow(M1);
    expect(() => (pixi8WithClasses as any)({})).toThrow(M1);
    expect(() => (pixi8WithClasses as any)({ classes: "all" })).toThrow(M1);
    expect(() => (pixi8WithClasses as any)({ classes: null })).toThrow(M1);
  });
  it("throws on an unknown key, listing the known ones", () => {
    expect(() => pixi8WithClasses({ classes: { Sprit: PIXI.Sprite } as any })).toThrow(
      `\`pixi8WithClasses({ classes })\` got unknown key \`Sprit\`. Known keys: ${Object.keys(allClasses).join(", ")}.`
    );
  });
  it("throws when ParticleContainer is listed without Particle, undefined included", () => {
    const M3 =
      "`ParticleContainer` needs `Particle`. Add `Particle` from `pixi.js` to `pixi8WithClasses({ classes })`.";
    expect(() => pixi8WithClasses({ classes: { ParticleContainer: PIXI.ParticleContainer } })).toThrow(M3);
    expect(() =>
      pixi8WithClasses({ classes: { Particle: undefined, ParticleContainer: PIXI.ParticleContainer } })
    ).toThrow(M3);
    expect(() => pixi8WithClasses({ classes: { Particle: PIXI.Particle } })).not.toThrow();
  });
  it("throws on a value that is not a class", () => {
    expect(() => pixi8WithClasses({ classes: { Sprite: "Sprite" as any } })).toThrow(
      '`pixi8WithClasses({ classes })` got `"Sprite"` for `Sprite`; expected the class from `pixi.js`.'
    );
  });
  it("throws the value message for an instance, which JSON cannot print", () => {
    expect(() => pixi8WithClasses({ classes: { Container: new PIXI.Container() as any } })).toThrow(
      "`pixi8WithClasses({ classes })` got `[object Object]` for `Container`; expected the class from `pixi.js`."
    );
    expect(() => pixi8WithClasses({ classes: { Sprite: 1n as any } })).toThrow(
      "`pixi8WithClasses({ classes })` got `1` for `Sprite`; expected the class from `pixi.js`."
    );
  });
  it("throws the value message for an object with no string form", () => {
    expect(() => pixi8WithClasses({ classes: { Sprite: Object.create(null) } })).toThrow(
      "`pixi8WithClasses({ classes })` got `[object Object]` for `Sprite`; expected the class from `pixi.js`."
    );
  });
  it("checks in order: missing, unknown key, Particle, value", () => {
    expect(() => pixi8WithClasses({ classes: { ParticleContainer: 1, Sprit: 1 } as any })).toThrow(/unknown key/);
    expect(() => pixi8WithClasses({ classes: { ParticleContainer: 1 as any } })).toThrow(/needs `Particle`/);
  });
  it("runs the classes checks before the compat check", () => {
    expect(() => (pixi8WithClasses as any)({ compat: "pixi6" })).toThrow(M1);
  });
  it("creates a listed tag and throws for one left out", () => {
    const adapter = pixi8WithClasses({ classes: { Container: PIXI.Container, Sprite: PIXI.Sprite } });
    expect(Object.keys(adapter.components).sort()).toEqual(Object.keys(factories).sort());
    expect(adapter.components.Sprite.create({ texture })).toBeInstanceOf(PIXI.Sprite);
    expect(() => adapter.components.HTMLText.create({ text: "t" })).toThrow(
      "`HTMLText` is not in `pixi8WithClasses({ classes })`. Add `HTMLText` from `pixi.js` to it."
    );
  });
  it("createApplication rejects when Application is not listed", async () => {
    const adapter = pixi8WithClasses({ classes: { Container: PIXI.Container } });
    await expect(adapter.createApplication({ height: 4, width: 4 })).rejects.toThrow(
      "Add `Application` from `pixi.js` to `pixi8WithClasses({ classes })`, or pass an `app` to `Stage`."
    );
  });
  it("keeps the classes it was given when the caller changes the object afterwards", async () => {
    const classes: Record<string, any> = {
      Container: PIXI.Container,
      Particle: PIXI.Particle,
      ParticleContainer: PIXI.ParticleContainer,
    };
    const adapter = pixi8WithClasses({ classes });
    classes.Application = "Application";
    classes.Particle = class extends PIXI.Particle {};
    const container = adapter.components.ParticleContainer.create({});
    expect(() =>
      adapter.components.ParticleContainer.appendChild!(container, new PIXI.Particle(texture))
    ).not.toThrow();
    await expect(adapter.createApplication({ height: 4, width: 4 })).rejects.toThrow(
      "Add `Application` from `pixi.js` to `pixi8WithClasses({ classes })`, or pass an `app` to `Stage`."
    );
  });
  it("isApplication is duck-typed on a stage that can hold children", () => {
    const adapter = pixi8WithClasses({ classes: { Container: PIXI.Container } });
    expect(adapter.isApplication({ stage: new PIXI.Container() })).toBe(true);
    expect(adapter.isApplication({ stage: {} })).toBe(false);
    expect(adapter.isApplication({})).toBe(false);
    expect(adapter.isApplication(null)).toBe(false);
    expect(adapter.isApplication({ stage: "stage" })).toBe(false);
    expect(adapter.isApplication({ stage: null })).toBe(false);
  });
});

describe("pixi8WithClasses({ classes }) with PIXIComponent", () => {
  it("a PIXIComponent registered for an unlisted tag wins over the stub, with the dev warning", () => {
    configure({ react: react18(), pixi: pixi8WithClasses({ classes: { Container: PIXI.Container } }) });
    PIXIComponent("HTMLText", { create: () => new PIXI.Container() });
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(createInstance("HTMLText", {})).toBeInstanceOf(PIXI.Container);
    if (__DEV__) {
      expect(error).toHaveBeenCalledTimes(1);
      expect(error.mock.calls[0][0]).toContain(
        "`HTMLText` is registered with PIXIComponent and also defined by the PixiJS adapter. The PIXIComponent registration wins."
      );
    } else expect(error).not.toHaveBeenCalled();
    error.mockRestore();
  });
});
