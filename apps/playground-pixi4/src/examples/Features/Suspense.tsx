import { Texture } from "pixi.js";
import React, { use } from "react";
import { Container, Sprite, Stage } from "react-pixi-fiber";
import bunnys from "./assets/bunnys.png";

// PixiJS 4 has no Texture.fromURL. The texture from Texture.fromImage loads in the background.
function fromURL(url: string) {
  const texture = Texture.fromImage(url);
  return new Promise<Texture>(resolve => {
    if (texture.baseTexture.hasLoaded) resolve(texture);
    else texture.baseTexture.once("loaded", () => resolve(texture));
  });
}

// Suspends until the image is downloaded, so the Suspense fallback covers the whole load.
const loading = new Map<string, Promise<Texture>>();
const textures = {
  read: (url: string) => {
    if (!loading.has(url)) loading.set(url, fromURL(url));
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
  height: 300,
  width: 400,
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
