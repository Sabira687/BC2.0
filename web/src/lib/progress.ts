/**
 * App state rules (v3, collection): fresh state, the item collection,
 * applying TEST result codes, achievements, quests, paywall.
 * Pure functions; randomness is injected.
 */
import type { AchievementId, AppState, ItemId, ItemKind, ModuleId, Profile, QuestId, StampId, Stars, TaskOutcomes, TechniqueCode, TestResult } from "./types";
import { getModule, getTest, setNumberOf, tierOfSet } from "./content";
import { JOHN } from "./profile";
import { MODULE_IDS, TECHNIQUE_CODES, createSecrets, cryptoRandomBytes, type RandomBytes } from "./tokens";
import { decodeResultCode, encodeResultCode, type ResultCodeError } from "./resultcode";
import { markHelpUsed } from "./workchat";
import { START_BY_LEVEL, programOf } from "./program";
import { isPass, testStars } from "./scoring";

export { programOf };

export const COUNTED_CODES_MAX = 50;

/** Fresh state for a new browser: John prefilled, nothing created yet. */
export function createInitialState(rand: RandomBytes = cryptoRandomBytes, profile: Profile = JOHN): AppState {
  return {
    version: 4,
    profile: { ...profile },
    secrets: createSecrets(rand),
    created: [],
    results: {},
    resultsEntered: 0,
    subscription: { active: false, since: null },
    collectionViewed: false,
    countedCodes: [],
    learnStars: {},
    stamps: ["player_one"],
    helpUsed: false,
    demo: { fastForwarded: false },
  };
}

// ───────────────────────── Collection ─────────────────────────

/** Item types in the collection: what each one is for (spec/03 v3). */
export const ITEM_TYPES = {
  learn: { label: "LEARN", mode: "Theory and practice on one set, in your own work context", time: "about 30 min", live: true },
  test: { label: "TEST", mode: "Test and assessment on one set: score, stars and a result code", time: "about 10 min", live: true },
  help: { label: "HELP", mode: "One-shot help in the middle of real work", time: "1 min", live: true },
  minigame: { label: "MINI-GAME", mode: "Short learning games", time: "", live: false },
  challenge: { label: "CHALLENGE", mode: "A timed task based on a real situation", time: "", live: false },
} as const;

export type ItemStatus =
  /** Created: the player can open and copy it. */
  | "created"
  /** Can be created now. */
  | "available"
  /** Needs a previous step first. */
  | "locked"
  /** Opened by a pass, but the module needs Premium (not used in the demo: nothing beyond Set 01 opens). */
  | "pro"
  /** Not in this demo (free at launch / Premium) or no content yet. */
  | "soon";

export interface CollectionItem {
  id: ItemId;
  kind: ItemKind;
  module: ModuleId | null;
  title: string;
  status: ItemStatus;
  /** Why it is not available yet (locked / pro / soon). */
  reason?: string;
}

export function itemId(kind: ItemKind, module: ModuleId): ItemId {
  return kind === "help" ? "help" : (`${kind}:${module}` as ItemId);
}

export function kindOf(id: ItemId): ItemKind {
  return id === "help" ? "help" : (id.split(":")[0] as ItemKind);
}

export function moduleOfItem(id: ItemId): ModuleId | null {
  return id === "help" ? null : (id.split(":")[1] as ModuleId);
}

/**
 * The collection as the player sees it: LEARN and TEST of the start set, one
 * set ahead as "soon" (the demo ends at Set 01, even with Premium test mode),
 * plus HELP. Order: LEARN → TEST inside a set. No creation order is enforced.
 */
export function collection(state: AppState): CollectionItem[] {
  const program = programOf(state);
  const start = START_BY_LEVEL[state.profile.level];
  const ids = program.modules.map((m) => m.module.id);
  const has = (id: ItemId) => state.created.includes(id);
  const items: CollectionItem[] = [];

  for (let i = ids.indexOf(start); i >= 0 && i < ids.length; i++) {
    const m = ids[i]!;
    const title = getModule(m).title;
    const learnId = itemId("learn", m);
    const testId = itemId("test", m);
    // Demo: only the start set opens. Later sets are free at launch (01-07) or Premium (08+), never opened here.
    const later = m !== start;
    const laterReason = tierOfSet(setNumberOf(m)) === "premium" ? "Premium path · arrives at launch." : "Free at launch · this demo ends at Set 01.";

    const learnStatus: ItemStatus = has(learnId) ? "created" : later ? "soon" : "available";
    items.push({ id: learnId, kind: "learn", module: m, title, status: learnStatus, reason: learnStatus === "soon" ? laterReason : undefined });

    let testStatus: ItemStatus;
    let testReason: string | undefined;
    if (has(testId)) testStatus = "created";
    else if (later) [testStatus, testReason] = ["soon", laterReason];
    else if (getTest(m) === undefined) [testStatus, testReason] = ["soon", "This set's test is coming soon."];
    else testStatus = "available";
    items.push({ id: testId, kind: "test", module: m, title, status: testStatus, reason: testReason });

    if (later) break; // show one set ahead, not the whole program
  }

  items.push({
    id: "help",
    kind: "help",
    module: null,
    title: "Help",
    status: has("help") ? "created" : "available",
  });
  return items;
}

