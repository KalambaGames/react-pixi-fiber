// Fox: © 2014, Public, CC0 1.0 (https://creativecommons.org/publicdomain/zero/1.0/legalcode), PixelMannen for Model.
// © 2014, tomkranis, CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/legalcode),
// tomkranis for Rigging & Animation.
// © 2017, @AsoboStudio and @scurest, CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/legalcode),
// @AsoboStudio and @scurest for Conversion to glTF.
// The file is unchanged. See fox.glb.license.md.

import { useControls } from "leva";

import { Stage } from "react-pixi-fiber";
import { Camera3D, DirectionalLight, Model3D, OrbitCamera, View3D } from "@react-pixi-fiber/pixi3d-0";

import model from "./assets/fox.glb?url";
import { Floor, fog } from "./components/Floor";
import { useModel } from "./hooks/useModel";

const start: [number, number, number] = [3, 2.4, 5];
// The origin of the Fox is between its feet, so it stands on the floor at y 0.
// The target is above its middle, so it stands low in the frame.
const target: [number, number, number] = [0, 1.6, 0];

function Model({ clip }: { clip: string }) {
  const source = useModel(model); // null while the file loads
  // autoPlay is read only by the constructor, so a new key builds a new model for another clip.
  return source && <Model3D autoPlay={clip} key={clip} scale={0.025} source={source} />;
}

export default function Model3DExample() {
  const { clip } = useControls({ clip: { options: ["Run", "Survey", "Walk"], value: "Walk" } });
  return (
    <Stage options={{ background: 0x1099bb, height: 300, width: 400 }}>
      <View3D autoResize fog={fog} environment={{ groundColor: 0x3a3028, skyColor: 0xbfd4ff }}>
        <Camera3D position={start} />
        <OrbitCamera enableDamping maxDistance={12} maxPolarAngle={1.45} minDistance={3} target={target} />
        <DirectionalLight intensity={3} rotation={[-0.8, 0.4, 0]} />
        <Model clip={clip} />
        <Floor />
      </View3D>
    </Stage>
  );
}
