export default function warning(condition: unknown, message: string, ...args: unknown[]): void {
  if (condition) return;
  let index = 0;
  const text = `Warning: ${message.replace(/%s/g, () => String(args[index++]))}`;
  if (typeof console !== "undefined") {
    console.error(text);
  }
  try {
    // Break on this line to find the caller.
    throw new Error(text);
  } catch (x) {}
}
