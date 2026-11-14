import { describe, expect, it } from "vitest";
import {
  ACHIEVEMENTS,
  COUNTED_CODES_MAX,
  ITEM_TYPES,
  QUESTS,
  achievements,
  activateSubscription,
  applyResultCode,
  canCreateItem,
  cancelSubscription,
  collection,
  createInitialState,
  createItem,
  currentQuest,
  fastForwardDemo,
  itemId,
  kindOf,
  markCollectionViewed,
  moduleOfItem,
  openSet,
  setBadge,
  questsDone,
  techniquesOf,
  updateProfile,
  type ApplyResult,
  type CollectionItem,
} from "./progress";
import { encodeResultCode } from "./resultcode";
import { JOHN } from "./profile";
import { getModule, getTest } from "./content";
import type { AppState, ItemId, ModuleId, TaskOutcomes, TechniqueCode } from "./types";
import { seededRandom } from "./testutil";
import { learnInstructions } from "./generator";
import { promptName } from "./terminal";

const NOW = new Date("2026-11-14T12:00:00.000Z");
const GOLD: TaskOutcomes = ["right", "right", "right", "pass", "pass"]; // 100
const SILVER: TaskOutcomes = ["right", "wrong", "wrong", "pass", "rewrite"]; // 80
const PASS70: TaskOutcomes = ["wrong", "wrong", "wrong", "pass", "pass"]; // 70
const BRONZE: TaskOutcomes = ["right", "right", "wrong", "pass", "fail"]; // 55
const NONE: TaskOutcomes = ["right", "right", "right", "fail", "fail"]; // 30

function fresh(seed = 1): AppState {
  return createInitialState(seededRandom(seed));
}

/** John with LEARN and TEST · Module 1 created. */
function ready(seed = 1): AppState {
  return createItem(createItem(fresh(seed), "learn:m1"), "test:m1");
}

function code(s: AppState, tasks: TaskOutcomes, techs: TechniqueCode[] = [], m: ModuleId = "m1"): string {
  return encodeResultCode(s.secrets, m, tasks, techs);
}

function apply(s: AppState, raw: string): Extract<ApplyResult, { ok: true }> {
  const r = applyResultCode(s, raw, NOW);
  if (!r.ok) throw new Error(`apply failed: ${r.error}`);
  return r;
}

const byId = (s: AppState): Record<string, CollectionItem> => Object.fromEntries(collection(s).map((it) => [it.id, it]));
const statusOf = (s: AppState, id: ItemId) => byId(s)[id]?.status;

describe("createInitialState", () => {
  it("John, version 4, nothing created, no results", () => {
    const s = fresh();
    expect(s.version).toBe(4);
    expect(s.profile).toEqual(JOHN);
    expect(s.profile).not.toBe(JOHN); // a copy
    expect(s.created).toEqual([]);
    expect(s.results).toEqual({});
    expect(s.resultsEntered).toBe(0);
    expect(s.countedCodes).toEqual([]);
    expect(s.subscription).toEqual({ active: false, since: null });
    expect(s.collectionViewed).toBe(false);
    expect(s.secrets.playerId).toHaveLength(5);
  });
  it("deterministic with a seed, random without", () => {
    expect(fresh(3)).toEqual(fresh(3));
    expect(createInitialState().secrets.playerId).not.toBe(createInitialState().secrets.playerId);
  });
  it("accepts another profile", () => {
    const p = { ...JOHN, name: "Anna", style: "straight" as const };
    expect(createInitialState(seededRandom(1), p).profile).toEqual(p);
  });
});

describe("item ids", () => {
  it("itemId / kindOf / moduleOfItem", () => {
    expect(itemId("learn", "m3")).toBe("learn:m3");
    expect(itemId("test", "m1")).toBe("test:m1");
    expect(itemId("help", "m1")).toBe("help");
    expect(kindOf("learn:m2")).toBe("learn");
    expect(kindOf("test:m8")).toBe("test");
    expect(kindOf("help")).toBe("help");
    expect(moduleOfItem("test:m4")).toBe("m4");
    expect(moduleOfItem("help")).toBeNull();
  });
  it("item types: LEARN, TEST and HELP are live", () => {
    expect(ITEM_TYPES.learn.live && ITEM_TYPES.test.live && ITEM_TYPES.help.live).toBe(true);
    expect(ITEM_TYPES.minigame.live || ITEM_TYPES.challenge.live).toBe(false);
  });
});

