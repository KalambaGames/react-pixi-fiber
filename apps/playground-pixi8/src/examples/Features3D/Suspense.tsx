import { CubeGeometry, Material3D, SphereGeometry } from "@pixi/3d";
import { button, useControls } from "leva";
import { Suspense, use, useLayoutEffect, useState } from "react";

import { Stage, Text } from "react-pixi-fiber";
import { Camera3D, DirectionalLight, Mesh3D, OrbitCamera, View3D } from "@react-pixi-fiber/pixi3d-0";

import { Floor, fog } from "./components/Floor";

const cube = new CubeGeometry();
const sphere = new SphereGeometry();
const material = new Material3D({ baseColor: 0xe8a33d, roughness: 0.6 });
const outside: [number, number, number] = [0, 5, 12];
const inside: [number, number, number] = [3, 2, 3];
const target: [number, number, number] = [0, 0.5, 0];
const cubeAt: [number, number, number] = [0, 0.5, 0];
const sphereAt: [number, number, number] = [-2.5, 0.5, -1];

const delay = () => new Promise<void>(resolve => setTimeout(resolve, 1500));
const style = { fill: "white", fontFamily: "Arial", fontSize: 16 } as const;

// The layout effect cleans up when Suspense hides the boundary and runs again when it shows it.
function Reporter({ onShown }: { onShown: (shown: boolean) => void }) {
  useLayoutEffect(() => {
    onShown(true);
    return () => onShown(false);
  }, [onShown]);
  return null;
}

function Content({ onShown, promise }: { onShown: (shown: boolean) => void; promise: Promise<void> }) {
  use(promise);
  return (
    <>
      <Reporter onShown={onShown} />
      <Camera3D active position={inside} />
      <Mesh3D geometry={cube} material={material} position={cubeAt} />
    </>
  );
}

export default function SuspenseExample() {
  const [promise, setPromise] = useState(delay);
  const [shown, setShown] = useState(false);
  // A plain state update: a transition would keep the old content and skip the fallback.
  useControls({ "load again": button(() => setPromise(delay())) });
  return (
    <Stage options={{ background: 0x1099bb, height: 300, width: 400 }}>
      <View3D autoResize fog={fog}>
        <Camera3D position={outside} />
        <OrbitCamera enableDamping maxDistance={25} maxPolarAngle={1.45} minDistance={4} target={target} />
        <DirectionalLight intensity={3} rotation={[-0.8, 0.4, 0]} />
        <Mesh3D geometry={sphere} material={material} position={sphereAt} />
        {/* The fallback is null, as a 2D object cannot be a child of a View3D. */}
        {/* While hidden, the direct camera draws. */}
        <Suspense fallback={null}>
          <Content onShown={setShown} promise={promise} />
        </Suspense>
        <Floor />
      </View3D>
      {/* A 2D sibling after the view draws over it. */}
      <Text style={style} text={shown ? "Active camera (loaded)" : "Direct camera (loading)"} x={10} y={10} />
    </Stage>
  );
}
