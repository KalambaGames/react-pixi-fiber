import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import warning from "../src/warning";
import * as ReactPixiFiberUnknownPropertyHook from "../src/ReactPixiFiberUnknownPropertyHook";
import { customStandardNames, getCustomPropertyInfo, shouldRemoveAttributeWithWarning } from "../src/PixiProperty";
import { getPixiAdapter } from "../src/configure";
import { registerAdapterBehaviors, registerComponent } from "../src/registry";
import { TAGS } from "../src/tags";

vi.mock("../src/warning", () => ({ default: vi.fn() }));
vi.mock("../src/PixiProperty", async importOriginal => ({
  ...(await importOriginal()),
  getPropertyInfo: vi.fn(() => null),
  getCustomPropertyInfo: vi.fn(() => null),
  shouldRemoveAttributeWithWarning: vi.fn(() => false),
}));
vi.mock("../src/configure", async importOriginal => ({
  ...(await importOriginal()),
  getStackAddendum: () => "stack",
}));

describe("ReactPixiFiberUnknownPropertyHook", () => {
  describe("validateProperty", () => {
    const type = "type";
    const stack = "stack";

    afterEach(() => {
      warning.mockReset();
    });

    it("should be defined in development", () => {
      // A no-op returning `undefined` in production, a validator returning a boolean in development.
      const result = ReactPixiFiberUnknownPropertyHook.validateProperty(type, "position", "0,0");
      if (__DEV__) {
        expect(typeof result).toEqual("boolean");
      } else {
        expect(result).toBeUndefined();
      }
    });

    it("should warn about properties starting with `on` in development", () => {
      const name = "onTest";
      ReactPixiFiberUnknownPropertyHook.validateProperty(type, name, () => {});

      if (__DEV__) {
        expect(warning).toHaveBeenCalledTimes(1);
        expect(warning).toHaveBeenCalledWith(
          false,
          "Invalid event handler prop `%s` on `<%s />`. PIXI events use other naming convention, for example `%s`.%s",
          name,
          type,
          "click",
          stack
        );
      } else {
        expect(warning).toHaveBeenCalledTimes(0);
      }
    });

    it("should not warn about properties starting with `on` on a PIXIComponent", () => {
      registerComponent("OnHandlerComponent", { create: () => ({}) });
      ReactPixiFiberUnknownPropertyHook.validateProperty("OnHandlerComponent", "onDragEnd", () => {});

      expect(warning).toHaveBeenCalledTimes(0);
    });

    it("should warn about NaNs in development", () => {
      const name = "someValue";
      ReactPixiFiberUnknownPropertyHook.validateProperty(type, name, NaN);

      if (__DEV__) {
        expect(warning).toHaveBeenCalledTimes(1);
        expect(warning).toHaveBeenCalledWith(
          false,
          "Received NaN for prop `%s` on `<%s />`. If this is expected, cast the value to a string.%s",
          name,
          type,
          stack
        );
      } else {
        expect(warning).toHaveBeenCalledTimes(0);
      }
    });

    it.skipIf(!__DEV__)("does not report an on* name registered with PIXIProperty as an event handler", () => {
      customStandardNames.Draggable = { ondragend: "onDragEnd" };
      customStandardNames["*"] = { ondrop: "onDrop" };
      try {
        expect(ReactPixiFiberUnknownPropertyHook.validateProperty("Draggable", "onDragEnd", () => {})).toBe(true);
        expect(ReactPixiFiberUnknownPropertyHook.validateProperty("Draggable", "onDrop", () => {})).toBe(true);
        expect(warning).toHaveBeenCalledTimes(0);
      } finally {
        delete customStandardNames.Draggable;
        delete customStandardNames["*"];
      }
    });

    it.skipIf(!__DEV__)("treats names registered with PIXIProperty as known and checks their casing", () => {
      customStandardNames.Circle = { radius: "radius" };
      customStandardNames["*"] = { zorder: "zOrder" };
      try {
        expect(ReactPixiFiberUnknownPropertyHook.validateProperty("Circle", "radius", 1)).toBe(true);
        expect(ReactPixiFiberUnknownPropertyHook.validateProperty("Circle", "zOrder", 1)).toBe(true);
        expect(warning).toHaveBeenCalledTimes(0);
        ReactPixiFiberUnknownPropertyHook.validateProperty("Circle", "zorder", 1);
        expect(warning).toHaveBeenCalledWith(
          false,
          "Invalid prop `%s` on `<%s />`. Did you mean `%s`?%s",
          "zorder",
          "Circle",
          "zOrder",
          stack
        );
      } finally {
        delete customStandardNames.Circle;
        delete customStandardNames["*"];
      }
    });

    it.skipIf(!__DEV__)("ignores a PIXIProperty registration of a name the adapter types, with one warning", () => {
      const validator = vi.fn(() => true);
      getCustomPropertyInfo.mockReturnValue({ type: validator });
      try {
        ReactPixiFiberUnknownPropertyHook.validateProperty(TAGS.Sprite, "rotation", 1);
        ReactPixiFiberUnknownPropertyHook.validateProperty(TAGS.Sprite, "rotation", 2);
        expect(validator).not.toHaveBeenCalled();
        expect(warning).toHaveBeenCalledTimes(1);
        expect(warning).toHaveBeenCalledWith(
          false,
          "`PIXIProperty` registered `%s` on `<%s />`, which the PixiJS adapter already types. The registration is ignored.%s",
          "rotation",
          TAGS.Sprite,
          stack
        );
      } finally {
        getCustomPropertyInfo.mockReturnValue(null);
      }
    });

    it.skipIf(!__DEV__)("looks up names registered for the tag a deprecated type maps to", () => {
      customStandardNames.NineSliceSprite = { leftwidth: "leftWidth" };
      // The configured adapter aliases NineSlicePlane itself; without the alias the deprecated tag map applies.
      registerAdapterBehaviors({});
      try {
        expect(ReactPixiFiberUnknownPropertyHook.validateProperty("NineSlicePlane", "leftWidth", 1)).toBe(true);
        expect(getCustomPropertyInfo).toHaveBeenLastCalledWith("leftWidth", "NineSliceSprite");
        expect(warning).toHaveBeenCalledTimes(0);
        ReactPixiFiberUnknownPropertyHook.validateProperty("NineSlicePlane", "leftwidth", 1);
        expect(warning).toHaveBeenCalledWith(
          false,
          "Invalid prop `%s` on `<%s />`. Did you mean `%s`?%s",
          "leftwidth",
          "NineSlicePlane",
          "leftWidth",
          stack
        );
      } finally {
        delete customStandardNames.NineSliceSprite;
        registerAdapterBehaviors(getPixiAdapter().behaviors);
      }
    });

    it.skipIf(!__DEV__)("checks the casing of the names the adapter table types", () => {
      expect(ReactPixiFiberUnknownPropertyHook.validateProperty(type, "buttonMode", true)).toBe(true);
      expect(warning).toHaveBeenCalledTimes(0);
      ReactPixiFiberUnknownPropertyHook.validateProperty(type, "buttonmode", true);
      expect(warning).toHaveBeenCalledWith(
        false,
        "Invalid prop `%s` on `<%s />`. Did you mean `%s`?%s",
        "buttonmode",
        type,
        "buttonMode",
        stack
      );
    });

    it.skipIf(!__DEV__)("does not report names the adapter table does not type", () => {
      expect(ReactPixiFiberUnknownPropertyHook.validateProperty(type, "textur", "value")).toBe(true);
      expect(ReactPixiFiberUnknownPropertyHook.validateProperty(type, "sortableChildren", true)).toBe(true);
      expect(warning).toHaveBeenCalledTimes(0);
    });

    it.skipIf(!__DEV__)("does not report the lowercase PixiJS 7+ handlers as React-style events", () => {
      expect(ReactPixiFiberUnknownPropertyHook.validateProperty(type, "onclick", () => {})).toBe(true);
      expect(warning).toHaveBeenCalledTimes(0);
    });

    it.skip("should assume that values for reserved properties are valid", () => {});

    it.skip("should not warn again if shouldRemoveAttributeWithWarning returns true", () => {});

    it.skip("should assume property value is valid otherwise", () => {});
  });

  describe("validateProperties", () => {
    afterEach(() => {
      warning.mockReset();
    });

    it("validates the props of every type", () => {
      // `alpha` is a known Sprite prop no earlier test in this module warned about. In development
      // shouldRemoveAttributeWithWarning reports it invalid; in production validateProperty is a no-op, so every
      // prop counts as invalid. Either way warnUnknownProperties (internal) reports it.
      shouldRemoveAttributeWithWarning.mockImplementationOnce(() => true);
      ReactPixiFiberUnknownPropertyHook.validateProperties(TAGS.Sprite, { alpha: 2 });

      expect(warning).toHaveBeenCalledWith(
        false,
        "Invalid value for prop %s on `<%s />`.%s",
        "`alpha`",
        TAGS.Sprite,
        "stack"
      );
    });
  });

  describe("warnUnknownProperties", () => {
    const type = TAGS.Sprite;
    const props = { position: "0,0", scale: 2 };
    const stack = "stack";

    // validateProperty is internal to the module and remembers which props it warned about, so every test
    // gets a fresh module. Its result is controlled through what it depends on: in development the props are
    // known Sprite properties and shouldRemoveAttributeWithWarning decides if they are valid. In production
    // it is a no-op returning `undefined`, so every prop counts as not valid and only that case runs.
    let warnUnknownProperties;
    const mockValidateProperty = isValid => {
      shouldRemoveAttributeWithWarning.mockImplementation((type, name) => !isValid(name));
    };

    beforeEach(async () => {
      vi.resetModules();
      ({ warnUnknownProperties } = await import("../src/ReactPixiFiberUnknownPropertyHook"));
    });

    afterEach(() => {
      shouldRemoveAttributeWithWarning.mockReset();
      warning.mockReset();
    });

    it.skipIf(!__DEV__)("should not warn is props are valid", () => {
      mockValidateProperty(() => true);
      warnUnknownProperties(type, props);

      expect(warning).toHaveBeenCalledTimes(0);
    });

    it.skipIf(!__DEV__)("should warn if one prop is not valid", () => {
      mockValidateProperty(name => name === "position");
      warnUnknownProperties(type, props);

      expect(warning).toHaveBeenCalledTimes(1);
      expect(warning).toHaveBeenCalledWith(false, "Invalid value for prop %s on `<%s />`.%s", "`scale`", type, stack);
    });

    it("should warn if more than one prop is not valid", () => {
      mockValidateProperty(() => false);
      warnUnknownProperties(type, props);

      expect(warning).toHaveBeenCalledTimes(1);
      expect(warning).toHaveBeenCalledWith(
        false,
        "Invalid values for props %s on `<%s />`.%s",
        "`position`, `scale`",
        type,
        stack
      );
    });
  });
});