describe("collection for John", () => {
  it("fresh: learn:m1 available, test:m1 and help locked, one locked module ahead", () => {
    const items = collection(fresh());
    expect(items.map((i) => i.id)).toEqual(["learn:m1", "test:m1", "learn:m2", "test:m2", "help"]);
    const c = byId(fresh());
    expect(c["learn:m1"]).toMatchObject({ kind: "learn", module: "m1", title: getModule("m1").title, status: "available" });
    expect(c["learn:m1"]!.reason).toBeUndefined();
    expect(c["test:m1"]).toMatchObject({ kind: "test", module: "m1", status: "available" });
    expect(c["test:m1"]!.reason).toBeUndefined();
    expect(c["learn:m2"]).toMatchObject({ status: "soon", title: getModule("m2").title });
    expect(c["learn:m2"]!.reason).toMatch(/free at launch/i);
    expect(c["test:m2"]).toMatchObject({ status: "soon" });
    expect(c["test:m2"]!.reason).toBeTruthy();
    expect(c.help).toMatchObject({ kind: "help", module: null, status: "available" });
    expect(c.help!.reason).toBeUndefined();
  });

  it("Set 01: all three cards can be created at once, in any order (R7)", () => {
    let s = fresh();
    expect(canCreateItem(s, "test:m1")).toBe(true);
    expect(canCreateItem(s, "help")).toBe(true);
    s = createItem(s, "help");
    s = createItem(s, "test:m1");
    expect(s.created).toEqual(["help", "test:m1"]);
    expect(statusOf(s, "learn:m1")).toBe("available");
    s = createItem(s, "learn:m1");
    expect(s.created).toEqual(["help", "test:m1", "learn:m1"]);
    expect(createItem(s, "learn:m1")).toBe(s); // already created
    expect(createItem(s, "help")).toBe(s);
    expect(statusOf(s, "help")).toBe("created");
  });

  it("locked and 'soon' items can't be created", () => {
    const s = ready();
    for (const id of ["learn:m2", "test:m2", "learn:m3", "test:m8"] as ItemId[]) {
      expect(canCreateItem(s, id)).toBe(false);
      expect(createItem(s, id)).toBe(s);
    }
  });

  it("does not mutate the input state", () => {
    const s = fresh();
    const snapshot = JSON.stringify(s);
    createItem(s, "learn:m1");
    expect(JSON.stringify(s)).toBe(snapshot);
  });

  it("markCollectionViewed is idempotent", () => {
    const s = fresh();
    const v = markCollectionViewed(s);
    expect(v.collectionViewed).toBe(true);
    expect(s.collectionViewed).toBe(false);
    expect(markCollectionViewed(v)).toBe(v);
  });

  it("a later start level starts the collection at that module", () => {
    const s = createInitialState(seededRandom(1), { ...JOHN, level: "regular_agent" });
    const items = collection(s);
    expect(items[0]).toMatchObject({ id: "learn:m3", status: "available" });
    expect(items.some((i) => i.module === "m1" || i.module === "m2")).toBe(false);
  });

  // BUG: HELP is gated on the start module's TEST item (progress.ts collection(), `firstTest`).
  // For a start module without a written test (tried_agent → m2, regular_agent → m3) that TEST is
  // "soon" forever, so HELP can never be created (and quest 2 can never be done).
  it("HELP is reachable for every start level", () => {
    for (const level of ["chatbot", "tried_agent", "regular_agent"] as const) {
      let s = createInitialState(seededRandom(1), { ...JOHN, level });
      for (let i = 0; i < 10; i++) {
        const next = collection(s).find((it) => it.status === "available");
        if (!next) break;
        s = createItem(s, next.id);
      }
      expect(s.created, level).toContain("help");
    }
  });
});

