/** Small pure helpers for the Start notebook sheet. */
import { JOHN } from "./profile";
import { firstReply } from "./startpreview";
import { cleanName } from "./sanitize";

/** True when the name is no longer the locked demo answer (so it is shown in blue ink). */
export function isNameEdited(name: string): boolean {
  return cleanName(name) !== JOHN.name;
}

/** Greeting text shown in the right-hand preview for the chosen style. */
export function inkGreeting(style: "mentor" | "straight", name: string): string {
  return firstReply(style, name).text;
}

/** Sheet colours (mirrored in StartForm.module.css) and WCAG contrast helper. */
export const SHEET_COLORS = { sheet: "#fffefa", chosenSticker: "#eef2ff", pencil: "#5a5e66", off: "#626771", inkBlue: "#1d3fb8", stickerBorder: "#6b7280", error: "#b42318" } as const;

function lum(hex: string): number {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0]! + 0.7152 * c[1]! + 0.0722 * c[2]!;
}

export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
}

/** The tag above the name field: demo hint, confirmed answer, or a red name error. */
export function nameTag(valid: string | null, edited: boolean): { text: string; tone: "pencil" | "ink" | "error" } {
  if (valid === null) return { text: "CHECK THE NAME", tone: "error" };
  return edited ? { text: "YOUR ANSWER ✓", tone: "ink" } : { text: "DEMO · TYPE YOUR OWN", tone: "pencil" };
}
