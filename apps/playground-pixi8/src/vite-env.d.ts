/// <reference types="vite/client" />
declare module "animated";
declare module "*/assets/bunnys.json" {
  const data: typeof import("./examples/assets/bunnys.json");
  export default data;
}
declare module "*/components/Floor" {
  export const Floor: typeof import("./examples/components/Floor").Floor;
  export const fog: typeof import("./examples/components/Floor").fog;
}
declare module "*/hooks/useModel" {
  export const useModel: typeof import("./examples/hooks/useModel").useModel;
}
declare module "*/hooks/useSpritesheet" {
  export const useSpritesheet: typeof import("./examples/hooks/useSpritesheet").useSpritesheet;
}
