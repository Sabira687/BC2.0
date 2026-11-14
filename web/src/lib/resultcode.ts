/**
 * TEST result codes: parsing and decoding.
 *
 * Format: SV1-<playerId>-<test>-<q1>-<q2>-<q3>-<p4>-<p5>-<bucket>[-<technique>…]
 * Tokens may come in any order; each must be a known token of this player:
 *   exactly one test token (identifies the module),
 *   exactly one outcome token for each of the 5 tasks of that module,
 *   exactly one score-bucket token, which must match the score the site
 *   computes from the task outcomes (integrity check),
 *   any number of technique tokens (only techniques of passed practical tasks count).
 */
import type { ModuleId, PlayerSecrets, PracticalOutcome, QuestionOutcome, Rank, TaskOutcomes, TechniqueCode } from "./types";
import { getModule, getTest } from "./content";
import { ALPHABET, MODULE_IDS, PLAYER_ID_LEN, PRACTICAL_OUTCOMES, RANKS, TECHNIQUE_CODES, TOKEN_LEN } from "./tokens";
import { bucketOf, scoreOf } from "./scoring";

export const CODE_PREFIX = "SV1";
/** Hard limits: raw input is cut off long before parsing. */
export const MAX_INPUT_LEN = 300;
export const MAX_TOKENS = 24;

export type ResultCodeError =
  | "empty"
  | "too_long"
  | "bad_format"
  | "wrong_version"
  | "wrong_player"
  | "unknown_token"
  | "duplicate_token"
  | "missing_test"
  | "mixed_tests"
  | "missing_task"
  | "conflicting_tokens"
  | "score_mismatch"
  | "already_counted";

export interface DecodedResult {
  /** Canonical form (tokens sorted), used for "already counted" detection. */
  normalized: string;
  module: ModuleId;
  tasks: TaskOutcomes;
  score: number;
  rank: Rank;
  techniques: TechniqueCode[];
}

export type ParseResult = { ok: true; playerId: string; tokens: string[]; normalized: string } | { ok: false; error: ResultCodeError };
export type DecodeResult = { ok: true; result: DecodedResult } | { ok: false; error: ResultCodeError };

const TOKEN_RE = new RegExp(`^[${ALPHABET}]{${TOKEN_LEN}}$`);
const PLAYER_RE = new RegExp(`^[${ALPHABET}]{${PLAYER_ID_LEN}}$`);

/**
 * Tolerant normalization: trims, uppercases, turns any dash-like character
 * into "-", strips quotes/backticks and a leading "RESULT CODE:" label, and
 * extracts the code from a pasted /result/ URL. Whitespace is read two ways:
 * as a separator ("SV1 ABCDE …") or as noise inside a wrapped line.
 */
