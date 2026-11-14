/**
 * Packing item text: UTF-8 → base64 (76-char lines) inside a visible ASCII header.
 * Works in both the browser and Node (no Buffer, no btoa on non-Latin1 input).
 */

const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

export function base64Encode(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let out = "";
  let i = 0;
  for (; i + 2 < bytes.length; i += 3) {
    const n = (bytes[i]! << 16) | (bytes[i + 1]! << 8) | bytes[i + 2]!;
    out += B64[(n >> 18) & 63]! + B64[(n >> 12) & 63]! + B64[(n >> 6) & 63]! + B64[n & 63]!;
  }
  const rest = bytes.length - i;
  if (rest === 1) {
    const n = bytes[i]! << 16;
    out += B64[(n >> 18) & 63]! + B64[(n >> 12) & 63]! + "==";
  } else if (rest === 2) {
    const n = (bytes[i]! << 16) | (bytes[i + 1]! << 8);
    out += B64[(n >> 18) & 63]! + B64[(n >> 12) & 63]! + B64[(n >> 6) & 63]! + "=";
  }
  return out;
}

const B64_INDEX: Record<string, number> = Object.fromEntries([...B64].map((c, i) => [c, i]));

/** Strict decoder (used by tests and debugging). Throws on invalid input. */
export function base64Decode(b64: string): string {
  const clean = b64.replace(/\s+/g, "");
  if (clean.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(clean)) throw new Error("invalid base64");
  const pad = clean.endsWith("==") ? 2 : clean.endsWith("=") ? 1 : 0;
  const bytes = new Uint8Array((clean.length / 4) * 3 - pad);
  let p = 0;
  for (let i = 0; i < clean.length; i += 4) {
    const n =
      (B64_INDEX[clean[i]!]! << 18) |
      (B64_INDEX[clean[i + 1]!]! << 12) |
      ((B64_INDEX[clean[i + 2]!] ?? 0) << 6) |
      (B64_INDEX[clean[i + 3]!] ?? 0);
    if (p < bytes.length) bytes[p++] = (n >> 16) & 255;
    if (p < bytes.length) bytes[p++] = (n >> 8) & 255;
    if (p < bytes.length) bytes[p++] = n & 255;
  }
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}

export function wrapLines(s: string, width = 76): string {
  const lines: string[] = [];
  for (let i = 0; i < s.length; i += width) lines.push(s.slice(i, i + width));
  return lines.join("\n");
}

export const DATA_OPEN = "⟦item-data v1⟧";
export const DATA_CLOSE = "⟦/item-data⟧";

const BOX_INNER = 32;

function boxLine(text: string): string {
  const chars = Array.from(text);
  const fitted = chars.length > BOX_INNER ? chars.slice(0, BOX_INNER).join("") : text + " ".repeat(BOX_INNER - chars.length);
  return ` │ ${fitted} │`;
}

/** Visible item card: 2 lines of label text in a box. Only trusted text goes here. */
export function itemHeader(title: string, subtitle: string): string {
  const bar = "─".repeat(BOX_INNER + 2);
  return [` ┌${bar}┐`, boxLine(title), boxLine(subtitle), ` └${bar}┘`].join("\n");
}

/** Full pasteable item: visible header + base64 block of the hidden instructions. */
export function packItem(title: string, subtitle: string, instructions: string): string {
  return [itemHeader(title, subtitle), DATA_OPEN, wrapLines(base64Encode(instructions)), DATA_CLOSE].join("\n") + "\n";
}

/** Reverse of packItem (tests/debug). Returns the hidden instructions or null. */
export function unpackItem(item: string): string | null {
  const start = item.indexOf(DATA_OPEN);
  const end = item.indexOf(DATA_CLOSE);
  if (start < 0 || end < start) return null;
  try {
    return base64Decode(item.slice(start + DATA_OPEN.length, end));
  } catch {
    return null;
  }
}
