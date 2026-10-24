import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  base: process.env.PLAYGROUND_SITE ? "/pixi-8/" : "/",
  plugins: [react(), tailwindcss()],
  // Development builds of React, react-pixi-fiber and the adapter in every mode, so the console shows warnings.
  // The workspace packages resolve their own devDependency copies of react, which differ from the one the app uses.
  resolve: { conditions: ["development", "module", "browser"], dedupe: ["react", "react-dom"] },
  // animated reads Node's `global`.
  define: { global: "globalThis", "process.env.NODE_ENV": JSON.stringify("development") },
  // The sandboxed iframe runs in the opaque origin "null" and fetches its scripts cross-origin.
  server: { cors: { origin: "null" } },
  build: {
    rollupOptions: {
      input: {
        index: resolve(import.meta.dirname, "index.html"),
        runner: resolve(import.meta.dirname, "runner.html"),
        runnerCompatPixi6: resolve(import.meta.dirname, "runner-compat-pixi6.html"),
        runnerCompatPixi7: resolve(import.meta.dirname, "runner-compat-pixi7.html"),
      },
    },
  },
});
