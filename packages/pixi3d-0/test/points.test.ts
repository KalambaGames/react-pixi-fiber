import { Camera3D, Mesh3D, Sprite3D } from "@pixi/3d";
import { describe, expect, it } from "vitest";

import { clonePoint, isPoint, setPoint } from "../src/points";

const coordinates = (point: { x: number; y: number; z: number }) => [point.x, point.y, point.z];

describe("setPoint", () => {
  it("writes a member without a setter in place", () => {
    const camera = new Camera3D();
    const { jitter } = camera;
    expect(setPoint(camera, "jitter", [0.25, -0.25])).toBe(true);
    expect(camera.jitter).toBe(jitter);
    expect([jitter.x, jitter.y]).toEqual([0.25, -0.25]);
  });

  const forms: [unknown, number[]][] = [
    [{ x: 1, y: 2, z: 3 }, [1, 2, 3]],
    [
      [1, 2, 3],
      [1, 2, 3],
    ],
    ["1,2,3", [1, 2, 3]],
    [2, [2, 2, 2]],
    ["2", [2, 2, 2]],
  ];
  const cases: [string, unknown, number[]][] = [];
  for (const propName of ["angle", "origin", "position", "rotation", "scale"]) {
    for (const [value, expected] of forms) cases.push([propName, value, expected]);
  }

  it.each(cases)("sets %s from %j", (propName, value, expected) => {
    const mesh = new Mesh3D();
    expect(setPoint(mesh, propName, value)).toBe(true);
    const point = mesh[propName as "position"];
    coordinates(point).forEach((coordinate, i) => expect(coordinate).toBeCloseTo(expected[i]));
  });

  it.each([[{ x: 0, y: 0, z: 0, w: 1 }], [[0, 0, 0, 1]]])("sets quaternion from %j", value => {
    const mesh = new Mesh3D();
    mesh.quaternion = { x: 0.5, y: 0.5, z: 0.5, w: 0.5 };
    expect(setPoint(mesh, "quaternion", value)).toBe(true);
    expect([...coordinates(mesh.quaternion), mesh.quaternion.w]).toEqual([0, 0, 0, 1]);
  });

  it.each([[1], ["0,0,0,1"], [[1, 2, 3]]])("rejects %j on quaternion", value => {
    const mesh = new Mesh3D();
    expect(setPoint(mesh, "quaternion", value)).toBe(false);
  });

  it.each([[[0.5, 1]], [{ x: 0.5, y: 1 }], [0.5], ["0.5,1"]])("sets anchor of a Sprite3D from %j", value => {
    const sprite = new Sprite3D();
    expect(setPoint(sprite, "anchor", value)).toBe(true);
    expect(sprite.anchor.x).toBe(0.5);
    expect(sprite.anchor.y).toBe(typeof value === "number" ? 0.5 : 1);
  });

  it("rejects three coordinates on anchor of a Sprite3D", () => {
    expect(setPoint(new Sprite3D(), "anchor", [1, 2, 3])).toBe(false);
  });

  it.each([[null], [{}], [{ x: 1, y: 2 }], [[1, 2]], [[1, 2, 3, 4]], ["a"], [Number.NaN], [[1, Number.NaN, 3]]])(
    "rejects %j on position and writes nothing",
    value => {
      const mesh = new Mesh3D();
      mesh.position.set(4, 5, 6);
      expect(setPoint(mesh, "position", value)).toBe(false);
      expect(coordinates(mesh.position)).toEqual([4, 5, 6]);
    }
  );
});

describe("isPoint", () => {
  it("knows a plain Point", () => {
    expect(isPoint(new Camera3D().jitter)).toBe(true);
  });

  it("knows the points of a 3D node", () => {
    const mesh = new Mesh3D();
    expect(isPoint(mesh.position)).toBe(true);
    expect(isPoint(mesh.angle)).toBe(true);
    expect(isPoint(mesh.quaternion)).toBe(true);
    expect(isPoint(new Sprite3D().anchor)).toBe(true);
  });

  it.each([[{ x: 1, y: 2, z: 3 }], [[1, 2, 3]], [null]])("is false for %j", value => {
    expect(isPoint(value)).toBe(false);
  });
});

describe("clonePoint", () => {
  it("copies the coordinates into a plain object", () => {
    const mesh = new Mesh3D();
    mesh.position.set(1, 2, 3);
    const clone = clonePoint(mesh.position);
    expect(Object.keys(clone).sort()).toEqual(["x", "y", "z"]);
    expect(clone).not.toHaveProperty("_observer");
    expect(clone).toEqual({ x: 1, y: 2, z: 3 });
    mesh.position.set(9, 9, 9);
    expect(clone).toEqual({ x: 1, y: 2, z: 3 });
  });

  it("keeps w of a quaternion", () => {
    expect(clonePoint(new Mesh3D().quaternion)).toEqual({ x: 0, y: 0, z: 0, w: 1 });
  });

  it("keeps only x and y of a 2D point", () => {
    expect(Object.keys(clonePoint(new Sprite3D().anchor)).sort()).toEqual(["x", "y"]);
  });
});
