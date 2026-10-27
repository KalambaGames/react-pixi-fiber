import { Container, Sprite, Stage } from "react-pixi-fiber";
// useSpritesheet source, frame names and rectangles: see the Features / Spritesheet example.
import bunnysData from "./assets/bunnys.json";
import bunnys from "./assets/bunnys.png";
import { useSpritesheet } from "./hooks/useSpritesheet";

export default function ContainerExample() {
  const { textures } = useSpritesheet(bunnys, bunnysData);
  const texture = textures.bunny;
  return (
    <Stage options={{ backgroundColor: 0x1099bb, height: 300, width: 400 }}>
      {texture && (
        <Container x={200} y={150}>
          {[-80, 0, 80].map(x => (
            <Sprite anchor={0.5} key={x} texture={texture} x={x} />
          ))}
        </Container>
      )}
    </Stage>
  );
}
