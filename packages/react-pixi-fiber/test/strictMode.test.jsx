import * as PIXI from "pixi.js";
import React, { StrictMode } from "react";
import { act } from "react-test-renderer";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Container, PIXIComponent, render, unmount } from "../src/index";

const casingWarning = /Invalid prop `buttonmode` on `<Container \/>`. Did you mean `buttonMode`\?/;
const messages = spy => spy.mock.calls.map(call => String(call[0]));

describe("dev prop validation under <StrictMode>", () => {
  afterEach(() => vi.restoreAllMocks());

  it("warns about prop casing only under StrictMode", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const stage = new PIXI.Container();
    act(() => render(<Container buttonmode />, stage));
    expect(messages(error).some(m => casingWarning.test(m))).toBe(false);
    act(() => unmount(stage));

    const strictStage = new PIXI.Container();
    act(() =>
      render(
        <StrictMode>
          <Container buttonmode />
        </StrictMode>,
        strictStage
      )
    );
    expect(messages(error).some(m => casingWarning.test(m))).toBe(__DEV__);
    act(() => unmount(strictStage));
  });

  it("does not report an untyped prop on a PIXIComponent tag under StrictMode", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const Thing = PIXIComponent("StrictModeThing", () => new PIXI.Container());
    const stage = new PIXI.Container();
    act(() =>
      render(
        <StrictMode>
          <Thing anything={1} interactivechildren />
        </StrictMode>,
        stage
      )
    );
    expect(stage.children[0].anything).toBe(1);
    expect(messages(error).some(m => /does not recognize/.test(m))).toBe(false);
    // The casing warning proves validation ran on this tag. Warnings are deduped per prop name, hence not `buttonmode`.
    expect(messages(error).some(m => /Invalid prop `interactivechildren` on `<StrictModeThing \/>`/.test(m))).toBe(
      __DEV__
    );
    act(() => unmount(stage));
  });
});
