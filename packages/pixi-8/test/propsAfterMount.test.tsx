import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import * as PIXI from "pixi.js";
import react18 from "@react-pixi-fiber/react-18";
import { configure, MeshPlane, MeshRope, MeshSimple, ParticleContainer, render } from "react-pixi-fiber";
import pixi8, { PerspectiveMesh } from "../src/index";

const texture = PIXI.Texture.WHITE;

describe("constructor options changed after mount", () => {
  let root: PIXI.Container;
  beforeEach(() => {
    configure({ react: react18(), pixi: pixi8() });
    root = new PIXI.Container();
  });
  afterEach(() => vi.restoreAllMocks());

  function show(element: React.ReactElement) {
    render(<React.StrictMode>{element}</React.StrictMode>, root);
    return root.children[0] as any;
  }
  const positions = (mesh: PIXI.Mesh) => mesh.geometry.getBuffer("aPosition").data.length;

  it("MeshSimple writes uvs, indices and topology to its geometry, and restores the defaults on removal", () => {
    const vertices = new Float32Array([0, 0, 1, 0, 1, 1]);
    const mesh = show(<MeshSimple texture={texture} vertices={vertices} />) as PIXI.MeshSimple;
    const uvs = new Float32Array([0, 0, 1, 0, 1, 1]);
    const indices = new Uint32Array([0, 1, 2]);
    // The MeshSimple prop types do not declare `topology`, and declare `indices` as Uint16Array.
    const options: Record<string, unknown> = { indices, topology: "triangle-strip", uvs };
    show(<MeshSimple texture={texture} vertices={vertices} {...options} />);
    const geometry = mesh.geometry as PIXI.MeshGeometry;
    expect(geometry.uvs).toBe(uvs);
    expect(geometry.indices).toBe(indices);
    expect(geometry.topology).toBe("triangle-strip");
    show(<MeshSimple texture={texture} vertices={vertices} />);
    expect(Array.from(geometry.uvs)).toEqual([0, 0, 0, 0, 0, 0]);
    expect(Array.from(geometry.indices)).toEqual([0, 1, 2, 0, 2, 3]);
    expect(geometry.topology).toBe("triangle-list");
  });

  it("MeshPlane rebuilds its geometry when verticesX or verticesY changes", () => {
    const mesh = show(<MeshPlane texture={texture} verticesX={2} verticesY={2} />) as PIXI.MeshPlane;
    expect(positions(mesh)).toBe(2 * 2 * 2);
    show(<MeshPlane texture={texture} verticesX={3} verticesY={4} />);
    expect(positions(mesh)).toBe(3 * 4 * 2);
  });

  it("MeshRope rebuilds its geometry when points or textureScale changes", () => {
    const two = [new PIXI.Point(0, 0), new PIXI.Point(10, 0)];
    const mesh = show(<MeshRope points={two} texture={texture} />) as PIXI.MeshRope;
    expect(positions(mesh)).toBe(2 * 4);
    const buffers = [...mesh.geometry.buffers];
    const three = [...two, new PIXI.Point(20, 0)];
    show(<MeshRope points={three} texture={texture} textureScale={2} />);
    expect(positions(mesh)).toBe(3 * 4);
    // The rope owns the geometry it replaces, so the buffers go with it.
    expect(buffers.map(buffer => buffer.destroyed)).toEqual([true, true, true]);
    expect((mesh.geometry as PIXI.RopeGeometry).points).toBe(three);
    expect((mesh.geometry as PIXI.RopeGeometry).textureScale).toBe(2);
  });

  it("PerspectiveMesh sets its corners, and keeps them when verticesX or verticesY rebuilds the geometry", () => {
    const mesh = show(<PerspectiveMesh texture={texture} verticesX={2} verticesY={2} />) as PIXI.PerspectiveMesh;
    show(<PerspectiveMesh texture={texture} verticesX={2} verticesY={2} x1={50} y2={70} />);
    const geometry = mesh.geometry as PIXI.PerspectivePlaneGeometry;
    expect(geometry.corners).toEqual([0, 0, 50, 0, 100, 70, 0, 100]);
    show(<PerspectiveMesh texture={texture} verticesX={3} verticesY={3} x1={50} y2={70} />);
    expect(positions(mesh)).toBe(3 * 3 * 2);
    expect(geometry.corners).toEqual([0, 0, 50, 0, 100, 70, 0, 100]);
    const fresh = new PIXI.PerspectiveMesh({ texture, verticesX: 3, verticesY: 3, x1: 50, y2: 70 });
    expect(Array.from(geometry.getBuffer("aPosition").data)).toEqual(
      Array.from(fresh.geometry.getBuffer("aPosition").data)
    );
  });

  it("MeshPlane rebuilds its geometry with 10 by 10 vertices when verticesX and verticesY are removed", () => {
    const mesh = show(<MeshPlane texture={texture} verticesX={2} verticesY={2} />) as PIXI.MeshPlane;
    show(<MeshPlane texture={texture} />);
    expect(positions(mesh)).toBe(10 * 10 * 2);
  });

  it("MeshRope keeps its points when they are removed, and sets textureScale back to 0", () => {
    const points = [new PIXI.Point(0, 0), new PIXI.Point(10, 0), new PIXI.Point(20, 0)];
    const mesh = show(<MeshRope points={points} texture={texture} textureScale={2} />) as PIXI.MeshRope;
    show(<MeshRope texture={texture} />);
    expect((mesh.geometry as PIXI.RopeGeometry).points).toBe(points);
    expect((mesh.geometry as PIXI.RopeGeometry).textureScale).toBe(0);
    expect(positions(mesh)).toBe(3 * 4);
  });

  it("PerspectiveMesh sets a removed corner back to its default", () => {
    const mesh = show(<PerspectiveMesh texture={texture} x1={50} y2={70} />) as PIXI.PerspectiveMesh;
    show(<PerspectiveMesh texture={texture} y2={70} />);
    expect((mesh.geometry as PIXI.PerspectivePlaneGeometry).corners).toEqual([0, 0, 100, 0, 100, 70, 0, 100]);
  });

  it("ParticleContainer warns once when dynamicProperties changes after mount", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const warnings = () =>
      error.mock.calls.filter(c => /reads `dynamicProperties` only in its constructor/.test(String(c[0])));
    show(<ParticleContainer dynamicProperties={{ position: true }} texture={texture} />);
    expect(warnings()).toHaveLength(0);
    show(<ParticleContainer dynamicProperties={{ position: false }} texture={texture} />);
    show(<ParticleContainer dynamicProperties={{ rotation: true }} texture={texture} />);
    expect(warnings()).toHaveLength(__DEV__ ? 1 : 0);
  });
});
