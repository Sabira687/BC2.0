/** Texts shared by the /api/chat route and the console (safe for the client bundle). */
export const COACH_RESTING_MESSAGE =
  "The live AI is resting. Copy an item from your collection into your own AI: it works the same.";

export function tooManyMessagesText(retryAfterSec: number): string {
  const s = Math.max(1, Math.ceil(retryAfterSec));
  const when =
    s <= 90 ? `${s} s` : s < 3600 ? `${Math.ceil(s / 60)} min` : s < 12 * 3600 ? `${Math.ceil(s / 3600)} h` : "tomorrow";
  return `Too many messages right now — try again ${when === "tomorrow" ? "tomorrow" : `in ${when}`}`;
}
