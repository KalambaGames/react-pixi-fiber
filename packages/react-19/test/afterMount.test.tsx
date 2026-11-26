import React, { Activity } from "react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { configure, PIXIComponent, render, unmount } from "react-pixi-fiber";

import { createFakeNode, fakePixiAdapter } from "../../react-pixi-fiber/test/utils/fakePixiAdapter";
import react19 from "../src/index";

// The real core on the real reconciler. The core warns once for each module instance, so run one test alone (`-t`) to
// see it fail.
describe("react19 with the core: afterMount", () => {
  const afterMount = vi.fn();
  const Mounted = PIXIComponent("Mounted", { create: () => createFakeNode("Mounted"), afterMount });

  beforeAll(() => {
    configure({ react: react19(), pixi: fakePixiAdapter() });
  });
  afterEach(() => {
    afterMount.mockClear();
    vi.restoreAllMocks();
  });

  it("does not warn that the adapter skips commitMount when React commits a new instance", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const container: Record<string, any> = createFakeNode("root");
    render(<Mounted />, container);
    expect(afterMount).toHaveBeenCalledTimes(1);
    expect(error).not.toHaveBeenCalled();
    unmount(container);
  });

  // React does not call `commitMount` here, and the core runs `afterMount` when React shows the instance.
  it("does not warn for an instance that React first commits inside a hidden <Activity>", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const container: Record<string, any> = createFakeNode("root");
    const tree = (mode: "hidden" | "visible") => (
      <Activity mode={mode}>
        <Mounted />
      </Activity>
    );
    render(tree("hidden"), container);
    // React renders a hidden <Activity> in a later pass at low priority.
    await vi.waitFor(() => expect(container.children).toHaveLength(1));
    expect(afterMount).not.toHaveBeenCalled();
    render(tree("visible"), container);
    expect(afterMount).toHaveBeenCalledTimes(1);
    expect(error).not.toHaveBeenCalled();
    unmount(container);
  });
});
