import { Texture } from "pixi.js";
import React, { use } from "react";
import { Container, Sprite, Stage } from "react-pixi-fiber";
import bunnys from "./assets/bunnys.png";

// Suspends until the image is downloaded, so the Suspense fallback covers the whole load.
const loading = new Map<string, Promise<Texture>>();
const textures = {
  read: (url: string) => {
    if (!loading.has(url)) loading.set(url, Texture.fromURL(url));
    return use(loading.get(url) as Promise<Texture>);
  },
};

type TextureRendererProps = {
  assetUrl: string;
  children: (props: { texture: Texture }) => React.ReactElement;
};

function TextureRenderer({ assetUrl, children }: TextureRendererProps) {
  return children({ texture: textures.read(assetUrl) });
}

const OPTIONS = {
  backgroundColor: 0x1099bb,
  height: 600,
  width: 800,
};

function SuspenseExample() {
  return (
    <Stage options={OPTIONS}>
      <Container>
        <React.Suspense fallback={null}>
          <TextureRenderer assetUrl={bunnys}>{({ texture }) => <Sprite texture={texture} />}</TextureRenderer>
        </React.Suspense>
      </Container>
    </Stage>
  );
}

export default SuspenseExample;
