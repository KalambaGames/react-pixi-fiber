import * as React from "react";

import { Sprite, Stage } from "react-pixi-fiber";

// No PixiJS adapter is loaded here, so `PixiInstances` is empty and every tag accepts a loose record of props.
declare const anything: unknown;

const FallbackExample: React.FC = () => (
  <Stage options={{ width: 1 }} onInit={app => console.log(app.stage)}>
    <Sprite texture={anything} x={1} />
  </Stage>
);
console.log(FallbackExample);
