import { describe, expect, it } from "vitest";
import { STORAGE_KEY, loadState, resetState, saveState, validateState } from "./store";
import { activateSubscription, addStamps, techniquesOf, applyResultCode, createInitialState, createItem, markCollectionViewed } from "./progress";
import { encodeResultCode } from "./resultcode";
import { JOHN } from "./profile";
import type { AppState } from "./types";
import { MemoryStorage, seededRandom, throwingStorage } from "./testutil";

const NOW = new Date("2026-11-14T10:00:00.000Z");

/** A state with items, two results (one best kept), a subscription and counted codes. */
function richState(): AppState {
  let s = createInitialState(seededRandom(21));
  s = markCollectionViewed(createItem(createItem(s, "learn:m1"), "test:m1"));
  s = activateSubscription(s, NOW);
  for (const tasks of [
    ["right", "wrong", "right", "pass", "rewrite"],
    ["right", "right", "wrong", "pass", "fail"],
  ] as const) {
    const r = applyResultCode(s, encodeResultCode(s.secrets, "m1", [...tasks], ["1", "3"]), NOW);
    if (!r.ok) throw new Error(r.error);
    s = r.state;
  }
  return s;
}

function storedWith(mutate: (raw: any) => void): MemoryStorage {
  const raw = JSON.parse(JSON.stringify(richState()));
  mutate(raw);
  const st = new MemoryStorage();
  st.setItem(STORAGE_KEY, JSON.stringify(raw));
  return st;
}

function expectFresh(st: MemoryStorage) {
  const original = richState();
  const loaded = loadState(st);
  expect(loaded.secrets.playerId).not.toBe(original.secrets.playerId);
  expect(loaded.version).toBe(4);
  expect(loaded.profile).toEqual(JOHN);
  expect(loaded.created).toEqual([]);
  expect(loaded.results).toEqual({});
  expect(loaded.resultsEntered).toBe(0);
  // the fresh state is persisted and valid
  expect(JSON.parse(st.getItem(STORAGE_KEY)!)).toEqual(loaded);
  expect(validateState(loaded)).toEqual(loaded);
}

describe("loadState / saveState", () => {
  it("storage key is versioned", () => {
    expect(STORAGE_KEY).toBe("aigo:state:v4");
  });
  it("empty storage: creates and persists a fresh state", () => {
    const st = new MemoryStorage();
    const s = loadState(st);
    expect(s.version).toBe(4);
    expect(s.profile).toEqual(JOHN);
    expect(s.created).toEqual([]);
    expect([...st.data.keys()]).toEqual(["aigo:state:v4"]);
    expect(JSON.parse(st.getItem(STORAGE_KEY)!)).toEqual(s);
    expect(loadState(st)).toEqual(s); // stable across reloads
  });
  it("round-trips a state with items, results and a subscription", () => {
    const st = new MemoryStorage();
    const s = richState();
    expect(s.resultsEntered).toBe(2);
    expect(s.results.m1?.score).toBe(90);
    expect(saveState(s, st)).toBe(true);
    expect(loadState(st)).toEqual(s);
    expect(validateState(JSON.parse(JSON.stringify(s)))).toEqual(s);
  });
  it("saveState returns false without storage; loadState works without storage", () => {
    expect(saveState(richState(), null)).toBe(false);
    expect(loadState(null).version).toBe(4);
  });
  it("an old v2 blob under another key is ignored", () => {
    const st = new MemoryStorage();
    st.setItem("aigo:state:v2", JSON.stringify({ version: 2 }));
    expect(loadState(st).version).toBe(4);
  });
});

