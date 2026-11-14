/**
 * Sanitizers for user-provided text that ends up inside item instructions.
 * Goal: a name or short phrase must never be able to add lines, markdown
 * structure, code fences or fake section headers to the instructions.
 */

export const NAME_MAX = 24;
export const DETAIL_MAX = 40;

// Letters (any script), combining marks, digits, space, and a few safe
// punctuation characters. Everything else (newlines, control chars,
// backticks, #, *, <, >, |, [, ], {, }, =, :, etc.) is dropped.
const NAME_ALLOWED = /[^\p{L}\p{M} .'-]/gu;
const DETAIL_ALLOWED = /[^\p{L}\p{M}\p{N} .,'&/+-]/gu;

function clean(input: unknown, allowed: RegExp, max: number): string {
  if (typeof input !== "string") return "";
  // Bound the work done on hostile input before running regexes.
  const bounded = input.slice(0, max * 8);
  const out = bounded
    .normalize("NFKC")
    .replace(/[\u0000-\u001f\u007f-\u009f\u2028\u2029]/g, " ") // control chars and line separators -> space
    .replace(/[\u200b-\u200f\u202a-\u202e\u2060-\u2069\ufeff]/g, "") // zero-width and bidi controls
    .replace(allowed, "")
    .replace(/\s+/g, " ")
    .replace(/([.'\-])\1+/g, "$1") // collapse runs like "----" or "..." (not "C++")
    .trim();
  return Array.from(out).slice(0, max).join("").trim();
}

/** Player name: letters, spaces, apostrophe, hyphen, period. "" when nothing usable is left. */
export function cleanName(input: unknown): string {
  const name = clean(input, NAME_ALLOWED, NAME_MAX);
  return /\p{L}/u.test(name) ? name : "";
}

/** Like cleanName, but falls back to "Player". */
export function sanitizeName(input: unknown): string {
  return cleanName(input) || "Player";
}

/** Short free-text detail (e.g. target role). May return "". */
export function sanitizeDetail(input: unknown): string {
  const detail = clean(input, DETAIL_ALLOWED, DETAIL_MAX);
  return /[\p{L}\p{N}]/u.test(detail) ? detail : "";
}

export const AGE_MIN = 16;
export const AGE_MAX = 99;

/** Integer age in [16, 99], or null when invalid. */
export function parseAge(input: unknown): number | null {
  const n = typeof input === "number" ? input : typeof input === "string" && /^\s*\d{1,3}\s*$/.test(input) ? Number(input) : NaN;
  if (!Number.isInteger(n) || n < AGE_MIN || n > AGE_MAX) return null;
  return n;
}

/**
 * Origin used in save links. Only a bare http(s) origin is accepted;
 * anything else falls back to the default.
 */
export const DEFAULT_APP_URL = "https://aigo.app";
export function sanitizeAppUrl(input: unknown): string {
  if (typeof input !== "string") return DEFAULT_APP_URL;
  return /^https?:\/\/[a-z0-9.-]{1,253}(:\d{1,5})?$/i.test(input) ? input.toLowerCase() : DEFAULT_APP_URL;
}