describe("applyResultCode", () => {
  it("ok: score, rank, tasks, techniques; counters and counted codes", () => {
    const s = ready();
    const c = code(s, SILVER, ["2", "1", "C"]);
    const r = apply(s, c);
    expect(r.result).toEqual({ module: "m1", tasks: SILVER, score: 80, stars: 2, techniques: ["1", "2"], at: NOW.toISOString() });
    expect(r.state.results.m1).toEqual(r.result);
    expect(r.state.resultsEntered).toBe(1);
    const [pre, pid, ...toks] = c.split("-");
    expect(r.state.countedCodes).toEqual([[pre, pid, ...toks.sort()].join("-")]);
    expect(r.previousBest).toBeNull();
    expect(r.isBest).toBe(true);
    expect(s.resultsEntered).toBe(0); // input untouched
    expect(s.results).toEqual({});
  });

  it("same code twice → already_counted, same state object", () => {
    const s = ready();
    const c = code(s, GOLD);
    const first = apply(s, c);
    for (const again of [c, c.toLowerCase(), `RESULT CODE: ${c.replace(/-/g, " ")}`, `http://localhost:3000/result/${c}`]) {
      const r = applyResultCode(first.state, again, NOW);
      expect(r.ok).toBe(false);
      if (r.ok) return;
      expect(r.error).toBe("already_counted");
      expect(r.state).toBe(first.state);
    }
  });

  // BUG: the "already counted" key is the code as typed after normalization, not a canonical form.
  // decodeResultCode accepts tokens in any order, so the same tokens reordered count as a new
  // attempt: resultsEntered goes 1 → 2 for one and the same TEST result
  // (counted codes use the canonical, order-independent form from decodeResultCode).
  it("the same tokens in another order are already counted", () => {
    const s = ready();
    const c = code(s, GOLD, ["1"]);
    const first = apply(s, c);
    const [pre, pid, ...toks] = c.split("-");
    const reordered = [pre, pid, ...toks.reverse()].join("-");
    const r = applyResultCode(first.state, reordered, NOW);
    expect(r.ok ? "ok" : r.error).toBe("already_counted");
  });

  it("garbage text does not throw: bad_format", () => {
    const r = applyResultCode(ready(), "hello", NOW);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe("bad_format");
  });

  it("errors leave the state untouched", () => {
    const s = ready();
    const other = createInitialState(seededRandom(99));
    const cases: Array<[string, string]> = [
      ["", "empty"],
      ["SV1-XXXXX", "bad_format"],
      [code(other, GOLD), "wrong_player"],
      [code(s, GOLD).replace(/^SV1/, "SV2"), "wrong_version"],
    ];
    for (const [raw, err] of cases) {
      const r = applyResultCode(s, raw, NOW);
      expect(r.ok).toBe(false);
      if (!r.ok) {
        expect(r.error).toBe(err);
        expect(r.state).toBe(s);
      }
    }
  });

  it("a lower second attempt keeps the best", () => {
    const s = ready();
    const first = apply(s, code(s, GOLD, ["1", "2", "3"]));
    const second = apply(first.state, code(s, BRONZE, ["1"]));
    expect(second.isBest).toBe(false);
    expect(second.previousBest).toEqual(first.result);
    expect(second.result.score).toBe(55);
    expect(second.state.results).toBe(first.state.results);
    expect(second.state.results.m1?.score).toBe(100);
    expect(second.state.resultsEntered).toBe(2);
    expect(second.state.countedCodes).toHaveLength(2);
    expect(second.cleared).toBe(false); // this attempt alone did not clear
    expect(second.unlocked).toEqual([]);
  });

  it("an equal score keeps the earlier result", () => {
    const s = ready();
    const first = apply(s, code(s, GOLD));
    const again = apply(first.state, code(s, GOLD, ["1"]));
    expect(again.isBest).toBe(false);
    expect(again.state.results.m1).toEqual(first.result);
  });

  it("a higher second attempt replaces the best", () => {
    const s = ready();
    const first = apply(s, code(s, NONE));
    expect(first.state.results.m1?.score).toBe(30);
    const second = apply(first.state, code(s, SILVER, ["1"]));
    expect(second.isBest).toBe(true);
    expect(second.previousBest?.score).toBe(30);
    expect(second.state.results.m1).toEqual(second.result);
    expect(second.state.resultsEntered).toBe(2);
  });

  it("passing (>=70): cleared, but the demo opens nothing beyond Set 01", () => {
    const s = ready();
    const r = apply(s, code(s, PASS70));
    expect(r.result.score).toBe(70);
    expect(r.cleared).toBe(true);
    expect(statusOf(r.state, "learn:m2")).toBe("soon");
    expect(byId(r.state)["learn:m2"]!.reason).toMatch(/free at launch/i);
    expect(statusOf(r.state, "test:m2")).toBe("soon");
    expect(r.unlocked).toEqual([]);
    expect(canCreateItem(r.state, "learn:m2")).toBe(false);
  });

  it("passing with Premium test mode active still opens nothing beyond Set 01", () => {
    const s = activateSubscription(ready(), NOW);
    const r = apply(s, code(s, GOLD));
    expect(r.cleared).toBe(true);
    expect(statusOf(r.state, "learn:m2")).toBe("soon");
    expect(r.unlocked).toEqual([]);
    expect(createItem(r.state, "learn:m2").created).not.toContain("learn:m2");
  });

  it("subscribing (Premium test mode) does not change any collection status for the demo profile", () => {
    for (const st of [ready(), fastForwardDemo(ready())]) {
      const before = collection(st).map((it) => [it.id, it.status]);
      const after = collection(activateSubscription(st, NOW)).map((it) => [it.id, it.status]);
      expect(after).toEqual(before);
    }
  });

  it("failing (<70): not cleared, nothing unlocked", () => {
    for (const tasks of [BRONZE, NONE, ["right", "right", "right", "pass", "fail"] as TaskOutcomes]) {
      const s = activateSubscription(ready(), NOW);
      const r = apply(s, code(s, tasks));
      expect(r.result.score).toBeLessThan(70);
      expect(r.cleared).toBe(false);
      expect(r.unlocked).toEqual([]);
      expect(statusOf(r.state, "learn:m2")).toBe("soon");
    }
  });

  it("a second pass does not unlock the same item again", () => {
    const s = ready();
    const first = apply(s, code(s, SILVER));
    const second = apply(first.state, code(s, GOLD));
    expect(second.cleared).toBe(true);
    expect(second.unlocked).toEqual([]);
  });

  it("countedCodes stays bounded", () => {
    let s = ready();
    const techs: TechniqueCode[] = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "A", "B", "C"];
    let n = 0;
    // distinct codes: outcome sets × technique subsets
    outer: for (let mask = 0; mask < 1 << 6; mask++) {
      for (const tasks of [GOLD, SILVER, BRONZE]) {
        const r = applyResultCode(s, code(s, tasks, techs.filter((_, i) => mask & (1 << i))), NOW);
        if (!r.ok) throw new Error(r.error);
        s = r.state;
        if (++n >= COUNTED_CODES_MAX + 5) break outer;
      }
    }
    expect(s.countedCodes).toHaveLength(COUNTED_CODES_MAX);
    expect(s.resultsEntered).toBe(COUNTED_CODES_MAX + 5);
  });
});

