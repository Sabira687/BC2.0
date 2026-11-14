/** Card reveal timeline (~2.1 s, max 2.5 s): the card is already yours, nothing is random. */
export type RevealPhase = "silhouette" | "sheen" | "glow" | "pause" | "flip" | "new" | "done";

/** Phase start times in ms (300 sheen, 300 glow, 800 pause, 300 flip, 400 new). */
export const REVEAL_STEPS: readonly { phase: RevealPhase; at: number }[] = [
  { phase: "silhouette", at: 0 },
  { phase: "sheen", at: 300 },
  { phase: "glow", at: 600 },
  { phase: "pause", at: 900 },
  { phase: "flip", at: 1700 },
  { phase: "new", at: 2000 },
  { phase: "done", at: 2400 },
];

export const REVEAL_TOTAL_MS = 2400;

export function revealPhaseAt(ms: number): RevealPhase {
  let out: RevealPhase = "silhouette";
  for (const s of REVEAL_STEPS) if (ms >= s.at) out = s.phase;
  return out;
}

/** Compact per-card timeline when several cards play in a row (~2.2 s each). */
const COMPACT_STEPS: readonly { phase: RevealPhase; at: number }[] = [
  { phase: "silhouette", at: 0 },
  { phase: "sheen", at: 250 },
  { phase: "glow", at: 500 },
  { phase: "pause", at: 750 },
  { phase: "flip", at: 1300 },
  { phase: "new", at: 1550 },
];
const COMPACT_CARD_MS = 2200;

export interface RevealEvent {
  at: number;
  index: number;
  phase: RevealPhase;
}

/** Events for revealing `count` cards in order; a single "done" event closes the whole sequence. */
export function revealSequence(count: number): RevealEvent[] {
  if (count <= 1) return REVEAL_STEPS.map((s) => ({ at: s.at, index: 0, phase: s.phase }));
  const out: RevealEvent[] = [];
  for (let i = 0; i < count; i++) for (const s of COMPACT_STEPS) out.push({ at: i * COMPACT_CARD_MS + s.at, index: i, phase: s.phase });
  out.push({ at: count * COMPACT_CARD_MS, index: count - 1, phase: "done" });
  return out;
}
