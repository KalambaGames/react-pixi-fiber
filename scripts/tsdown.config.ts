import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { esmExternalRequirePlugin } from "rolldown/plugins";
import { defineConfig, type TsdownHooks, type UserConfig } from "tsdown";

export interface PackageBuild {
  // Output basename: dist/<format>/<name>.<development|production.min>.js, declarations <name>.d.mts and <name>.d.ts
  name: string;
  // Further entry points, output path to source, for example { "compat/pixi6": "src/compat/pixi6.ts" }. They must not
  // import a module the main entry imports, or rolldown splits that module into a shared chunk.
  entries?: Record<string, string>;
  // Peer dependencies, left as imports
  external: string[];
  // Output formats, both by default. A package whose peers ship no CommonJS build has only "es".
  formats?: ("es" | "cjs")[];
  // Dependencies to inline, for example [/^react-reconciler/]
  bundle?: RegExp[];
  hooks?: Partial<TsdownHooks>;
  // Declarations are emitted by tsgo, which writes a source outside dirname(tsconfig) next to that source. An adapter
  // whose tsconfig maps `react-pixi-fiber` to the core's src/ builds with a tsconfig that does not.
  tsconfig?: string;
}

// The adapters' index.js sets module.exports to the default export (Node ESM default-imports module.exports), so their
// CommonJS declarations have to say `export =`; a plain `export default` would type the default import as the namespace.
const exportDefaultAsExportEquals: TsdownHooks["build:done"] = ({ chunks }) => {
  for (const chunk of chunks) {
    if (!chunk.fileName.endsWith(".d.ts")) continue;
    const path = join(chunk.outDir, chunk.fileName);
    const code = readFileSync(path, "utf8");
    // A declaration with only a default export already comes out as `export = <name>`; give it the `default` member
    // that index.js sets as well.
    const only = /^export = (\w+);$/m.exec(code);
    if (only && !code.includes(`declare namespace ${only[1]} `)) {
      writeFileSync(
        path,
        code.replace(only[0], `declare namespace ${only[1]} {\n  export { ${only[1]} as default };\n}\n${only[0]}`)
      );
      continue;
    }
    const match = /^export \{ (.*?) \};$/m.exec(code);
    const factory = match?.[1].match(/(\w+) as default/)?.[1];
    if (!match || !factory) continue;
    writeFileSync(
      path,
      code.replace(match[0], `declare namespace ${factory} {\n  export { ${match[1]} };\n}\nexport = ${factory};`)
    );
  }
};

export function createTsdownConfig({
  name,
  entries,
  external,
  formats = ["es", "cjs"],
  bundle = [],
  hooks,
  tsconfig,
}: PackageBuild) {
  const isProduction = process.env.NODE_ENV === "production";
  const suffix = isProduction ? "production.min" : "development";
  // One build per format, so every output lands in dist/<format>/.
  return defineConfig(
    formats.map(
      (format): UserConfig => ({
        entry: { [name]: "src/index.ts", ...entries },
        format,
        outDir: `dist/${format}`,
        // build:prod and build:dev write into the same directories
        clean: false,
        // Declarations next to the ES and CJS development output: publint wants .d.mts for the import condition,
        // attw wants the .d.ts that `typings` points at.
        dts: !isProduction,
        hash: false,
        platform: "browser",
        target: "es2018",
        // The source uses the classic React.createElement runtime.
        inputOptions: { transform: { jsx: "react" } },
        deps: { alwaysBundle: bundle, onlyBundle: false },
        // Marks the modules external and turns require() calls into imports; rolldown would otherwise keep
        // require("react") inside react-reconciler's development build, which breaks in browsers.
        plugins: [esmExternalRequirePlugin({ external })],
        hooks: {
          ...hooks,
          "build:done": async context => {
            if (format === "cjs") await exportDefaultAsExportEquals(context);
            await hooks?.["build:done"]?.(context);
          },
        },
        tsconfig,
        outputOptions: {
          // Fixed names instead of tsdown's defaults. Declaration chunks are named `<entry>.d`.
          entryFileNames: chunk =>
            chunk.name.endsWith(".d") ? (format === "es" ? "[name].mts" : "[name].ts") : `[name].${suffix}.js`,
          exports: "named",
          // Rollup always added the __esModule marker, rolldown only does with a default export.
          esModule: true,
        },
        define: {
          __DEV__: JSON.stringify(!isProduction),
          "process.env.NODE_ENV": JSON.stringify(isProduction ? "production" : "development"),
        },
        minify: isProduction,
        sourcemap: isProduction,
      })
    )
  );
}
