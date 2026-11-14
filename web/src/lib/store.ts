/**
 * Versioned persistence in the visitor's browser (localStorage).
 * Everything read back is treated as untrusted and validated field by field;
 * anything invalid falls back to a fresh state with John prefilled.
 */
import type { AppState, ItemId, ModuleId, ModuleTestTokens, PlayerSecrets, PracticalOutcome, Rank, Stars, StampId, TechniqueCode, TestResult, TokenTable } from "./types";
import { validateProfile } from "./profile";
import { ALPHABET, MODULE_IDS, PLAYER_ID_LEN, PRACTICAL_OUTCOMES, RANKS, TECHNIQUE_CODES, TOKEN_LEN } from "./tokens";
import { COUNTED_CODES_MAX, addStamps, createInitialState } from "./progress";
import { MAX_INPUT_LEN } from "./resultcode";
import { scoreOf, testStars } from "./scoring";

export const STORAGE_KEY = "aigo:state:v4";
export const LEGACY_STORAGE_KEY_V3 = "aigo:state:v3";
/** Reject absurdly large stored blobs before parsing. */
const MAX_STORED_BYTES = 200_000;
const MAX_COUNT = 1_000_000;

const TOKEN_RE = new RegExp(`^[${ALPHABET}]{${TOKEN_LEN}}$`);
const PLAYER_RE = new RegExp(`^[${ALPHABET}]{${PLAYER_ID_LEN}}$`);
const MODULES = new Set<string>(MODULE_IDS);
const TECHS = new Set<string>(TECHNIQUE_CODES);
const ITEM_RE = /^(?:(?:learn|test):m[1-8]|help)$/;

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);
const isCount = (v: unknown): v is number => typeof v === "number" && Number.isInteger(v) && v >= 0 && v <= MAX_COUNT;
const isTech = (v: unknown): v is TechniqueCode => typeof v === "string" && TECHS.has(v);
const isDate = (v: unknown): v is string => typeof v === "string" && v.length <= 40 && !Number.isNaN(Date.parse(v));

function validModuleTokens(v: unknown, take: (t: unknown) => string | null): ModuleTestTokens | null {
  if (!isObj(v) || !Array.isArray(v.questions) || v.questions.length !== 3 || !Array.isArray(v.practical) || v.practical.length !== 2 || !isObj(v.bucket)) return null;
  const test = take(v.test);
  if (!test) return null;
  const questions: [string, string][] = [];
  for (const q of v.questions) {
    if (!Array.isArray(q) || q.length !== 2) return null;
    const right = take(q[0]);
    const wrong = take(q[1]);
    if (!right || !wrong) return null;
    questions.push([right, wrong]);
  }
  const practical: Record<PracticalOutcome, string>[] = [];
  for (const p of v.practical) {
    if (!isObj(p)) return null;
    const rec = {} as Record<PracticalOutcome, string>;
    for (const o of PRACTICAL_OUTCOMES) {
      const t = take(p[o]);
      if (!t) return null;
      rec[o] = t;
    }
    practical.push(rec);
  }
  const bucket = {} as Record<Rank, string>;
  for (const r of RANKS) {
    const t = take(v.bucket[r]);
    if (!t) return null;
    bucket[r] = t;
  }
  return {
    test,
    questions: questions as ModuleTestTokens["questions"],
    practical: practical as ModuleTestTokens["practical"],
    bucket,
  };
}

function validSecrets(v: unknown): PlayerSecrets | null {
  if (!isObj(v) || typeof v.playerId !== "string" || !PLAYER_RE.test(v.playerId) || !isObj(v.tokens)) return null;
  const used = new Set<string>();
  const take = (tok: unknown): string | null => {
    if (typeof tok !== "string" || !TOKEN_RE.test(tok) || used.has(tok)) return null;
    used.add(tok);
    return tok;
  };
  const rawModules = v.tokens.modules;
  const rawTech = v.tokens.tech;
  if (!isObj(rawModules) || !isObj(rawTech)) return null;
  const modules = {} as Record<ModuleId, ModuleTestTokens>;
  for (const id of MODULE_IDS) {
    const m = validModuleTokens(rawModules[id], take);
    if (!m) return null;
    modules[id] = m;
  }
  const tech = {} as Record<TechniqueCode, string>;
  for (const c of TECHNIQUE_CODES) {
    const t = take(rawTech[c]);
    if (!t) return null;
    tech[c] = t;
  }
  const tokens: TokenTable = { modules, tech };
  return { playerId: v.playerId, tokens };
}

const Q_OUT = new Set<string>(["right", "wrong"]);
const P_OUT = new Set<string>(PRACTICAL_OUTCOMES);

function validResult(v: unknown, module: ModuleId): TestResult | null {
  if (!isObj(v) || v.module !== module || !Array.isArray(v.tasks) || v.tasks.length !== 5 || !isDate(v.at)) return null;
  const t = v.tasks;
  if (![t[0], t[1], t[2]].every((o) => typeof o === "string" && Q_OUT.has(o)) || ![t[3], t[4]].every((o) => typeof o === "string" && P_OUT.has(o))) return null;
  const tasks = t as TestResult["tasks"];
  // Score and stars are recomputed, never trusted from storage.
  const score = scoreOf(tasks);
  if (!Array.isArray(v.techniques) || v.techniques.length > 12 || !v.techniques.every(isTech)) return null;
  return { module, tasks: tasks.map((x) => x) as TestResult["tasks"], score, stars: testStars(score), techniques: [...new Set(v.techniques)], at: v.at };
}