export function normalizeCandidates(raw: string): string[] {
  let s = raw.slice(0, MAX_INPUT_LEN);
  // Pasted link: take the path segment after /result/.
  const url = /\/result\/([^\s?#/]+)/i.exec(s);
  if (url?.[1]) {
    const seg = url[1].replace(/[.,;:!?)\]>]+$/, ""); // sentence punctuation after a pasted link
    try {
      s = decodeURIComponent(seg);
    } catch {
      s = seg;
    }
  }
  s = s
    .replace(/[`'"“”‘’]/g, "")
    .trim()
    .replace(/^result\s*code\s*:?/i, "")
    .replace(/[‐-―−﹘﹣－_]/g, "-")
    .toUpperCase();
  const tidy = (x: string) => x.replace(/[.,;:!?)\]>]+$/, "").replace(/-+/g, "-").replace(/^-|-$/g, "");
  const asSeparator = tidy(s.trim().replace(/\s+/g, "-"));
  const asNoise = tidy(s.replace(/\s+/g, ""));
  return asSeparator === asNoise ? [asSeparator] : [asSeparator, asNoise];
}

export function normalizeInput(raw: string): string {
  return normalizeCandidates(raw)[0] ?? "";
}

function parseNormalized(s: string): ParseResult {
  if (s === "") return { ok: false, error: "empty" };
  if (!/^[A-Z0-9-]+$/.test(s)) return { ok: false, error: "bad_format" };
  const [prefix, playerId, ...tokens] = s.split("-");
  if (!prefix || !/^SV\d+$/.test(prefix)) return { ok: false, error: "bad_format" };
  if (prefix !== CODE_PREFIX) return { ok: false, error: "wrong_version" };
  if (!playerId || !PLAYER_RE.test(playerId)) return { ok: false, error: "bad_format" };
  if (tokens.length === 0) return { ok: false, error: "bad_format" };
  if (tokens.length > MAX_TOKENS) return { ok: false, error: "too_long" };
  if (!tokens.every((t) => TOKEN_RE.test(t))) return { ok: false, error: "bad_format" };
  return { ok: true, playerId, tokens, normalized: [prefix, playerId, ...tokens].join("-") };
}

export function parseResultCode(raw: unknown): ParseResult {
  if (typeof raw !== "string" || raw.trim() === "") return { ok: false, error: "empty" };
  if (raw.length > MAX_INPUT_LEN) return { ok: false, error: "too_long" };
  let first: ParseResult | null = null;
  for (const candidate of normalizeCandidates(raw)) {
    const r = parseNormalized(candidate);
    if (r.ok) return r;
    first ??= r;
  }
  return first ?? { ok: false, error: "empty" };
}

type Slot =
  | { kind: "test"; module: ModuleId }
  | { kind: "question"; module: ModuleId; index: 0 | 1 | 2; outcome: QuestionOutcome }
  | { kind: "practical"; module: ModuleId; index: 3 | 4; outcome: PracticalOutcome }
  | { kind: "bucket"; module: ModuleId; rank: Rank }
  | { kind: "tech"; code: TechniqueCode };

function buildIndex(secrets: PlayerSecrets): Map<string, Slot> {
  const idx = new Map<string, Slot>();
  for (const module of MODULE_IDS) {
    const m = secrets.tokens.modules[module];
    idx.set(m.test, { kind: "test", module });
    m.questions.forEach(([right, wrong], i) => {
      const index = i as 0 | 1 | 2;
      idx.set(right, { kind: "question", module, index, outcome: "right" });
      idx.set(wrong, { kind: "question", module, index, outcome: "wrong" });
    });
    m.practical.forEach((p, i) => {
      for (const outcome of PRACTICAL_OUTCOMES) idx.set(p[outcome], { kind: "practical", module, index: (i + 3) as 3 | 4, outcome });
    });
    for (const rank of RANKS) idx.set(m.bucket[rank], { kind: "bucket", module, rank });
  }
  for (const code of TECHNIQUE_CODES) idx.set(secrets.tokens.tech[code], { kind: "tech", code });
  return idx;
}

/** Decode a code against the player's secrets. "Already counted" is decided by the caller. */
export function decodeResultCode(raw: unknown, secrets: PlayerSecrets): DecodeResult {
  const parsed = parseResultCode(raw);
  if (!parsed.ok) return parsed;
  if (parsed.playerId !== secrets.playerId) return { ok: false, error: "wrong_player" };

  const idx = buildIndex(secrets);
  const seen = new Set<string>();
  const slots: Slot[] = [];
  for (const tok of parsed.tokens) {
    if (seen.has(tok)) return { ok: false, error: "duplicate_token" };
    seen.add(tok);
    const slot = idx.get(tok);
    if (!slot) return { ok: false, error: "unknown_token" };
    slots.push(slot);
  }

  const tests = slots.filter((s): s is Extract<Slot, { kind: "test" }> => s.kind === "test");
  if (tests.length === 0) return { ok: false, error: "missing_test" };
  if (tests.length > 1) return { ok: false, error: "mixed_tests" };
  const module = tests[0]!.module;

  const tasks: (QuestionOutcome | PracticalOutcome | null)[] = [null, null, null, null, null];
  let bucket: Rank | null = null;
  const techSet = new Set<TechniqueCode>();
  for (const s of slots) {
    if (s.kind === "test" || s.kind === "tech") {
      if (s.kind === "tech") techSet.add(s.code);
      continue;
    }
    if (s.module !== module) return { ok: false, error: "mixed_tests" };
    if (s.kind === "bucket") {
      if (bucket !== null) return { ok: false, error: "conflicting_tokens" };
      bucket = s.rank;
    } else {
      if (tasks[s.index] !== null) return { ok: false, error: "conflicting_tokens" };
      tasks[s.index] = s.outcome;
    }
  }
  if (tasks.some((t) => t === null)) return { ok: false, error: "missing_task" };
  if (bucket === null) return { ok: false, error: "missing_task" };

  const outcomes = tasks as TaskOutcomes;
  const score = scoreOf(outcomes);
  const rank = bucketOf(score);
  if (rank !== bucket) return { ok: false, error: "score_mismatch" };

  // Credit only techniques shown by practical tasks that actually passed
  // (falls back to the module's techniques when the test content is missing).
  const test = getTest(module);
  const allowed = new Set(
    test
      ? test.practical.flatMap((p, i) => (outcomes[i + 3] === "fail" ? [] : p.techniques))
      : getModule(module).techniques,
  );
  const order = TECHNIQUE_CODES;
  const techniques = [...techSet].filter((c) => allowed.has(c)).sort((a, b) => order.indexOf(a) - order.indexOf(b));
  // Canonical form: the same tokens in any order count as the same code.
  const normalized = [CODE_PREFIX, parsed.playerId, ...[...parsed.tokens].sort()].join("-");
  return { ok: true, result: { normalized, module, tasks: outcomes, score, rank, techniques } };
}

/** Build the code Claude is expected to print (tests and the e2e check). */
export function encodeResultCode(secrets: PlayerSecrets, module: ModuleId, tasks: TaskOutcomes, techniques: TechniqueCode[] = []): string {
  const m = secrets.tokens.modules[module];
  const [q1, q2, q3, p4, p5] = tasks;
  const q = (i: 0 | 1 | 2, o: QuestionOutcome) => m.questions[i][o === "right" ? 0 : 1];
  return [
    CODE_PREFIX,
    secrets.playerId,
    m.test,
    q(0, q1),
    q(1, q2),
    q(2, q3),
    m.practical[0][p4],
    m.practical[1][p5],
    m.bucket[bucketOf(scoreOf(tasks))],
    ...techniques.map((c) => secrets.tokens.tech[c]),
  ].join("-");
}

export const RESULT_ERROR_MESSAGES: Record<ResultCodeError, string> = {
  empty: "Paste the result code from your AI chat.",
  too_long: "That is too long to be a result code. Copy just the line that starts with SV1-.",
  bad_format: "We couldn't read this code. Copy the whole code, starting with SV1-.",
  wrong_version: "This result code is from a different version of AIGO.",
  wrong_player: "This result belongs to another player. Use the TEST card from your own collection.",
  unknown_token: "We couldn't read this code. One part of the code is not recognised — check for typos.",
  duplicate_token: "We couldn't read this code. Part of the code is repeated — copy it again from the chat.",
  missing_test: "We couldn't read this code. The code looks cut off — copy it again from the chat.",
  mixed_tests: "We couldn't read this code. The code mixes up two tests — copy it again from the chat.",
  missing_task: "We couldn't read this code. The code looks cut off — copy it again from the chat.",
  conflicting_tokens: "We couldn't read this code. A task appears twice — copy it again from the chat.",
  score_mismatch: "The result doesn't add up: the score in the code doesn't match the tasks. Copy it again from the chat.",
  already_counted: "Already counted — this result is in your progress.",
};
