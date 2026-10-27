/// <reference types="vite/client" />
declare module "animated";
declare module "*/assets/bunnys.json" {
  const data: typeof import("./examples/assets/bunnys.json");
  export default data;
}
declare module "*/hooks/useSpritesheet" {
  export const useSpritesheet: typeof import("./examples/hooks/useSpritesheet").useSpritesheet;
}
