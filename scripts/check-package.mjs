// Packs every published package the way it is published and checks which files Node and esbuild resolve.
// Run `pnpm build` first.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const root = fileURLToPath(new URL("..", import.meta.url));
const packagesDir = join(root, "packages");
const packages = readdirSync(packagesDir)
  .map(dir => ({
    dir: join(packagesDir, dir),
    pkg: JSON.parse(readFileSync(join(packagesDir, dir, "package.json"), "utf8")),
  }))
  .filter(({ pkg }) => !pkg.private);
const work = realpathSync(mkdtempSync(join(tmpdir(), "react-pixi-fiber-")));
// PixiJS 5 reads the DOM globals when it is imported, so the Node checks that import a PixiJS adapter define them first.
const preload = join(work, "dom.cjs");
writeFileSync(
  preload,
  `const { window } = new (require(${JSON.stringify(createRequire(import.meta.url).resolve("jsdom"))}).JSDOM)();\n` +
    "Object.defineProperty(globalThis, 'window', { value: window, configurable: true });\n" +
    "Object.defineProperty(globalThis, 'document', { value: window.document, configurable: true });\n"
);

// `pnpm publish --json` exports npm_config_json to the prepublishOnly hook, and `pnpm pack` would then print JSON instead of the tarball path.
const env = { ...process.env };
delete env.npm_config_json;
const run = (command, args, cwd = root) => execFileSync(command, args, { cwd, encoding: "utf8", env }).trim();

const failures = [];
const check = async (name, fn) => {
  try {
    await fn();
    console.log(`ok    ${name}`);
  } catch (error) {
    failures.push(name);
    console.log(`FAIL  ${name}\n${error.stdout || ""}${error.message}\n`);
  }
};