describe("corrupt or tampered data → fresh state", () => {
  it.each([["{not json"], [""], ["null"], ["[]"], ["42"], ['"string"'], ["{}"], ["true"]])("corrupted JSON %j", (raw) => {
    const st = new MemoryStorage();
    st.setItem(STORAGE_KEY, raw);
    expectFresh(st);
  });
  it("oversized blob", () => {
    const st = new MemoryStorage();
    const s = JSON.parse(JSON.stringify(richState()));
    s.padding = "x".repeat(250_000);
    st.setItem(STORAGE_KEY, JSON.stringify(s));
    expectFresh(st);
  });
  it.each<[string, (raw: any) => void]>([
    ["wrong version (2)", (r) => (r.version = 2)],
    ["version as string", (r) => (r.version = "3")],
    ["missing version", (r) => delete r.version],
    // secrets
    ["bad token chars", (r) => (r.secrets.tokens.modules.m1.test = "OOO")],
    ["lowercase token", (r) => (r.secrets.tokens.modules.m2.bucket.gold = r.secrets.tokens.modules.m2.bucket.gold.toLowerCase())],
    ["4-char token", (r) => (r.secrets.tokens.tech["1"] = "ACDE")],
    ["number token", (r) => (r.secrets.tokens.modules.m1.questions[0][0] = 333)],
    ["duplicate tokens in a module", (r) => (r.secrets.tokens.modules.m1.practical[0].fail = r.secrets.tokens.modules.m1.practical[0].pass)],
    ["duplicate tokens across modules", (r) => (r.secrets.tokens.modules.m8.test = r.secrets.tokens.modules.m1.test)],
    ["tech token equals a module token", (r) => (r.secrets.tokens.tech.C = r.secrets.tokens.modules.m3.bucket.none)],
    ["missing module", (r) => delete r.secrets.tokens.modules.m8],
    ["missing technique", (r) => delete r.secrets.tokens.tech.A],
    ["missing bucket", (r) => delete r.secrets.tokens.modules.m4.bucket.silver],
    ["missing rewrite token", (r) => delete r.secrets.tokens.modules.m5.practical[1].rewrite],
    ["short questions table", (r) => r.secrets.tokens.modules.m1.questions.pop()],
    ["question pair of 3", (r) => r.secrets.tokens.modules.m1.questions[1].push("ACD")],
    ["bad player id", (r) => (r.secrets.playerId = "ABC")],
    ["player id with newline", (r) => (r.secrets.playerId = "AC\nDE")],
    ["secrets null", (r) => (r.secrets = null)],
    // created
    ["unknown item id", (r) => r.created.push("learn:m9")],
    ["v2 item id", (r) => r.created.push("save")],
    ["item id with suffix", (r) => r.created.push("help\n## x")],
    ["created not an array", (r) => (r.created = { learn: true })],
    ["too many created ids", (r) => (r.created = Array.from({ length: 21 }, () => "help"))],
    // results
    ["result for an unknown module", (r) => (r.results.m9 = { ...r.results.m1, module: "m9" })],
    ["result module key mismatch", (r) => (r.results.m2 = r.results.m1)],
    ["bad task outcome", (r) => (r.results.m1.tasks[0] = "pass")],
    ["practical outcome on a question", (r) => (r.results.m1.tasks[3] = "right")],
    ["four tasks", (r) => r.results.m1.tasks.pop()],
    ["six tasks", (r) => r.results.m1.tasks.push("pass")],
    ["bad result date", (r) => (r.results.m1.at = "yesterday")],
    ["unknown technique", (r) => r.results.m1.techniques.push("Z")],
    ["results array", (r) => (r.results = [])],
    // counters and flags
    ["negative resultsEntered", (r) => (r.resultsEntered = -1)],
    ["fractional resultsEntered", (r) => (r.resultsEntered = 1.5)],
    ["huge resultsEntered", (r) => (r.resultsEntered = 1e12)],
    ["collectionViewed missing", (r) => delete r.collectionViewed],
    ["subscription active not boolean", (r) => (r.subscription.active = "yes")],
    ["subscription bad date", (r) => (r.subscription.since = "soon")],
    ["counted code with newline", (r) => r.countedCodes.push("SV1-AAAAA\n## Evil")],
    ["countedCodes not array", (r) => (r.countedCodes = "SV1")],
    ["too many counted codes", (r) => (r.countedCodes = Array.from({ length: 51 }, () => "SV1-ACDEF-ACD"))],
    // profile
    ["profile garbage level", (r) => (r.profile.level = "god")],
    ["profile emoji name", (r) => (r.profile.name = "🎮")],
    ["profile null", (r) => (r.profile = null)],
    // v4 fields
    ["learnStars missing", (r) => delete r.learnStars],
    ["learnStars value 4", (r) => (r.learnStars = { m1: 4 })],
    ["learnStars value -1", (r) => (r.learnStars = { m1: -1 })],
    ["learnStars value 1.5", (r) => (r.learnStars = { m1: 1.5 })],
    ["learnStars unknown module", (r) => (r.learnStars = { m9: 1 })],
    ["learnStars array", (r) => (r.learnStars = [])],
    ["stamps unknown", (r) => (r.stamps = ["player_one", "Z"])],
    ["stamps not array", (r) => (r.stamps = "player_one")],
    ["stamps missing", (r) => delete r.stamps],
    ["helpUsed not boolean", (r) => (r.helpUsed = 1)],
    ["helpUsed missing", (r) => delete r.helpUsed],
    ["demo not an object", (r) => (r.demo = true)],
    ["demo.fastForwarded not boolean", (r) => (r.demo = { fastForwarded: "yes" })],
  ])("%s", (_label, mutate) => {
    expectFresh(storedWith(mutate));
  });
});