export function canCreateItem(state: AppState, id: ItemId): boolean {
  return collection(state).some((it) => it.id === id && it.status === "available");
}

export function createItem(state: AppState, id: ItemId): AppState {
  if (!canCreateItem(state, id)) return state;
  return { ...state, created: [...state.created, id] };
}

/** Opens a set like a pack: creates its LEARN, TEST and HELP where missing. Goes through createItem, so it is idempotent and guarded. */
export function openSet(state: AppState, module: ModuleId): AppState {
  const ids = [itemId("learn", module), itemId("test", module)];
  const open = collection(state).some((it) => ids.includes(it.id) && (it.status === "available" || it.status === "created"));
  if (!open) return state; // set not open in this demo: HELP is global, so it must not be created from here
  let s = state;
  for (const id of [...ids, "help" as const]) s = createItem(s, id);
  return s;
}

/**
 * Demo only: fills John's Set 01 progress. LEARN stars go to 3 (never down),
 * HELP counts as used, all three cards are created, and a 90/100 TEST result
 * goes through the real encode → decode → apply path (never written directly).
 * Idempotent: the second code is "already counted".
 */
export function fastForwardDemo(state: AppState): AppState {
  let s: AppState = { ...state, learnStars: { ...state.learnStars, m1: Math.max(state.learnStars.m1 ?? 0, 3) as Stars } };
  s = markHelpUsed(s);
  for (const id of ["learn:m1", "test:m1"] as const) if (!s.created.includes(id)) s = createItem(s, id);
  const test = getTest("m1");
  const techniques = TECHNIQUE_CODES.filter((c) => test?.practical.some((p) => p.techniques.includes(c)));
  const tasks: TaskOutcomes = ["right", "right", "wrong", "pass", "pass"]; // 90: ★★★, question 3 missed on purpose (a real "One thing to practice")
  const applied = applyResultCode(s, encodeResultCode(s.secrets, "m1", tasks, techniques));
  if (applied.ok) s = applied.state;
  return { ...s, demo: { fastForwarded: true } };
}

export function markCollectionViewed(state: AppState): AppState {
  return state.collectionViewed ? state : { ...state, collectionViewed: true };
}

// ───────────────────────── Result codes ─────────────────────────

export type ApplyResult =
  | {
      ok: true;
      state: AppState;
      result: TestResult;
      /** Best result before this code (null on the first attempt). */
      previousBest: TestResult | null;
      /** Technique stamps this code added (not owned before). */
      newStamps: TechniqueCode[];
      /** True when this result became the stored best. */
      isBest: boolean;
      /** Module counts as cleared (70+). */
      cleared: boolean;
      /** Items that became available (or need Pro) because of this result. */
      unlocked: ItemId[];
      newAchievements: AchievementId[];
    }
  | { ok: false; error: ResultCodeError; state: AppState };

/**
 * Apply a TEST result code. The same code twice → "already_counted", state
 * unchanged. Every new attempt counts; the best score per module is kept.
 */
/** Stamp union in canonical order ("player_one" first, then technique code order). Returns the same array when nothing is new. */
export function addStamps(current: StampId[], add: TechniqueCode[]): StampId[] {
  const missing = add.filter((s) => !current.includes(s));
  if (missing.length === 0) return current;
  const all = new Set<StampId>([...current, ...missing]);
  const order: StampId[] = ["player_one", ...TECHNIQUE_CODES];
  return order.filter((s) => all.has(s));
}