describe("achievements", () => {
  it("player_one / first_test / set_clear, newAchievements only new ones", () => {
    let s = fresh();
    expect(achievements(s)).toEqual([]);
    s = createItem(s, "learn:m1");
    expect(achievements(s)).toEqual(["player_one"]);
    s = createItem(s, "test:m1");

    const fail = apply(s, code(s, BRONZE));
    expect(fail.newAchievements).toEqual(["first_test"]);
    expect(achievements(fail.state)).toEqual(["player_one", "first_test"]);

    const pass = apply(fail.state, code(s, SILVER));
    expect(pass.newAchievements).toEqual([]);
    expect(achievements(pass.state)).toEqual(["player_one", "first_test"]);

    const again = apply(pass.state, code(s, GOLD));
    expect(again.newAchievements).toEqual([]);
  });
  it("set_clear comes with the set badge (learn 3★ + test ≥2★ + help used), never module_clear", () => {
    const s = ready();
    const r = apply({ ...s, learnStars: { m1: 3 }, helpUsed: true }, code(s, GOLD));
    expect(r.newAchievements).toEqual(["first_test", "set_clear"]);
    expect(achievements(r.state) as string[]).not.toContain("module_clear");
    expect(apply(s, code(s, GOLD)).newAchievements).toEqual(["first_test"]);
  });
  it("every achievement has a title and description", () => {
    for (const a of Object.values(ACHIEVEMENTS)) expect(a.title && a.description).toBeTruthy();
  });
});

