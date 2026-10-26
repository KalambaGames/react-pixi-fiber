import { beforeAll } from "vitest";

// Configures the core suite with react-18 and pixi-6. The imports are dynamic and run in beforeAll: a setup file's
// static imports load before a test file's vi.mock calls apply, so those mocks would miss every module that configure
// pulls in. A test file that mocks ../src/configure without `configure` configures nothing here.
beforeAll(async () => {
  const mod = await import("../src/configure");
  if (!("configure" in mod)) return;
  const react18 = (await import("@react-pixi-fiber/react-18")).default;
  const pixi6 = (await import("@react-pixi-fiber/pixi-6")).default;
  const pixi = pixi6();
  // The suite checks the destroy path of a filter, which the PixiJS 6 adapter's `releaseFilter` skips.
  delete pixi.releaseFilter;
  mod.configure({ react: react18(), pixi });
});
