async function pipe(bytes: Uint8Array<ArrayBuffer>, stream: CompressionStream | DecompressionStream) {
  const writer = stream.writable.getWriter();
  writer.write(bytes).catch(() => {});
  writer.close().catch(() => {});
  return new Uint8Array(await new Response(stream.readable).arrayBuffer());
}

export async function encodeCode(code: string): Promise<string> {
  const bytes = await pipe(new TextEncoder().encode(code), new CompressionStream("deflate-raw"));
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function decodeCode(data: string): Promise<string> {
  const binary = atob(data.replace(/-/g, "+").replace(/_/g, "/"));
  const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
  const decoded = await pipe(bytes, new DecompressionStream("deflate-raw"));
  return new TextDecoder("utf-8", { fatal: true }).decode(decoded);
}

export function parseHash(hash: string): { exampleId: string | null; code: string | null } {
  const [id, ...rest] = hash.replace(/^#/, "").split("&");
  const code = rest.find(part => part.startsWith("code="));
  return { exampleId: id || null, code: code ? code.slice("code=".length) : null };
}

export function buildHash(exampleId: string, encoded?: string): string {
  return encoded ? `#${exampleId}&code=${encoded}` : `#${exampleId}`;
}

export function hashCode(code: string): string {
  let hash = 0x811c9dc5;
  for (const byte of new TextEncoder().encode(code)) {
    hash = Math.imul(hash ^ byte, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}
