import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React, { createRef, StrictMode, Suspense } from "react";
import { act } from "react-test-renderer";
import * as PIXI from "pixi.js";
import * as PIXI3D from "@pixi/3d";
import pixi8 from "@react-pixi-fiber/pixi-8";
import react18 from "@react-pixi-fiber/react-18";
import { configure, Container, PIXIComponent, render, unmount } from "react-pixi-fiber";
import pixi3d0, {
  AmbientLight,
  BatchedMesh3D,
  Camera3D,
  Container3D,
  DirectionalLight,
  Mesh3D,
  Model3D,
  ParticleContainer3D,
  PointLight,
  SpotLight,
  Sprite3D,
  View3D,
} from "../src/index";

// A model with one mesh node, built by hand so that no file loads.
function modelSource(): PIXI3D.Scene3DSource {
  const source = new PIXI3D.Scene3DSource({
    scenes: [{ name: "main", children: [0] }],
    nodes: [{ label: "n", children: [], geometry: 0, materials: [0] }],
  });
  source.geometries.push([new PIXI3D.CubeGeometry()]);
  source.materials.push(new PIXI3D.Material3D());
  return source;
}

const meshesOf = (model: PIXI3D.Model3D): PIXI3D.Mesh3D[] => {
  const meshes: PIXI3D.Mesh3D[] = [];
  model.traverse(node => {
    if (node instanceof PIXI3D.Mesh3D) meshes.push(node);
  });
  return meshes;
};