describe("quests", () => {
  it("0–3 in order", () => {
    let s = fresh();
    expect(questsDone(s)).toEqual({ 0: false, 1: false, 2: false, 3: false });
    expect(currentQuest(s)).toBe(0);
    s = markCollectionViewed(s);
    expect(currentQuest(s)).toBe(1);
    s = createItem(s, "learn:m1");
    expect(questsDone(s)[1]).toBe(true);
    expect(currentQuest(s)).toBe(2);
    s = createItem(s, "test:m1");
    expect(questsDone(s)[2]).toBe(false); // created but no result yet
    s = apply(s, code(s, BRONZE)).state;
    expect(questsDone(s)[2]).toBe(true);
    expect(currentQuest(s)).toBe(3);
    s = createItem(s, "help");
    expect(questsDone(s)).toEqual({ 0: true, 1: true, 2: true, 3: true });
    expect(currentQuest(s)).toBeNull();
    expect(Object.keys(QUESTS)).toEqual(["0", "1", "2", "3"]);
  });
  it("quest 2 needs test:m1 created AND a result entered", () => {
    const onlyResult = apply(createItem(fresh(), "learn:m1"), code(fresh(), GOLD)).state;
    expect(onlyResult.resultsEntered).toBe(1);
    expect(questsDone(onlyResult)[2]).toBe(false);
    expect(questsDone(ready())[2]).toBe(false);
  });
});

describe("techniquesOf", () => {
  it("techniques of the best results, in code order", () => {
    const s = ready();
    expect(techniquesOf(s)).toEqual([]);
    const a = apply(s, code(s, SILVER, ["3", "1"]));
    expect(techniquesOf(a.state)).toEqual(["1", "3"]);
    // a lower attempt does not add its techniques
    const b = apply(a.state, code(s, BRONZE, ["2"]));
    expect(techniquesOf(b.state)).toEqual(["1", "3"]);
    // a better attempt replaces them
    const c = apply(b.state, code(s, GOLD, ["2"]));
    expect(techniquesOf(c.state)).toEqual(["2"]);
  });
  it("combines modules", () => {
    const s = activateSubscription(ready(), NOW);
    const a = apply(s, code(s, GOLD, ["3"]));
    const b = apply(a.state, code(s, GOLD, ["5", "4"], "m2"));
    expect(techniquesOf(b.state)).toEqual(["3", "4", "5"]);
  });
});

describe("subscription and profile", () => {
  it("activate / cancel", () => {
    const s = fresh();
    const on = activateSubscription(s, NOW);
    expect(on.subscription).toEqual({ active: true, since: NOW.toISOString() });
    expect(activateSubscription(on, new Date())).toBe(on);
    const off = cancelSubscription(on);
    expect(off.subscription).toEqual({ active: false, since: null });
    expect(cancelSubscription(off)).toBe(off);
  });
  it("updateProfile keeps results, items and secrets", () => {
    const s = ready();
    const r = apply(s, code(s, GOLD, ["1"]));
    const p = { ...JOHN, name: "Anna", style: "straight" as const };
    const next = updateProfile(r.state, p);
    expect(next.profile).toEqual(p);
    expect(next.results).toEqual(r.state.results);
    expect(next.created).toEqual(r.state.created);
    expect(next.secrets).toEqual(r.state.secrets);
    expect(next.resultsEntered).toBe(1);
  });
  it("a new name reaches the console prompt and the generated item text", () => {
    const s = fresh();
    expect(promptName(s.profile.name)).toBe("john");
    const next = updateProfile(s, { ...JOHN, name: "Anna" });
    expect(promptName(next.profile.name)).toBe("anna");
    const text = learnInstructions({ profile: next.profile, secrets: next.secrets, appUrl: "https://x.test" }, "m1");
    expect(text).toContain("Name: Anna");
    expect(text).not.toContain("Name: John");
  });
  it("updateProfile under the demo lock changes only name and style", () => {
    const s = fresh();
    const next = updateProfile(s, { ...JOHN, name: "Anna", style: "straight", goal: "everyday", plan: "max", job: "pirate" });
    expect(next.profile).toEqual({ ...JOHN, name: "Anna", style: "straight" });
    const open = updateProfile(s, { ...JOHN, goal: "everyday" }, { demoLock: false });
    expect(open.profile.goal).toBe("everyday");
  });
});

