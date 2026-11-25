// Fox: © 2014, Public, CC0 1.0 (https://creativecommons.org/publicdomain/zero/1.0/legalcode), PixelMannen for Model.
// © 2014, tomkranis, CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/legalcode), tomkranis for Rigging & Animation.
// © 2017, @AsoboStudio and @scurest, CC BY 4.0, @AsoboStudio and @scurest for Conversion to glTF.
// The file is unchanged. See fox.glb.license.md.
import { Camera3D, DirectionalLight, Model3D, View3D } from "@react-pixi-fiber/pixi3d-0";
import { useControls } from "leva";
import { Stage } from "react-pixi-fiber";
import model from "./assets/fox.glb?url";
import { useModel } from "./hooks/useModel";

function Model({ clip }: { clip: string }) {
  const source = useModel(model); // null while the file loads
  // autoPlay is read only by the constructor, so a new key builds a new model for another clip.
  return source && <Model3D autoPlay={clip} key={clip} scale={0.025} source={source} />;
}

export default function Model3DExample() {
  const { clip } = useControls({ clip: { options: ["Run", "Survey", "Walk"], value: "Walk" } });
  return (
    <Stage options={{ background: 0x1099bb, height: 300, width: 400 }}>
      <View3D autoResize environment={{ groundColor: 0x3a3028, skyColor: 0xbfd4ff }}>
        <Camera3D position={[0, 1.5, 5]} rotation={[-0.2, 0, 0]} />
        <DirectionalLight intensity={3} rotation={[-0.8, 0.4, 0]} />
        <Model clip={clip} />
      </View3D>
    </Stage>
  );
}
