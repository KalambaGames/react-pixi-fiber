import { transform } from "sucrase";

export type CompileResult = { ok: true; code: string } | { ok: false; message: string; line?: number; column?: number };

export function compile(source: string): CompileResult {
  try {
    const { code } = transform(source, {
      filePath: "example.tsx",
      jsxRuntime: "automatic",
      production: true,
      transforms: ["jsx", "typescript", "imports"],
    });
    return { ok: true, code };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const location = /\((\d+):(\d+)\)\s*$/.exec(message);
    return location
      ? { ok: false, message, line: Number(location[1]), column: Number(location[2]) }
      : { ok: false, message };
  }
}
