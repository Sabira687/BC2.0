/**
 * Progress screen view models (pure): stamp board, stamp passport and "what you can do
 * now". Real data only. The skill sky lives in ./sky.
 */
import type { AppState, ModuleId, TechniqueCode } from "./types";
import { CATALOG, MODULES, lessonForTechnique, tierOfSet } from "./content";
export { lessonForTechnique, type LessonRef } from "./content";
import { MODULE_IDS, TECHNIQUE_CODES } from "./tokens";
import { difficultyOf, stampBook, type Difficulty } from "./album";
import { isPass } from "./scoring";

export interface TechniqueInfo {
  code: TechniqueCode;
  /** Short name for the stamp seal and captions. */
  short: string;
  /** Set number ("01") whose set teaches it. */
  set: string;
}

const SHORT: Record<TechniqueCode, string> = {
  "1": "Brief formula",
  "2": "Explicit format",
  "3": "Your material",
  "4": "Iterate",
  "5": "Options",
  "6": "Examples",
  "7": "Role",
  "8": "Long documents",
  "9": "Fact check",
  A: "Self-critique",
  B: "Projects",
  C: "Artifacts",
};

/** One plain-English "You can …" sentence per technique. */
export const YOU_CAN: Record<TechniqueCode, string> = {
  "1": "Write an ask the AI gets right the first time",
  "2": "Get the answer in the shape you need",
  "3": "Give the AI your real material, not a retelling",
  "4": "Fix a draft step by step instead of starting over",
  "5": "Ask for several options and pick the best one",
  "6": "Show the AI an example so it matches your style",
  "7": "Give the AI a role so the answer fits the reader",
  "8": "Build a long document one section at a time",
  "9": "Check the facts and ask for sources before you trust an answer",
  A: "Ask the AI to find the weak spots in its own answer",
  B: "Keep standing instructions in a project so every chat starts informed",
  C: "Turn an answer into a finished document you can reuse",
};

const setOf = (m: ModuleId) => m.slice(1).padStart(2, "0");

export function techniqueInfo(code: TechniqueCode): TechniqueInfo {
  const m = MODULES.find((x) => x.techniques.includes(code));
  return { code, short: SHORT[code], set: m ? setOf(m.id) : "01" };
}

// ───────────────────────── What you can do now ─────────────────────────

export interface CanDo {
  key: string;
  text: string;
  detail: string;
}

/** Only verified skills: stamped techniques and passed tests. */
export function whatYouCanDo(state: AppState): CanDo[] {
  const out: CanDo[] = [];
  const has = new Set(state.stamps);
  for (const code of TECHNIQUE_CODES) {
    if (!has.has(code)) continue;
    const info = techniqueInfo(code);
    const lesson = lessonForTechnique(code);
    out.push({ key: `t${code}`, text: YOU_CAN[code], detail: `${info.short} · ${lesson ? `taught in ${lesson.label.split(" · ")[0]}` : `checked in Set ${info.set}`}` });
  }
  for (const m of MODULE_IDS) {
    const r = state.results[m];
    if (r && isPass(r.score)) out.push({ key: `test${m}`, text: "Pass a 5-task test on your own work", detail: `Test ${setOf(m)} · ${r.score} / 100` });
  }
  return out;
}

// ───────────────────────── Stamp board ─────────────────────────

export interface StampSlot {
  code: string;
  name: string;
  earned: boolean;
  /** "SET 01" */
  setLabel: string;
}

export interface StampBoard {
  total: number;
  earned: number;
  countText: string;
  start: StampSlot;
  groups: { difficulty: Difficulty; caption: string; stamps: StampSlot[] }[];
}

export function stampBoard(state: AppState): StampBoard {
  const book = stampBook(state);
  const groups = book.groups.map((g) => {
    const stamps = g.stamps.map((s) => {
      const info = techniqueInfo(s.id as TechniqueCode);
      const premium = tierOfSet(Number(info.set)) === "premium";
      return { code: s.id as string, name: info.short, earned: s.earned, setLabel: premium ? "PREMIUM" : `SET ${info.set}` };
    });
    const first = g.stamps[0]!.id;
    const last = g.stamps[g.stamps.length - 1]!.id;
    return { difficulty: g.difficulty, caption: `${g.difficulty.toUpperCase()} · TECHNIQUE${first === last ? "" : "S"} ${first === last ? first : `${first}–${last}`}`, stamps };
  });
  const all = [book.playerOne, ...book.groups.flatMap((g) => g.stamps)];
  const earned = all.filter((s) => s.earned).length;
  return {
    total: all.length,
    earned,
    countText: `${earned} / ${all.length}`,
    start: { code: "P", name: "Player One", earned: book.playerOne.earned, setLabel: "GIFT · FOR STARTING" },
    groups,
  };
}

export { difficultyOf };

// ───────────────────────── Stamp passport ─────────────────────────

export interface PassportSlot {
  code: string;
  name: string;
  difficulty: "start" | "easy" | "medium" | "hard";
  earned: boolean;
}

export interface Passport {
  slots: PassportSlot[];
  earned: number;
  total: number;
  countText: string;
  /** Printed on the ticket spine. */
  spine: string;
  /** Small print under the grid. */
  caption: string;
}

/** All 13 stamps in one flat list (Player One first), each with its difficulty outline. */
export function stampPassport(state: AppState): Passport {
  const board = stampBoard(state);
  const slots: PassportSlot[] = [
    { code: "P", name: board.start.name, difficulty: "start", earned: board.start.earned },
    ...board.groups.flatMap((g) => g.stamps.map((s) => ({ code: s.code, name: s.name, difficulty: g.difficulty.toLowerCase() as PassportSlot["difficulty"], earned: s.earned }))),
  ];
  return {
    slots,
    earned: board.earned,
    total: slots.length,
    countText: `${board.earned} / ${slots.length}`,
    spine: `ADMIT ONE · VALID FOREVER · No. 0001 · ${state.profile.name.toUpperCase()}`,
    caption: "the Artifacts stamp comes with premium",
  };
}

// ───────────────────────── Test results list ─────────────────────────

export interface TestRow {
  set: string;
  title: string;
  /** "90/100 ★★★", "not taken yet" or "not available yet · free at launch". */
  status: string;
  /** Link label and target; null when the set is not available yet. */
  action: { label: string; href: string } | null;
  tier: "demo" | "free" | "premium";
}

/** One row per catalog set: Set 01 from the stored result, the rest not available yet. */
export function testResultRows(state: AppState): TestRow[] {
  return CATALOG.map((s, i) => {
    const n = i + 1;
    if (n === 1) {
      const r = state.results.m1;
      return {
        set: s.number,
        title: s.title,
        tier: "demo" as const,
        status: r ? `${r.score}/100 ${"★".repeat(r.stars)}${"☆".repeat(3 - r.stars)}` : "not taken yet",
        action: { label: r ? "Retake" : "Take the test", href: "/console?card=test" },
      };
    }
    const premium = tierOfSet(n) === "premium";
    return {
      set: s.number,
      title: s.title,
      tier: premium ? ("premium" as const) : ("free" as const),
      status: `not available yet · ${premium ? "Premium" : "free at launch"}`,
      action: null,
    };
  });
}