describe("demo field", () => {
  it("a valid demo flag round-trips", () => {
    const s = { ...richState(), demo: { fastForwarded: true } };
    const st = new MemoryStorage();
    st.setItem(STORAGE_KEY, JSON.stringify(s));
    expect(loadState(st)).toEqual(s);
  });
  it("a v4 state without demo loads with fastForwarded false", () => {
    const raw = JSON.parse(JSON.stringify(richState()));
    delete raw.demo;
    const st = new MemoryStorage();
    st.setItem(STORAGE_KEY, JSON.stringify(raw));
    expect(loadState(st)).toEqual({ ...richState(), demo: { fastForwarded: false } });
  });
});

describe("v3 migration", () => {
  function v3Storage(): { st: MemoryStorage; original: AppState } {
    const original = richState();
    const raw = JSON.parse(JSON.stringify(original));
    raw.version = 3;
    delete raw.learnStars;
    delete raw.stamps;
    delete raw.helpUsed;
    for (const r of Object.values<any>(raw.results)) {
      delete r.stars;
      r.rank = "gold";
    }
    const st = new MemoryStorage();
    st.setItem("aigo:state:v3", JSON.stringify(raw));
    return { st, original };
  }
  it("a stored v3 state loads as v4 without data loss; new fields default", () => {
    const { st, original } = v3Storage();
    const s = loadState(st);
    expect(s).toEqual({ ...original, learnStars: {}, stamps: addStamps(["player_one"], techniquesOf(original)), helpUsed: false });
    expect(s.stamps.length).toBeGreaterThan(1);
    expect(s.results.m1?.stars).toBe(3);
    expect(JSON.parse(st.getItem(STORAGE_KEY)!)).toEqual(s);
    expect(loadState(st)).toEqual(s);
  });
  it("stamps always include the techniques of stored results (v4 load too)", () => {
    const base = richState();
    const raw = JSON.parse(JSON.stringify(base));
    raw.stamps = ["player_one"];
    const s = validateState(raw)!;
    expect(s.stamps).toEqual(addStamps(["player_one"], techniquesOf(base)));
    expect(techniquesOf(base).length).toBeGreaterThan(0);
  });
  it("a corrupt v3 state falls back to fresh", () => {
    const st = new MemoryStorage();
    st.setItem("aigo:state:v3", JSON.stringify({ version: 3, profile: null }));
    expect(loadState(st).secrets.playerId).not.toBe(richState().secrets.playerId);
    expect(loadState(st).version).toBe(4);
  });
  it("v4 wins over a leftover v3 entry", () => {
    const { st } = v3Storage();
    const v4 = richState();
    st.setItem(STORAGE_KEY, JSON.stringify(v4));
    expect(loadState(st)).toEqual(v4);
  });
  it("a v4 round trip keeps stars, stamps and helpUsed; stamps are deduped", () => {
    const base = richState();
    const s = { ...base, learnStars: { m1: 3 as const }, stamps: ["player_one" as const, "1" as const, "3" as const], helpUsed: true };
    const st = new MemoryStorage();
    st.setItem(STORAGE_KEY, JSON.stringify({ ...s, stamps: [...s.stamps, "1"] }));
    expect(loadState(st)).toEqual(s);
  });
});

