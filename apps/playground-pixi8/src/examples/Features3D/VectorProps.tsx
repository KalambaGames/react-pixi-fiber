import { CubeGeometry, Material3D } from "@pixi/3d";
import { Camera3D, DirectionalLight, Mesh3D, View3D } from "@react-pixi-fiber/pixi3d-0";
import { Stage } from "react-pixi-fiber";

const cube = new CubeGeometry();
const material = new Material3D({ baseColor: 0x4f9ed9, roughness: 0.9 });

export default function VectorPropsExample() {
  return (
    <Stage options={{ background: 0x1099bb, height: 300, width: 400 }}>
      <View3D autoResize>
        <Camera3D position={[0, 0, 8]} />
        <DirectionalLight intensity={3} rotation={[-0.8, 0.4, 0]} />
        {/* Position as an object */}
        <Mesh3D geometry={cube} material={material} position={{ x: -3, y: 1.5, z: 0 }} />
        {/* Position as an array of three numbers */}
        <Mesh3D geometry={cube} material={material} position={[-1, 1.5, 0]} />
        {/* Position as a comma delimited string */}
        <Mesh3D geometry={cube} material={material} position="1,1.5,0" />
        {/* Scale as one number for all three coordinates */}
        <Mesh3D geometry={cube} material={material} position={[3, 1.5, 0]} scale={0.5} />
        {/* The first three cubes below turn 45 degrees about y. Angle is in degrees */}
        <Mesh3D angle={[0, 45, 0]} geometry={cube} material={material} position={[-3, -1.5, 0]} />
        {/* Rotation is in radians */}
        <Mesh3D geometry={cube} material={material} position={[-1, -1.5, 0]} rotation={[0, Math.PI / 4, 0]} />
        {/* Quaternion as x, y, z, w */}
        <Mesh3D geometry={cube} material={material} position={[1, -1.5, 0]} quaternion={[0, 0.3827, 0, 0.9239]} />
        {/* One number or one-part string fills all coordinates, so this angle turns every axis */}
        <Mesh3D angle={45} geometry={cube} material={material} position={[3, -1.5, 0]} scale="0.5" />
      </View3D>
    </Stage>
  );
}