describe("stars and set badge", () => {
  it("fresh state has the gifted player_one stamp, no learn stars, help not used", () => {
    const s = fresh();
    expect(s.version).toBe(4);
    expect(s.stamps).toEqual(["player_one"]);
    expect(s.learnStars).toEqual({});
    expect(s.helpUsed).toBe(false);
  });
  it("applied results carry stars derived from the score", () => {
    const s = ready();
    expect(apply(s, code(s, GOLD)).state.results.m1?.stars).toBe(3);
    expect(apply(s, code(s, SILVER)).state.results.m1?.stars).toBe(2);
    expect(apply(s, code(s, BRONZE)).state.results.m1?.stars).toBe(1);
    expect(apply(s, code(s, NONE)).state.results.m1?.stars).toBe(0);
  });
  it("set badge: learn 3★ and test ≥2★ and help used; holo only on test 3★", () => {
    const s = ready();
    const withTest = (t: TaskOutcomes, over: Partial<AppState>) => ({ ...apply(s, code(s, t)).state, ...over });
    const full = { learnStars: { m1: 3 as const }, helpUsed: true };
    expect(setBadge(withTest(SILVER, full), "m1")).toEqual({ earned: true, holo: false });
    expect(setBadge(withTest(GOLD, full), "m1")).toEqual({ earned: true, holo: true });
    expect(setBadge(withTest(BRONZE, full), "m1")).toEqual({ earned: false, holo: false });
    expect(setBadge(withTest(GOLD, { ...full, learnStars: { m1: 2 } }), "m1")).toEqual({ earned: false, holo: false });
    expect(setBadge(withTest(GOLD, { ...full, helpUsed: false }), "m1")).toEqual({ earned: false, holo: false });
    expect(setBadge({ ...s, ...full }, "m1")).toEqual({ earned: false, holo: false }); // no test result
  });
});

describe("applyResultCode: v4 stars, stamps, set badge", () => {
  const practical = () => getTest("m1")!.practical.map((p) => p.techniques);

  it("perfect code: 3 stars, technique stamps, first_test", () => {
    const s = ready();
    const techs = [...new Set(practical().flat())];
    const r = apply(s, code(s, GOLD, techs));
    expect(r.result.stars).toBe(3);
    expect(r.result.techniques.length).toBeGreaterThan(0);
    for (const t of r.result.techniques) expect(r.state.stamps).toContain(t);
    expect(r.state.stamps[0]).toBe("player_one");
    expect(r.newAchievements).toContain("first_test");
  });

  it("learn 3 stars + help + perfect test: set_clear and holo", () => {
    const s0 = { ...ready(), learnStars: { m1: 3 as const }, helpUsed: true };
    const r = apply(s0, code(s0, GOLD, [...new Set(practical().flat())]));
    expect(r.newAchievements).toContain("set_clear");
    expect(setBadge(r.state, "m1")).toEqual({ earned: true, holo: true });
  });

  it("same code twice does not change stamps", () => {
    const s = ready();
    const c = code(s, GOLD, [...new Set(practical().flat())]);
    const first = apply(s, c);
    const again = applyResultCode(first.state, c, NOW);
    expect(again.ok).toBe(false);
    expect(again.state.stamps).toEqual(first.state.stamps);
  });

  it("failed practical task does not stamp its techniques", () => {
    const s = ready();
    const p = practical() as TechniqueCode[][];
    const failed = p[1]!.filter((t) => !p[0]!.includes(t));
    const r = apply(s, code(s, ["right", "right", "right", "pass", "fail"], [...new Set(p.flat())]));
    for (const t of failed) expect(r.state.stamps).not.toContain(t);
  });

  it("stamps are a union even when the code is not the best", () => {
    const s = ready();
    const p = practical() as TechniqueCode[][];
    const a = apply(s, code(s, GOLD, p[0]!));
    const b = apply(a.state, code(a.state, SILVER, p[1]!));
    expect(b.isBest).toBe(false);
    for (const t of [...p[0]!, ...p[1]!]) expect(b.state.stamps).toContain(t);
  });
});