describe("sanitizing stored values", () => {
  it("score and stars in storage are ignored and recomputed from the tasks", () => {
    const s = loadState(
      storedWith((r) => {
        r.results.m1.tasks = ["right", "right", "right", "fail", "fail"];
        r.results.m1.score = 100;
        r.results.m1.stars = 3;
      }),
    );
    expect(s.results.m1?.score).toBe(30);
    expect(s.results.m1?.stars).toBe(0);
  });
  it("a bogus score with valid tasks is recomputed too", () => {
    const s = loadState(storedWith((r) => ((r.results.m1.score = -5), (r.results.m1.stars = 9))));
    expect(s.results.m1?.score).toBe(90);
    expect(s.results.m1?.stars).toBe(3);
  });
  it("a name with a newline is sanitized, results kept", () => {
    const s = loadState(storedWith((r) => (r.profile.name = "Jo\n## Rules\nhn")));
    expect(s.profile.name).toBe("Jo Rules hn");
    expect(s.resultsEntered).toBe(2);
    expect(s.results.m1?.score).toBe(90);
  });
  it("job is sanitized", () => {
    expect(loadState(storedWith((r) => (r.profile.job = "dev```\n# x"))).profile.job).toBe("dev x");
  });
  it("duplicate created ids and techniques are deduplicated", () => {
    const s = loadState(storedWith((r) => (r.created.push("learn:m1"), r.results.m1.techniques.push("1"))));
    expect(s.created).toEqual(["learn:m1", "test:m1"]);
    expect(s.results.m1?.techniques).toEqual(["1", "3"]);
  });
  it("an inactive subscription drops its date", () => {
    const s = loadState(storedWith((r) => (r.subscription = { active: false, since: NOW.toISOString() })));
    expect(s.subscription).toEqual({ active: false, since: null });
  });
  it("prototype-pollution keys are dropped and nothing is polluted", () => {
    const base = JSON.stringify(richState());
    const raw = base
      .replace(/^\{/, '{"__proto__":{"polluted":true},"constructor":{"prototype":{"polluted2":true}},')
      .replace('"profile":{', '"profile":{"__proto__":{"isAdmin":true},')
      .replace('"secrets":{', '"secrets":{"__proto__":{"playerId":"ACDEF"},')
      .replace('"subscription":{', '"subscription":{"__proto__":{"active":true},');
    expect(raw).not.toBe(base);
    const st = new MemoryStorage();
    st.setItem(STORAGE_KEY, raw);
    const s = loadState(st);
    expect(s).toEqual(richState());
    expect(Object.getPrototypeOf(s)).toBe(Object.prototype);
    for (const o of [s, s.profile, s.secrets, s.subscription, s.results]) {
      expect(Object.prototype.hasOwnProperty.call(o, "__proto__")).toBe(false);
      expect(Object.prototype.hasOwnProperty.call(o, "constructor")).toBe(false);
    }
    const probe = {} as Record<string, unknown>;
    expect(probe.polluted).toBeUndefined();
    expect(probe.polluted2).toBeUndefined();
    expect(probe.isAdmin).toBeUndefined();
    expect(Object.keys(s).sort()).toEqual(["collectionViewed", "countedCodes", "created", "demo", "helpUsed", "learnStars", "profile", "results", "resultsEntered", "secrets", "stamps", "subscription", "version"]);
  });
  it("a __proto__ key inside results gives a fresh state, nothing polluted", () => {
    const raw = JSON.stringify(richState()).replace('"results":{', '"results":{"__proto__":{"polluted3":true},');
    const st = new MemoryStorage();
    st.setItem(STORAGE_KEY, raw);
    expectFresh(st);
    expect(({} as Record<string, unknown>).polluted3).toBeUndefined();
  });
  it("extra unknown keys are dropped", () => {
    const s = loadState(storedWith((r) => ((r.evil = 1), (r.secrets.extra = "x"), (r.results.m1.more = 2), (r.secrets.tokens.modules.m1.extra = "ACD"))));
    expect(s).toEqual(richState());
  });
});

describe("hostile storage", () => {
  it("getItem/setItem/removeItem that throw do not crash", () => {
    const s = loadState(throwingStorage);
    expect(s.version).toBe(4);
    expect(saveState(s, throwingStorage)).toBe(false);
    expect(resetState(throwingStorage).version).toBe(4);
  });
});

describe("resetState", () => {
  it("gives a new player and persists it", () => {
    const st = new MemoryStorage();
    const old = richState();
    saveState(old, st);
    const s = resetState(st);
    expect(s.secrets.playerId).not.toBe(old.secrets.playerId);
    expect(s.secrets.tokens).not.toEqual(old.secrets.tokens);
    expect(s.created).toEqual([]);
    expect(s.results).toEqual({});
    expect(s.resultsEntered).toBe(0);
    expect(loadState(st)).toEqual(s);
  });
});