/** Validate untrusted data (e.g. parsed localStorage). Returns null when anything is off. */
export function validateState(v: unknown): AppState | null {
  if (!isObj(v) || v.version !== 4) return null;
  return validateBody(v);
}

/** Legacy v3 state: same shape without learnStars / stamps / helpUsed (defaults applied). */
function migrateV3(v: unknown): AppState | null {
  if (!isObj(v) || v.version !== 3) return null;
  return validateBody({ ...v, learnStars: {}, stamps: ["player_one"], helpUsed: false });
}

function validateBody(v: Obj): AppState | null {
  const profile = validateProfile(v.profile);
  if (!profile.ok) return null;
  const secrets = validSecrets(v.secrets);
  if (!secrets) return null;

  if (!Array.isArray(v.created) || v.created.length > 20 || !v.created.every((c) => typeof c === "string" && ITEM_RE.test(c))) return null;
  const created = [...new Set(v.created as ItemId[])];

  if (!isObj(v.results)) return null;
  const results: AppState["results"] = {};
  for (const [k, r] of Object.entries(v.results)) {
    if (!MODULES.has(k)) return null;
    const res = validResult(r, k as ModuleId);
    if (!res) return null;
    results[k as ModuleId] = res;
  }

  if (!isCount(v.resultsEntered) || typeof v.collectionViewed !== "boolean") return null;
  const sub = v.subscription;
  if (!isObj(sub) || typeof sub.active !== "boolean" || (sub.since !== null && !isDate(sub.since))) return null;
  const codes = v.countedCodes;
  if (!Array.isArray(codes) || codes.length > COUNTED_CODES_MAX) return null;
  if (!codes.every((c) => typeof c === "string" && c.length <= MAX_INPUT_LEN && /^SV\d+(-[A-Z0-9]+)+$/.test(c))) return null;

  if (!isObj(v.learnStars)) return null;
  const learnStars: AppState["learnStars"] = {};
  for (const [k, n] of Object.entries(v.learnStars)) {
    if (!MODULES.has(k) || typeof n !== "number" || !Number.isInteger(n) || n < 0 || n > 3) return null;
    learnStars[k as ModuleId] = n as Stars;
  }
  if (!Array.isArray(v.stamps) || v.stamps.length > 20 || !v.stamps.every((s) => s === "player_one" || isTech(s))) return null;
  // Stored results are already verified: their techniques are always stamps (v3 migration, tampered stamps).
  const stamps = addStamps([...new Set(v.stamps as StampId[])], Object.values(results).flatMap((r) => (r ? r.techniques : [])));
  if (typeof v.helpUsed !== "boolean") return null;
  // `demo` is optional in storage (older v4 states and v3 migrations): missing → default.
  let fastForwarded = false;
  if (v.demo !== undefined) {
    if (!isObj(v.demo) || typeof v.demo.fastForwarded !== "boolean") return null;
    fastForwarded = v.demo.fastForwarded;
  }

  return {
    version: 4,
    profile: profile.profile,
    secrets,
    created,
    results,
    resultsEntered: v.resultsEntered,
    subscription: { active: sub.active, since: sub.active ? (sub.since as string | null) : null },
    collectionViewed: v.collectionViewed,
    countedCodes: codes as string[],
    learnStars,
    stamps,
    helpUsed: v.helpUsed,
    demo: { fastForwarded },
  };
}

/** Minimal Storage surface so tests can pass a fake. */
export type KeyValueStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function browserStorage(): KeyValueStorage | null {
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch {
    return null; // access can throw (privacy mode, blocked storage)
  }
}

/** Read state; on missing/corrupt data create a fresh one and try to persist it. */
export function loadState(storage: KeyValueStorage | null = browserStorage()): AppState {
  const read = (key: string): string | null => {
    try {
      return storage?.getItem(key) ?? null;
    } catch {
      return null;
    }
  };
  const raw = read(STORAGE_KEY);
  if (raw !== null && raw.length <= MAX_STORED_BYTES) {
    try {
      const state = validateState(JSON.parse(raw));
      if (state) return state;
    } catch {
      // fall through to the legacy key / a fresh state
    }
  } else if (raw === null) {
    const legacy = read(LEGACY_STORAGE_KEY_V3);
    if (legacy !== null && legacy.length <= MAX_STORED_BYTES) {
      try {
        const state = migrateV3(JSON.parse(legacy));
        if (state) {
          saveState(state, storage);
          return state;
        }
      } catch {
        // fall through to a fresh state
      }
    }
  }
  const fresh = createInitialState();
  saveState(fresh, storage);
  return fresh;
}

/** Returns false when the browser refused to store (quota, privacy mode). */
export function saveState(state: AppState, storage: KeyValueStorage | null = browserStorage()): boolean {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(state));
    return storage !== null;
  } catch {
    return false;
  }
}

/** Manual reset: a brand-new player (new id and token table), John prefilled. */
export function resetState(storage: KeyValueStorage | null = browserStorage()): AppState {
  try {
    storage?.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
  const fresh = createInitialState();
  saveState(fresh, storage);
  return fresh;
}