export function applyResultCode(state: AppState, raw: unknown, now: Date = new Date()): ApplyResult {
  const decoded = decodeResultCode(raw, state.secrets);
  if (!decoded.ok) return { ok: false, error: decoded.error, state };
  const d = decoded.result;
  if (state.countedCodes.includes(d.normalized)) return { ok: false, error: "already_counted", state };

  const result: TestResult = { module: d.module, tasks: d.tasks, score: d.score, stars: testStars(d.score), techniques: d.techniques, at: now.toISOString() };
  const previousBest = state.results[d.module] ?? null;
  const isBest = previousBest === null || result.score > previousBest.score;
  const next: AppState = {
    ...state,
    results: isBest ? { ...state.results, [d.module]: result } : state.results,
    resultsEntered: state.resultsEntered + 1,
    countedCodes: [...state.countedCodes, d.normalized].slice(-COUNTED_CODES_MAX),
    stamps: addStamps(state.stamps, d.techniques),
  };

  const before = new Map(collection(state).map((it) => [it.id, it.status]));
  const unlocked = collection(next)
    .filter((it) => (it.status === "available" || it.status === "pro") && before.get(it.id) !== "available" && before.get(it.id) !== it.status)
    .map((it) => it.id);
  const had = new Set(achievements(state));
  return {
    ok: true,
    state: next,
    result,
    previousBest,
    newStamps: d.techniques.filter((c) => !state.stamps.includes(c)),
    isBest,
    cleared: isPass(result.score),
    unlocked,
    newAchievements: achievements(next).filter((a) => !had.has(a)),
  };
}

/** Techniques shown in the best results, in code order. */
export function techniquesOf(state: AppState): TechniqueCode[] {
  const set = new Set(Object.values(state.results).flatMap((r) => (r ? r.techniques : [])));
  return TECHNIQUE_CODES.filter((c) => set.has(c));
}

// ───────────────────────── Achievements & quests ─────────────────────────

/**
 * Set badge for one module: LEARN 3★ and TEST ≥2★ and HELP used at least once.
 * Holographic variant: TEST 3★.
 */
export function setBadge(state: AppState, module: ModuleId): { earned: boolean; holo: boolean } {
  const r = state.results[module];
  const testS = r ? testStars(r.score) : 0;
  const earned = state.learnStars[module] === 3 && testS >= 2 && state.helpUsed;
  return { earned, holo: earned && testS === 3 };
}

/** The three steps of the Set badge (LEARN 3 stars, TEST 2+ stars, Help used) and how many are done. */
export function setBadgeSteps(state: AppState, module: ModuleId): { done: number; total: 3; steps: [boolean, boolean, boolean] } {
  const r = state.results[module];
  const steps: [boolean, boolean, boolean] = [state.learnStars[module] === 3, (r ? testStars(r.score) : 0) >= 2, state.helpUsed];
  return { done: steps.filter(Boolean).length, total: 3, steps };
}

export const ACHIEVEMENTS: Record<AchievementId, { title: string; description: string }> = {
  player_one: { title: "Player One", description: "Created your first card." },
  first_test: { title: "First Test", description: "Entered your first test result." },
  set_clear: { title: "Set Clear", description: "Earned your first set badge." },
};

export function achievements(state: AppState): AchievementId[] {
  const out: AchievementId[] = [];
  if (state.created.length > 0) out.push("player_one");
  if (state.resultsEntered > 0) out.push("first_test");
  if (MODULE_IDS.some((m) => setBadge(state, m).earned)) out.push("set_clear");
  return out;
}

export const QUESTS: Record<QuestId, { title: string; description: string }> = {
  0: { title: "Look around the collection", description: "Open the collection page." },
  1: { title: "Create the LEARN card", description: "Unlock LEARN · Set 01 and start it in the AI console." },
  2: { title: "Take the test", description: "Create TEST · Set 01, take it and enter your first result code." },
  3: { title: "Get help", description: "Create your Help card, or press Use Help in the Work chat." },
};

export function questsDone(state: AppState): Record<QuestId, boolean> {
  const start = START_BY_LEVEL[state.profile.level];
  return {
    0: state.collectionViewed,
    1: state.created.includes(itemId("learn", start)),
    2: state.created.includes(itemId("test", start)) && state.resultsEntered > 0,
    3: state.created.includes("help"),
  };
}

/** First unfinished quest, or null when all are done. */
export function currentQuest(state: AppState): QuestId | null {
  const done = questsDone(state);
  for (const q of [0, 1, 2, 3] as const) if (!done[q]) return q;
  return null;
}

// ───────────────────────── Profile & paywall ─────────────────────────

/** Change the questionnaire answers; items regenerate from the new profile. Demo lock is on by default. */
export function updateProfile(state: AppState, profile: Profile, { demoLock = true }: { demoLock?: boolean } = {}): AppState {
  // Under the demo lock only the name and the style can change; everything else keeps its demo value.
  return { ...state, profile: demoLock ? { ...state.profile, name: profile.name, style: profile.style } : profile };
}

/** Simulated upgrade (no real payment). Marked as demo in the UI. */
export function activateSubscription(state: AppState, now: Date = new Date()): AppState {
  if (state.subscription.active) return state;
  return { ...state, subscription: { active: true, since: now.toISOString() } };
}

export function cancelSubscription(state: AppState): AppState {
  if (!state.subscription.active) return state;
  return { ...state, subscription: { active: false, since: null } };
}
