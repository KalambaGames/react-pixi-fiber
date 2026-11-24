import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const packagesDir = fileURLToPath(new URL("../packages/", import.meta.url));

const reactModules = ["react", "react-dom", "react-test-renderer", "react/jsx-dev-runtime", "react/jsx-runtime"];

// `root` is the package directory. Shared test utilities live in the core, so React is aliased to the package's own
// copy: a React element must be created by the React version that renders it. `dist` resolves the workspace packages
// to their ES build instead of their source. Run `pnpm build` first. `ownModules` resolve from `root` for every
// importer, for a workspace package whose source would load another release. They are deduped, not aliased: an alias
// to the package directory loads its CommonJS build, next to the ES build that a dependency imports through Node.
export function createVitestConfig({
  setupFiles = [],
  root = process.cwd(),
  dist,
  ownModules = [],
}: {
  setupFiles?: string[];
  root?: string;
  dist?: "es";
  ownModules?: string[];
} = {}) {
  // test:dev and test:prod differ only in __DEV__ (`--mode development|production`). NODE_ENV stays "test" in both:
  // with NODE_ENV=production React has no act() and its context objects differ from the public API snapshot.
  return defineConfig(({ mode }) => {
    const isProduction = mode === "production";
    const entry = (name: string) =>
      dist ? `dist/${dist}/${name}.${isProduction ? "production.min" : "development"}.js` : "src/index.ts";
    return {
      // Classic React.createElement runtime, like the build. oxc infers the language from the extension.
      oxc: {
        include: /\.[jt]sx?$/,
        jsx: { runtime: "classic", pragma: "React.createElement", pragmaFrag: "React.Fragment" },
      },
      define: {
        __DEV__: JSON.stringify(!isProduction),
      },
      resolve: {
        dedupe: ownModules,
        alias: [
          ...reactModules
            .filter(name => existsSync(`${root}/node_modules/${name.split("/")[0]}`))
            .map(name => ({
              find: new RegExp(`^${name}$`),
              replacement: `${root}/node_modules/${name}`,
            })),
          { find: /^react-pixi-fiber$/, replacement: `${packagesDir}react-pixi-fiber/${entry("react-pixi-fiber")}` },
          {
            find: /^@react-pixi-fiber\/(react-1[789]|pixi-[4-8]|pixi3d-\d+)$/,
            replacement: `${packagesDir}$1/${entry("$1")}`,
          },
        ],
      },
      test: {
        environment: "jsdom",
        include: ["test/**/*.test.{js,jsx,ts,tsx}"],
        setupFiles: ["vitest-webgl-canvas-mock", ...setupFiles],
        coverage: {
          provider: "v8",
          include: ["src/**/*.{ts,tsx}"],
          reportsDirectory: `coverage/${isProduction ? "prod" : "dev"}`,
          reporter: ["json", "lcov", "text-summary"],
        },
      },
    };
  });
}