try {
  for (const { dir, pkg } of packages) {
    const name = pkg.name;
    const base = name.split("/").pop();
    // The builds import only peer dependencies, so nothing else has to be installed.
    const dom = pkg.peerDependencies?.["pixi.js"] ? ["--require", preload] : [];
    const peers = Object.keys(pkg.peerDependencies || {});
    const pkgWork = join(work, base);
    const installed = join(pkgWork, "node_modules", name);
    const entries = {
      esm: `import * as Mod from ${JSON.stringify(name)};\nconsole.log(Mod);\n`,
      cjs: `console.log(require(${JSON.stringify(name)}));\n`,
    };
    // pixi-8 builds `allClasses` as an entry of its own, which its main entry imports, so a bundle holds both.
    const chunks = existsSync(join(dir, "dist/es/all.development.js")) ? ["all", base] : [base];
    const built = (format, suffix) => chunks.map(chunk => `dist/${format}/${chunk}.${suffix}.js`);
    const files = {
      esDevelopment: built("es", "development"),
      esProduction: built("es", "production.min"),
      cjsDevelopment: [...built("cjs", "development"), "index.js"],
      cjsProduction: [...built("cjs", "production.min"), "index.js"],
    };

    // Files of the installed package that went into a bundle, relative to the package root.
    const packageFiles = paths =>
      paths
        .map(path => relative(installed, path))
        .filter(path => !path.startsWith("..") && path.endsWith(".js"))
        .sort();

    const bundleWithEsbuild = async (entry, { conditions = [], nodeEnv }) => {
      const result = await esbuild.build({
        absWorkingDir: pkgWork,
        entryPoints: [`./${entry}.js`],
        bundle: true,
        write: false,
        metafile: true,
        platform: "browser",
        external: peers,
        conditions,
        define: { "process.env.NODE_ENV": JSON.stringify(nodeEnv) },
        logLevel: "silent",
      });
      return packageFiles(Object.keys(result.metafile.inputs).map(path => join(pkgWork, path)));
    };

    mkdirSync(installed, { recursive: true });
    const tarball = run("pnpm", ["pack", "--pack-destination", pkgWork], dir).split("\n").pop();

    await check(`${name} publint`, () => run("pnpm", ["exec", "publint", "--strict", tarball]));
    await check(`${name} attw`, () => run("pnpm", ["exec", "attw", tarball]));

    run("tar", ["-xzf", tarball, "-C", installed, "--strip-components=1"]);
    for (const [entry, source] of Object.entries(entries)) writeFileSync(join(pkgWork, `${entry}.js`), source);

    const require = createRequire(join(pkgWork, "index.js"));
    await check(`${name} node require`, () => {
      assert.equal(require.resolve(name), join(installed, "index.js"));
    });
    await check(`${name} node import`, () => {
      const resolve = specifier =>
        run(
          "node",
          ["--input-type=module", "-e", `console.log(import.meta.resolve(${JSON.stringify(specifier)}))`],
          pkgWork
        );
      assert.equal(fileURLToPath(resolve(name)), join(installed, "index.js"));
    });
    await check(`${name} deep imports are not exported`, () => {
      assert.throws(() => require.resolve(`${name}/dist/cjs/${base}.development.js`), {
        code: "ERR_PACKAGE_PATH_NOT_EXPORTED",
      });
    });
    await check(`${name} has no UMD build, prop-types peer or react-pixi-alias subpath`, () => {
      assert.ok(!existsSync(join(installed, "umd")), "umd/ is packed");
      assert.equal(pkg.peerDependencies?.["prop-types"], undefined);
      assert.throws(() => require.resolve(`${name}/react-pixi-alias`), { code: "ERR_PACKAGE_PATH_NOT_EXPORTED" });
    });

    // Subpaths other than the entry point, for example `@react-pixi-fiber/pixi-8/compat/pixi6`.
    const subpaths = Object.keys(pkg.exports || {})
      .filter(key => key !== "." && key !== "./package.json")
      .map(key => `${name}${key.slice(1)}`);
    for (const subpath of subpaths) {
      await check(`${subpath} node require and import`, () => {
        const file = require.resolve(subpath);
        assert.ok(file.startsWith(installed) && existsSync(file), file);
        const imported = run(
          "node",
          ["--input-type=module", "-e", `console.log(import.meta.resolve(${JSON.stringify(subpath)}))`],
          pkgWork
        );
        assert.equal(fileURLToPath(imported), file);
      });
    }
    const subpathImports = subpaths.map(subpath => `import ${JSON.stringify(subpath)};\n`).join("");

    // The default export is called at run time and the types are read from the declarations, so the peers have to
    // resolve: link the ones the workspace installed, optional ones such as @types/pixi.js included. Nothing else is
    // linked, so the type check sees what a consumer gets.
    for (const peer of peers) {
      const source = join(dir, "node_modules", peer);
      if (!existsSync(source)) continue;
      const target = join(pkgWork, "node_modules", peer);
      mkdirSync(join(target, ".."), { recursive: true });
      const real = realpathSync(source);
      symlinkSync(real, target);
      // A pnpm store entry keeps the dependencies of a peer next to it. preserveSymlinks hides them from the type check,
      // so link them the way a flat install has them.
      const store = real.slice(0, real.lastIndexOf("/node_modules/") + "/node_modules".length);
      if (real.includes("/node_modules/.pnpm/")) {
        for (const entry of readdirSync(store)) {
          for (const dep of entry.startsWith("@")
            ? readdirSync(join(store, entry)).map(d => `${entry}/${d}`)
            : [entry]) {
            const link = join(pkgWork, "node_modules", dep);
            if (existsSync(link) || dep === peer) continue;
            mkdirSync(join(link, ".."), { recursive: true });
            symlinkSync(join(store, dep), link);
          }
        }
      }
    }
    const hasDefault = /\bas default\b|export default/.test(
      readFileSync(join(installed, `dist/es/${base}.d.mts`), "utf8")
    );
    const callable = "const callable: (...args: never[]) => unknown =";
    // skipLibCheck hides an unresolved import, which turns its types into `any`. Assigning a value to a `number`
    // only fails when the value has a real type, so the @ts-expect-error line breaks the check if the types collapse.
    const notAny = value => `// @ts-expect-error\nconst notAny${counter++}: number = ${value};\n`;
    let counter = 0;
    // An adapter fills the core's `PixiInstances` with the classes of its PixiJS, so it is a PixiJS type that must resolve.
    const pixiTypes = pkg.peerDependencies?.["pixi.js"]
      ? `import type { PixiInstances } from "react-pixi-fiber";\n${notAny('null as unknown as PixiInstances["Container"]')}`
      : "";
    // A compat subpath default-exports the translator that the factory takes as `compat`. Its declarations add the
    // translated props to the core's `PixiExtraProps`, so reading one of them fails when the augmentation is lost.
    const compat = subpaths.filter(subpath => subpath.includes("/compat/"));
    const compatTypes = (factory, load) =>
      compat.map((subpath, i) => `${load(`compat${i}`, subpath)}${factory}({ compat: compat${i} });\n`).join("") +
      (compat.length > 0
        ? 'import type { PixiExtraProps } from "react-pixi-fiber";\nconst buttonMode: PixiExtraProps["buttonMode"] = true;\nconsole.log(buttonMode);\n'
        : "");
    writeFileSync(
      join(pkgWork, "a.mts"),
      subpathImports +
        (hasDefault
          ? `import factory from ${JSON.stringify(name)};\n${callable} factory;\n${notAny("factory")}${pixiTypes}${compatTypes("factory", (id, subpath) => `import ${id} from ${JSON.stringify(subpath)};\n`)}console.log(callable);\n`
          : `import * as mod from ${JSON.stringify(name)};\nconsole.log(mod);\n`)
    );
    writeFileSync(
      join(pkgWork, "a.cts"),
      subpathImports +
        (hasDefault
          ? `import * as mod from ${JSON.stringify(name)};\n${callable} mod.default;\n${notAny("mod.default")}${pixiTypes}${compatTypes("mod.default", (id, subpath) => `import * as ${id}Mod from ${JSON.stringify(subpath)};\nconst ${id} = ${id}Mod.default;\n`)}console.log(callable);\n`
          : `import * as mod from ${JSON.stringify(name)};\nconsole.log(mod);\n`)
    );
    writeFileSync(
      join(pkgWork, "tsconfig.json"),
      JSON.stringify({
        compilerOptions: {
          module: "node16",
          moduleResolution: "node16",
          strict: true,
          noEmit: true,
          // Resolve from the temporary directory, not from the real path of a linked peer inside the workspace.
          preserveSymlinks: true,
          skipLibCheck: true,
          types: [],
        },
        include: ["a.mts", "a.cts"],
      })
    );
    await check(`${name} types resolve under node16`, () =>
      run("pnpm", ["exec", "tsc", "-p", join(pkgWork, "tsconfig.json")])
    );
    if (hasDefault) {
      // The factory installs the compat translator it is given.
      const compatCalls = compat
        .map(
          (subpath, i) =>
            `if (factory({ compat: compat${i} }).translateProps !== compat${i}) throw new Error(${JSON.stringify(subpath)});\n`
        )
        .join("");
      await check(`${name} default export is callable from node ESM`, () => {
        writeFileSync(
          join(pkgWork, "default.mjs"),
          `import factory from ${JSON.stringify(name)};\n${compat.map((subpath, i) => `import compat${i} from ${JSON.stringify(subpath)};\n`).join("")}if (typeof factory !== "function") throw new Error(typeof factory);\n${compatCalls}`
        );
        run("node", [...dom, "default.mjs"], pkgWork);
      });
      await check(`${name} default export is callable from node CJS`, () => {
        writeFileSync(
          join(pkgWork, "default.cjs"),
          `const mod = require(${JSON.stringify(name)});\nconst factory = mod.default ?? mod;\n${compat.map((subpath, i) => `const compat${i} = require(${JSON.stringify(subpath)}).default;\n`).join("")}if (typeof factory !== "function") throw new Error(typeof factory);\n${compatCalls}`
        );
        run("node", [...dom, "default.cjs"], pkgWork);
      });
    }
    if (name !== "react-pixi-fiber") {
      await check(`${name} build does not import the core at run time`, () => {
        for (const file of readdirSync(installed, { recursive: true }).filter(file => file.endsWith(".js"))) {
          assert.doesNotMatch(
            readFileSync(join(installed, file), "utf8"),
            /(?:\bfrom|\bimport\s*\(?|\brequire\()\s*["']react-pixi-fiber["']/,
            file
          );
        }
      });
    }
    // Node ESM reads the named exports of the CommonJS entry by static analysis, so one that the entry does not spell
    // out is missing there although the ES build has it.
    for (const [key, conditions] of Object.entries(pkg.exports || {})) {
      if (key === "./package.json") continue;
      const specifier = `${name}${key.slice(1)}`;
      await check(`${specifier} named exports from node ESM match the ES build`, () => {
        writeFileSync(
          join(pkgWork, "named.mjs"),
          `import * as node from ${JSON.stringify(specifier)};\n` +
            `const es = await import(${JSON.stringify(join(installed, conditions.import.development))});\n` +
            "const missing = Object.keys(es).filter(name => !(name in node));\n" +
            'if (missing.length > 0) throw new Error(`missing: ${missing.join(", ")}`);\n'
        );
        run("node", [...dom, "named.mjs"], pkgWork);
      });
    }

    if (compat.length > 0) {
      await check(`${name} production entry holds no compat code`, () => {
        for (const file of [`dist/es/${base}.production.min.js`, `dist/cjs/${base}.production.min.js`]) {
          assert.doesNotMatch(readFileSync(join(installed, file), "utf8"), /["'`]touchendoutside["'`]/, file);
        }
      });
    }
    await check(`${name} esbuild import`, async () =>
      assert.deepEqual(await bundleWithEsbuild("esm", { nodeEnv: "production" }), files.esProduction)
    );
    await check(`${name} esbuild import, development condition`, async () =>
      assert.deepEqual(
        await bundleWithEsbuild("esm", { conditions: ["development"], nodeEnv: "development" }),
        files.esDevelopment
      )
    );
    await check(`${name} esbuild require, production`, async () =>
      assert.deepEqual(await bundleWithEsbuild("cjs", { nodeEnv: "production" }), files.cjsProduction)
    );
    await check(`${name} esbuild require, development`, async () =>
      assert.deepEqual(await bundleWithEsbuild("cjs", { nodeEnv: "development" }), files.cjsDevelopment)
    );
  }
} finally {
  rmSync(work, { recursive: true, force: true });
}

if (failures.length > 0) {
  console.log(`\n${failures.length} check(s) failed`);
  process.exit(1);
}
