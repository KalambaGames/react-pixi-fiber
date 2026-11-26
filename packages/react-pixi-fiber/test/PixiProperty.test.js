import * as PIXI from "pixi.js";
import { describe, expect, it } from "vitest";

import pixi6 from "@react-pixi-fiber/pixi-6";

import * as PixiProperty from "../src/PixiProperty";

const adapter = pixi6();

describe("PixiProperty", () => {
  describe("types", () => {
    it("should have correct values", () => {
      expect(PixiProperty.RESERVED).toEqual(0);
      expect(PixiProperty.STRING).toEqual(1);
      expect(PixiProperty.BOOLEAN).toEqual(2);
      expect(PixiProperty.NUMERIC).toEqual(3);
      expect(PixiProperty.POSITIVE_NUMERIC).toEqual(4);
      expect(PixiProperty.VECTOR).toEqual(5);
      expect(PixiProperty.CALLBACK).toEqual(6);
    });
  });

  describe("shouldIgnoreAttribute", () => {
    it("should return true if property info is defined and property is reserved", () => {
      expect(PixiProperty.shouldIgnoreAttribute("type", "prop", { type: PixiProperty.RESERVED })).toBeTruthy();
    });

    it("should return true if property info is defined and property is not reserved", () => {
      expect(PixiProperty.shouldIgnoreAttribute("type", "prop", { type: PixiProperty.STRING })).toBeFalsy();
    });

    it("should return false otherwise", () => {
      expect(PixiProperty.shouldIgnoreAttribute("type", "prop", null)).toBeFalsy();
    });
  });

  describe("shouldRemoveAttributeWithWarning", () => {
    it("should return false if property info is defined and property is reserved", () => {
      expect(
        PixiProperty.shouldRemoveAttributeWithWarning("type", "prop", "value", { type: PixiProperty.RESERVED })
      ).toBeFalsy();
    });

    it("should return false if value is boolean and property info is null", () => {
      expect(PixiProperty.shouldRemoveAttributeWithWarning("type", "prop", true, null)).toBeFalsy();
      expect(PixiProperty.shouldRemoveAttributeWithWarning("type", "prop", false, null)).toBeFalsy();
    });

    it("should return true if value is boolean and property does not accept booleans", () => {
      expect(
        PixiProperty.shouldRemoveAttributeWithWarning("type", "prop", true, { acceptsBooleans: false })
      ).toBeTruthy();
      expect(
        PixiProperty.shouldRemoveAttributeWithWarning("type", "prop", false, { acceptsBooleans: false })
      ).toBeTruthy();
    });

    it("should return false if value is boolean and property accepts booleans", () => {
      expect(
        PixiProperty.shouldRemoveAttributeWithWarning("type", "prop", true, { acceptsBooleans: true })
      ).toBeFalsy();
      expect(
        PixiProperty.shouldRemoveAttributeWithWarning("type", "prop", false, { acceptsBooleans: true })
      ).toBeFalsy();
    });

    it("should return false if value is function and property info is null", () => {
      expect(PixiProperty.shouldRemoveAttributeWithWarning("type", "prop", () => {}, null)).toBeFalsy();
    });

    it("should return true if value is function and property is not a callback", () => {
      expect(
        PixiProperty.shouldRemoveAttributeWithWarning("type", "prop", () => {}, { type: PixiProperty.STRING })
      ).toBeTruthy();
    });

    it("should return false if value is function and property is a callback", () => {
      expect(
        PixiProperty.shouldRemoveAttributeWithWarning("type", "prop", () => {}, { type: PixiProperty.CALLBACK })
      ).toBeFalsy();
    });

    it("should return true if value is a symbol", () => {
      expect(PixiProperty.shouldRemoveAttributeWithWarning("type", "prop", Symbol("foo"), null)).toBeTruthy();
    });
  });

  describe("shouldRemoveAttribute", () => {
    const type = "type";
    const name = "prop";

    it("keeps a boolean or function on an untyped name for every component", () => {
      expect(PixiProperty.shouldRemoveAttribute("Container", "sortableChildren", true, null)).toBe(false);
      expect(PixiProperty.shouldRemoveAttribute("Container", "onSomething", () => {}, null)).toBe(false);
      expect(PixiProperty.shouldRemoveAttribute("Sprite", "x", true, PixiProperty.getPropertyInfo("x", adapter))).toBe(
        true
      );
    });

    it("should return true if value is undefined", () => {
      expect(PixiProperty.shouldRemoveAttribute(type, name, undefined, null)).toBeTruthy();
    });

    it("should return true if shouldRemoveAttributeWithWarning returns true", () => {
      // shouldRemoveAttributeWithWarning is internal to the module, it returns true for symbols
      expect(PixiProperty.shouldRemoveAttribute(type, name, Symbol("foo"), null)).toBeTruthy();
    });

    it("should return true if property is a callback and value is not a function", () => {
      expect(PixiProperty.shouldRemoveAttribute(type, name, "value", { type: PixiProperty.CALLBACK })).toBeTruthy();
    });

    it("should return false if property is a callback and value is a function", () => {
      expect(PixiProperty.shouldRemoveAttribute(type, name, () => {}, { type: PixiProperty.CALLBACK })).toBeFalsy();
    });

    it("should return true if property is numeric and value is not a number", () => {
      expect(PixiProperty.shouldRemoveAttribute(type, name, NaN, { type: PixiProperty.NUMERIC })).toBeTruthy();
    });

    it("should return false if property is numeric and value is a number", () => {
      expect(PixiProperty.shouldRemoveAttribute(type, name, 42, { type: PixiProperty.NUMERIC })).toBeFalsy();
    });

    it("should return true if property is positive numeric and value is not a number", () => {
      expect(PixiProperty.shouldRemoveAttribute(type, name, NaN, { type: PixiProperty.POSITIVE_NUMERIC })).toBeTruthy();
    });

    it("should return true if property is positive numeric and value is negative", () => {
      expect(PixiProperty.shouldRemoveAttribute(type, name, -42, { type: PixiProperty.POSITIVE_NUMERIC })).toBeTruthy();
    });

    it("should return false if property is positive numeric and value is zero", () => {
      expect(PixiProperty.shouldRemoveAttribute(type, name, 0, { type: PixiProperty.POSITIVE_NUMERIC })).toBeFalsy();
    });

    it("should return false if property is positive numeric and value is a positive number", () => {
      expect(PixiProperty.shouldRemoveAttribute(type, name, 42, { type: PixiProperty.POSITIVE_NUMERIC })).toBeFalsy();
    });

    it("should return true if property is vector and value is not a vector", () => {
      expect(PixiProperty.shouldRemoveAttribute(type, name, "value", { type: PixiProperty.VECTOR })).toBeTruthy();
      expect(PixiProperty.shouldRemoveAttribute(type, name, [NaN], { type: PixiProperty.VECTOR })).toBeTruthy();
    });

    it("should return true if property is vector and value is a vector", () => {
      expect(PixiProperty.shouldRemoveAttribute(type, name, "2", { type: PixiProperty.VECTOR })).toBeFalsy();
      expect(PixiProperty.shouldRemoveAttribute(type, name, "13,37", { type: PixiProperty.VECTOR })).toBeFalsy();
      expect(PixiProperty.shouldRemoveAttribute(type, name, [1], { type: PixiProperty.VECTOR })).toBeFalsy();
      expect(PixiProperty.shouldRemoveAttribute(type, name, [0, 0], { type: PixiProperty.VECTOR })).toBeFalsy();
      expect(PixiProperty.shouldRemoveAttribute(type, name, { x: 0, y: 0 }, { type: PixiProperty.VECTOR })).toBeFalsy();
      expect(
        PixiProperty.shouldRemoveAttribute(type, name, new PIXI.Point(0, 0), { type: PixiProperty.VECTOR })
      ).toBeFalsy();
    });

    it("should return false otherwise", () => {
      expect(PixiProperty.shouldRemoveAttribute(type, name, "value", null)).toBeFalsy();
      expect(PixiProperty.shouldRemoveAttribute(type, name, 42, { type: PixiProperty.STRING })).toBeFalsy();
      expect(PixiProperty.shouldRemoveAttribute(type, name, "answer", { type: PixiProperty.STRING })).toBeFalsy();
    });
  });

  describe("getPropertyInfo", () => {
    it("types the names of the adapter table and reserves children and parent", () => {
      expect(PixiProperty.getPropertyInfo("buttonMode", adapter).type).toBe(PixiProperty.BOOLEAN);
      expect(PixiProperty.getPropertyInfo("alpha", adapter).type).toBe(PixiProperty.POSITIVE_NUMERIC);
      expect(PixiProperty.getPropertyInfo("x", adapter).type).toBe(PixiProperty.NUMERIC);
      expect(PixiProperty.getPropertyInfo("scale", adapter).type).toBe(PixiProperty.VECTOR);
      expect(PixiProperty.getPropertyInfo("click", adapter).type).toBe(PixiProperty.CALLBACK);
      expect(PixiProperty.getPropertyInfo("children", adapter).type).toBe(PixiProperty.RESERVED);
      expect(PixiProperty.getPropertyInfo("texture", adapter)).toBeNull();
      expect(PixiProperty.getPropertyInfo("constructor", adapter)).toBeNull();
    });

    it("reads each adapter's own table", () => {
      const other = { properties: { boolean: ["flag"], numeric: [], positiveNumeric: [], vector: [], callback: [] } };
      expect(PixiProperty.getPropertyInfo("flag", other).type).toBe(PixiProperty.BOOLEAN);
      expect(PixiProperty.getPropertyInfo("buttonMode", other)).toBeNull();
    });
  });

  describe("getStandardNames", () => {
    it("maps the lowercase typed names to their canonical names", () => {
      const names = PixiProperty.getStandardNames(adapter);
      expect(names.buttonmode).toBe("buttonMode");
      expect(names.tileposition).toBe("tilePosition");
      expect(names.click).toBe("click");
      expect(names.texture).toBeUndefined();
      expect(PixiProperty.getStandardNames(adapter)).toBe(names);
    });
  });

  describe("getCustomPropertyInfo", () => {
    it("checks the tag, then `*`, and only own keys", () => {
      const tagged = { type: () => true };
      const all = { type: () => true };
      PixiProperty.customProperties.TestTag = { a: tagged };
      PixiProperty.customProperties["*"] = { a: all, b: all };
      try {
        expect(PixiProperty.getCustomPropertyInfo("a", "TestTag")).toBe(tagged);
        expect(PixiProperty.getCustomPropertyInfo("b", "TestTag")).toBe(all);
        expect(PixiProperty.getCustomPropertyInfo("a", "Other")).toBe(all);
        expect(PixiProperty.getCustomPropertyInfo("constructor", "TestTag")).toBeNull();
      } finally {
        delete PixiProperty.customProperties.TestTag;
        delete PixiProperty.customProperties["*"];
      }
    });
  });
});