describe("fastForwardDemo", () => {
  it("one call earns the m1 set badge, holographic, with all three cards", () => {
    const s = fastForwardDemo(fresh());
    expect(s.created).toEqual(expect.arrayContaining(["learn:m1", "test:m1", "help"]));
    expect(s.learnStars.m1).toBe(3);
    expect(s.helpUsed).toBe(true);
    expect(s.results.m1?.stars).toBe(3);
    expect(s.results.m1?.score).toBe(90);
    expect(s.results.m1?.tasks).toEqual(["right", "right", "wrong", "pass", "pass"]);
    expect(s.stamps).toEqual(["player_one", "1", "2", "3"]);
    expect(s.resultsEntered).toBe(1);
    expect(setBadge(s, "m1")).toEqual({ earned: true, holo: true });
    expect(s.demo.fastForwarded).toBe(true);
    expect(fresh().demo.fastForwarded).toBe(false);
  });

  it("twice equals once", () => {
    const once = fastForwardDemo(fresh());
    expect(fastForwardDemo(once)).toEqual(once);
  });

  it("after real progress: TEST reaches 3 stars only through the code, nothing is lowered", () => {
    let s = ready();
    s = { ...s, learnStars: { m1: 2 }, stamps: ["player_one", "1"] };
    s = apply(s, code(s, SILVER, ["1"])).state;
    expect(s.results.m1?.stars).toBe(2);
    const ff = fastForwardDemo(s);
    expect(ff.results.m1?.stars).toBe(3);
    expect(ff.countedCodes).toHaveLength(s.countedCodes.length + 1);
    expect(ff.resultsEntered).toBe(s.resultsEntered + 1);
    expect(ff.learnStars.m1).toBe(3);
    expect(ff.stamps).toEqual(expect.arrayContaining(["player_one", "1"]));
    expect(ff.created).toEqual(expect.arrayContaining(["learn:m1", "test:m1", "help"]));
    expect(ff.created.filter((c) => c === "help")).toHaveLength(1);
  });

  it("never lowers a higher learnStars or a better result", () => {
    const s0 = ready();
    const s = { ...s0, learnStars: { m1: 3 as const } };
    const ff = fastForwardDemo(s);
    expect(ff.learnStars.m1).toBe(3);
    expect(fastForwardDemo(ff)).toEqual(ff);
  });

  it("does not mutate its input", () => {
    const s = fresh();
    const snap = JSON.stringify(s);
    fastForwardDemo(s);
    expect(JSON.stringify(s)).toBe(snap);
  });
});

import { setBadgeSteps } from "./progress";
describe("setBadgeSteps", () => {
  it("counts LEARN 3 stars, TEST 2+ stars and Help used", () => {
    const s = createInitialState(seededRandom(1));
    expect(setBadgeSteps(s, "m1")).toEqual({ done: 0, total: 3, steps: [false, false, false] });
    expect(setBadgeSteps({ ...s, helpUsed: true }, "m1")).toEqual({ done: 1, total: 3, steps: [false, false, true] });
    expect(setBadgeSteps({ ...s, learnStars: { m1: 2 } }, "m1").steps[0]).toBe(false);
    expect(setBadgeSteps({ ...s, learnStars: { m1: 3 }, helpUsed: true }, "m1")).toEqual({ done: 2, total: 3, steps: [true, false, true] });
    const r = { module: "m1", tasks: [], score: 90, stars: 3, techniques: [], at: "2026-01-01" } as never;
    expect(setBadgeSteps({ ...s, learnStars: { m1: 3 }, helpUsed: true, results: { m1: r } }, "m1")).toEqual({ done: 3, total: 3, steps: [true, true, true] });
  });
});

describe("openSet", () => {
  const fresh = () => createInitialState(seededRandom(7));
  it("creates LEARN, TEST and HELP of the set in order", () => {
    expect(openSet(fresh(), "m1").created).toEqual(["learn:m1", "test:m1", "help"]);
  });
  it("is idempotent", () => {
    const once = openSet(fresh(), "m1");
    expect(openSet(once, "m1")).toBe(once);
  });
  it("only fills what is missing", () => {
    const part = createItem(fresh(), "test:m1");
    expect(openSet(part, "m1").created).toEqual(["test:m1", "learn:m1", "help"]);
  });
  it("does not open sets beyond the demo (canCreateItem guard)", () => {
    const s = fresh();
    expect(openSet(s, "m2")).toBe(s);
  });
});
