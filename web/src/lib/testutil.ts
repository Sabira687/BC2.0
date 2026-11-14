/**
 * Test helpers (not shipped code): deterministic randomness and small utilities.
 */
import type { RandomBytes } from "./tokens";
import type { KeyValueStorage } from "./store";
import type {
  Goal,
  Level,
  Plan,
  PracticalOutcome,
  Profile,
  QuestionOutcome,
  Reason,
  Style,
  TaskOutcomes,
} from "./types";
import { JOHN } from "./profile";

/** mulberry32 PRNG → RandomBytes. Same seed, same bytes. */
export function seededRandom(seed = 1): RandomBytes {
  let a = seed >>> 0;
  const next = (): number => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return (t ^ (t >>> 14)) >>> 0;
  };
  return (n: number) => {
    const out = new Uint8Array(n);
    for (let i = 0; i < n; i++) out[i] = next() & 255;
    return out;
  };
}

/** Lines of `text` that are outside the hidden base64 block of a packed item. */
export function visiblePart(item: string, open: string, close: string): string {
  const s = item.indexOf(open);
  const e = item.indexOf(close);
  if (s < 0 || e < 0) return item;
  return item.slice(0, s) + item.slice(e + close.length);
}

/** In-memory localStorage stand-in. */
export class MemoryStorage implements KeyValueStorage {
  data = new Map<string, string>();
  getItem(k: string): string | null {
    return this.data.has(k) ? this.data.get(k)! : null;
  }
  setItem(k: string, v: string): void {
    this.data.set(k, String(v));
  }
  removeItem(k: string): void {
    this.data.delete(k);
  }
}

/** Storage whose every call throws (privacy mode, quota). */
export const throwingStorage: KeyValueStorage = {
  getItem() {
    throw new Error("SecurityError");
  },
  setItem() {
    throw new Error("QuotaExceededError");
  },
  removeItem() {
    throw new Error("SecurityError");
  },
};

const Q: readonly QuestionOutcome[] = ["right", "wrong"];
const P: readonly PracticalOutcome[] = ["pass", "rewrite", "fail"];

/** Every combination of TEST outcomes: 2^3 × 3^2 = 72. */
export const ALL_OUTCOMES: readonly TaskOutcomes[] = Q.flatMap((q1) =>
  Q.flatMap((q2) => Q.flatMap((q3) => P.flatMap((p4) => P.map((p5): TaskOutcomes => [q1, q2, q3, p4, p5])))),
);

/** Reference score: 10 per right question, 35 per passed (or rewritten) practical task. */
export function expectedScore(t: TaskOutcomes): number {
  return t.slice(0, 3).filter((o) => o === "right").length * 10 + t.slice(3).filter((o) => o !== "fail").length * 35;
}

export const LEVELS: readonly Level[] = ["chatbot", "tried_agent", "regular_agent"];
export const GOALS: readonly Goal[] = ["everyday", "power", "automator", "jarvis"];
export const REASONS: readonly Reason[] = ["grow_job", "career_switch", "own_project"];
export const STYLES: readonly Style[] = ["straight", "mentor", "game"];
export const PLANS: readonly Plan[] = ["free", "pro", "max"];

/** Every questionnaire combination (levels × goals × reasons × styles × plans), John otherwise. */
export function* allProfiles(base: Profile = JOHN): Generator<Profile> {
  for (const level of LEVELS)
    for (const goal of GOALS)
      for (const reason of REASONS)
        for (const style of STYLES) for (const plan of PLANS) yield { ...base, level, goal, reason, style, plan };
}

/** True when `token` appears in `text` as a standalone run (not inside a longer [A-Z0-9] word). */
export function containsToken(text: string, token: string): boolean {
  return new RegExp(`(?<![A-Z0-9])${token}(?![A-Z0-9])`).test(text);
}
