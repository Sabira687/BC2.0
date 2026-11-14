/** Small display strings for the console (pure): the "inserted" chip and what capture just earned. */
import type { Captured } from "./capture";
import { getTechnique } from "./content";
import type { ItemKind, Stars } from "./types";

export function starsText(n: Stars | number): string {
  const k = Math.max(0, Math.min(3, n));
  return "★".repeat(k) + "☆".repeat(3 - k);
}

/** Lines for the hint area, from what Claude's last reply newly gave the player (see gainOf). */
export function captureNotices(c: Captured): string[] {
  const out: string[] = [];
  if (c.activated) out.push(`${c.activated.toUpperCase()} card activated`);
  if (c.learnStars) out.push(`✅ Check passed · ${starsText(c.learnStars.stars)}`);
  for (const code of c.stamps) out.push(`Stamp earned: ${getTechnique(code).name}`);
  return out;
}

/**
 * A reply's gain, keyed to the conversation length it was captured at: it disappears as soon as the
 * conversation changes (send, card inserted, Help used, start over, failed or stopped reply).
 */
export function gainFor(entry: { gain: Captured; at: number } | null, messageCount: number): Captured | null {
  return entry && entry.at === messageCount ? entry.gain : null;
}