describe("node tags", () => {
  let root: PIXI.Container;
  beforeEach(() => {
    configure({ react: react18(), pixi: pixi8(), pixi3d: pixi3d0() });
    root = new PIXI.Container();
  });
  afterEach(() => {
    unmount(root);
    vi.restoreAllMocks();
  });

  it("measures a size prop against the props that come after it in JSX", () => {
    const texture = new PIXI.Texture({ source: new PIXI.TextureSource({ width: 64, height: 128 }) });
    const geometry = new PIXI3D.CubeGeometry();
    const sprite = createRef<PIXI3D.Sprite3D>();
    const mesh = createRef<PIXI3D.Mesh3D>();
    render(
      <View3D>
        <Sprite3D ref={sprite} height={2} pixelSize={1 / 32} texture={texture} />
        <Mesh3D ref={mesh} depth={3} geometry={geometry} />
      </View3D>,
      root
    );
    expect(sprite.current!.height).toBeCloseTo(2);
    expect(mesh.current!.depth).toBeCloseTo(3);
  });

  describe("an explicit undefined rotation prop", () => {
    const q: [number, number, number, number] = [0, 0.3827, 0, 0.9239];
    const ref = createRef<PIXI3D.Mesh3D>();
    const show = (on: boolean) =>
      render(
        <View3D>
          <Mesh3D ref={ref} quaternion={on ? q : undefined} rotation={on ? undefined : [10, 20, 30]} />
        </View3D>,
        root
      );
    const expectQuaternion = () => {
      const mesh = ref.current!;
      mesh.updateLocalTransform();
      [mesh.quaternion.x, mesh.quaternion.y, mesh.quaternion.z, mesh.quaternion.w].forEach((coordinate, i) =>
        expect(coordinate).toBeCloseTo(q[i])
      );
    };

    it("keeps the quaternion at mount", () => {
      show(true);
      expectQuaternion();
    });

    it("keeps the quaternion when the props switch", () => {
      show(false);
      show(true);
      expectQuaternion();
    });
  });

  type Ref = React.RefObject<any>;
  const cases: [string, (ref: Ref) => React.ReactElement, abstract new (...args: any[]) => unknown][] = [
    ["AmbientLight", ref => <AmbientLight ref={ref} />, PIXI3D.AmbientLight],
    ["BatchedMesh3D", ref => <BatchedMesh3D ref={ref} size={4} />, PIXI3D.BatchedMesh3D],
    ["Camera3D", ref => <Camera3D ref={ref} />, PIXI3D.Camera3D],
    ["Container3D", ref => <Container3D ref={ref} />, PIXI3D.Container3D],
    ["DirectionalLight", ref => <DirectionalLight ref={ref} />, PIXI3D.DirectionalLight],
    ["Mesh3D", ref => <Mesh3D ref={ref} />, PIXI3D.Mesh3D],
    ["Model3D", ref => <Model3D ref={ref} source={modelSource()} />, PIXI3D.Model3D],
    ["ParticleContainer3D", ref => <ParticleContainer3D ref={ref} />, PIXI3D.ParticleContainer3D],
    ["PointLight", ref => <PointLight ref={ref} />, PIXI3D.PointLight],
    ["SpotLight", ref => <SpotLight ref={ref} />, PIXI3D.SpotLight],
    ["Sprite3D", ref => <Sprite3D ref={ref} />, PIXI3D.Sprite3D],
    ["View3D", ref => <View3D ref={ref} />, PIXI3D.View3D],
  ];

  // A view is a 2D object, so it renders in a `Container`, and every other tag in a view.
  it.each(cases)("renders %s", (tag, element, Class) => {
    const ref = createRef<any>();
    render(tag === "View3D" ? <Container>{element(ref)}</Container> : <View3D>{element(ref)}</View3D>, root);
    expect(ref.current).toBeInstanceOf(Class);
  });

  it("restores the class default", () => {
    const fresh = new PIXI3D.Mesh3D();
    const ref = createRef<PIXI3D.Mesh3D>();
    render(
      <View3D>
        <Mesh3D ref={ref} position={[1, 2, 3]} castShadow={!fresh.castShadow} />
      </View3D>,
      root
    );
    const mesh = ref.current!;
    expect(mesh.castShadow).toBe(!fresh.castShadow);
    render(
      <View3D>
        <Mesh3D ref={ref} />
      </View3D>,
      root
    );
    expect([mesh.position.x, mesh.position.y, mesh.position.z]).toEqual([0, 0, 0]);
    expect(mesh.castShadow).toBe(fresh.castShadow);
  });

  it("writes geometry and material after construction", () => {
    const fresh = new PIXI3D.Mesh3D();
    const geometry = new PIXI3D.CubeGeometry();
    const material = new PIXI3D.Material3D();
    const ref = createRef<PIXI3D.Mesh3D>();
    render(
      <View3D>
        <Mesh3D ref={ref} geometry={geometry} material={material} />
      </View3D>,
      root
    );
    const mesh = ref.current!;
    expect(mesh.geometry).toBe(geometry);
    expect(mesh.material).toBe(material);
    render(
      <View3D>
        <Mesh3D ref={ref} />
      </View3D>,
      root
    );
    expect(mesh.geometry).toBe(fresh.geometry);
    expect(mesh.material).toBe(fresh.material);
  });

  it("warns when a constructor-only prop changes", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const warnings = () => error.mock.calls.filter(c => /reads `source` only in its constructor/.test(String(c[0])));
    const a = modelSource();
    const ref = createRef<PIXI3D.Model3D>();
    const show = (source: PIXI3D.Scene3DSource) =>
      render(
        <StrictMode>
          <View3D>
            <Model3D ref={ref} source={source} />
          </View3D>
        </StrictMode>,
        root
      );
    show(a);
    expect(warnings()).toHaveLength(0);
    show(modelSource());
    expect(warnings()).toHaveLength(__DEV__ ? 1 : 0);
    expect(ref.current!.source).toBe(a);
  });

  it("passes the constructor-only props of a model", () => {
    const ref = createRef<PIXI3D.Model3D>();
    // A mesh casts a shadow by default, so `false` shows that the prop reached the built meshes.
    render(
      <View3D>
        <Model3D ref={ref} source={modelSource()} autoPlay={false} castShadow={false} />
      </View3D>,
      root
    );
    const meshes = meshesOf(ref.current!);
    expect(meshes).toHaveLength(1);
    expect(meshes[0].castShadow).toBe(false);
  });

  it("leaves a shared geometry and material alive on unmount", () => {
    const geometry = new PIXI3D.CubeGeometry();
    const material = new PIXI3D.Material3D();
    const ref = createRef<PIXI3D.Mesh3D>();
    render(
      <View3D>
        <Mesh3D ref={ref} geometry={geometry} material={material} />
      </View3D>,
      root
    );
    const mesh = ref.current!;
    unmount(root);
    expect(mesh.destroyed).toBe(true);
    expect(geometry.buffers).not.toBeNull();
    expect(material.destroyed).toBe(false);
  });

  it("uses the defaults of the options", () => {
    configure({
      react: react18(),
      pixi: pixi8(),
      pixi3d: pixi3d0({ defaults: { Mesh3D: { castShadow: false } } }),
    });
    const ref = createRef<PIXI3D.Mesh3D>();
    render(
      <View3D>
        <Mesh3D ref={ref} />
      </View3D>,
      root
    );
    expect(ref.current!.castShadow).toBe(false);
  });

  it("hides and reveals a node", async () => {
    let resolve!: () => void;
    let resolved = false;
    const promise = new Promise<void>(r => {
      resolve = () => {
        resolved = true;
        r();
      };
    });
    const Suspending = () => {
      if (!resolved) throw promise;
      return null;
    };
    const ref = createRef<PIXI3D.Mesh3D>();
    act(() =>
      render(
        <View3D>
          <Suspense fallback={null}>
            <Mesh3D ref={ref} />
            <Suspending />
          </Suspense>
        </View3D>,
        root
      )
    );
    const mesh = ref.current!;
    expect(mesh.visible).toBe(false);
    await act(async () => {
      resolve();
      await promise;
    });
    expect(mesh.visible).toBe(true);
  });

  it("gives a registered 3D class the 3D tables", () => {
    const Spinner = PIXIComponent("Spinner", {
      create: () => new PIXI3D.Mesh3D(),
    });
    const ref = createRef<PIXI3D.Mesh3D>();
    render(
      <View3D>
        <Spinner ref={ref} rotation={[0, 1, 0]} />
      </View3D>,
      root
    );
    expect([ref.current!.rotation.x, ref.current!.rotation.y, ref.current!.rotation.z]).toEqual([0, 1, 0]);
  });
});
