import { describe, expect, it } from "vitest";
import {
  CODE_PREFIX,
  MAX_INPUT_LEN,
  MAX_TOKENS,
  RESULT_ERROR_MESSAGES,
  decodeResultCode,
  encodeResultCode,
  normalizeInput,
  parseResultCode,
  type ResultCodeError,
} from "./resultcode";
import { ALPHABET, MODULE_IDS, TECHNIQUE_CODES, allTokens, createSecrets } from "./tokens";
import { getModule, getTest } from "./content";
import { bucketOf, scoreOf } from "./scoring";
import { ALL_OUTCOMES, seededRandom } from "./testutil";
import type { TaskOutcomes } from "./types";

const S = createSecrets(seededRandom(31));
const OTHER = createSecrets(seededRandom(32));
const PID = S.playerId;
const M1 = S.tokens.modules.m1;
const M2 = S.tokens.modules.m2;
const GOLD: TaskOutcomes = ["right", "right", "right", "pass", "pass"];
const C = encodeResultCode(S, "m1", GOLD, ["1", "2"]);

const tokensOf = (code: string) => code.split("-").slice(2);
const withTokens = (toks: string[], pid = PID) => [CODE_PREFIX, pid, ...toks].join("-");
/** Replace one token by another (token-wise, never inside the player id). */
const swap = (code: string, from: string, to: string) => withTokens(tokensOf(code).map((t) => (t === from ? to : t)), code.split("-")[1]);

function decodeOk(raw: unknown) {
  const r = decodeResultCode(raw, S);
  if (!r.ok) throw new Error(`expected ok, got ${r.error} for ${JSON.stringify(raw)}`);
  return r.result;
}
function errorOf(raw: unknown): ResultCodeError | null {
  const r = decodeResultCode(raw, S);
  return r.ok ? null : r.error;
}

/** A well-formed token that is not in S's table. */
const UNKNOWN = (() => {
  const used = new Set(allTokens(S));
  for (const a of ALPHABET) for (const b of ALPHABET) for (const c of ALPHABET) if (!used.has(a + b + c)) return a + b + c;
  throw new Error("no free token");
})();

describe("encodeResultCode → decodeResultCode round-trip", () => {
  /** Expected credit: techniques of passed practical tasks (module techniques when no test content). */
  function creditedTechniques(m: Parameters<typeof getModule>[0], tasks: readonly string[]): string[] {
    const test = getTest(m);
    const set = new Set<string>(test ? test.practical.flatMap((p, i) => (tasks[i + 3] === "fail" ? [] : p.techniques)) : getModule(m).techniques);
    return [...TECHNIQUE_CODES].filter((c) => set.has(c));
  }

  it("John's gold code looks like SV1-<player>-<test>-<q1>-<q2>-<q3>-<p4>-<p5>-<bucket>-<tech>…", () => {
    expect(C).toBe(
      [CODE_PREFIX, PID, M1.test, M1.questions[0][0], M1.questions[1][0], M1.questions[2][0], M1.practical[0].pass, M1.practical[1].pass, M1.bucket.gold, S.tokens.tech["1"], S.tokens.tech["2"]].join("-"),
    );
  });

  it.each(ALL_OUTCOMES.map((t) => [t.join(" "), t] as const))("m1 %s", (_l, tasks) => {
    const code = encodeResultCode(S, "m1", tasks, [...TECHNIQUE_CODES]);
    const r = decodeOk(code);
    expect(r.module).toBe("m1");
    expect(r.tasks).toEqual(tasks);
    expect(r.score).toBe(scoreOf(tasks));
    expect(r.rank).toBe(bucketOf(scoreOf(tasks)));
    expect(r.techniques).toEqual(creditedTechniques("m1", tasks)); // only from passed practical tasks
    // Canonical form: prefix, player, then the tokens sorted (order-independent).
    const [pre, pid, ...toks] = code.split("-");
    expect(r.normalized).toBe([pre, pid, ...toks.sort()].join("-"));
  });

  it("every module, every outcome combination, with and without techniques", () => {
    for (const m of MODULE_IDS) {
      for (const tasks of ALL_OUTCOMES) {
        const none = decodeOk(encodeResultCode(S, m, tasks));
        expect(none.module).toBe(m);
        expect(none.tasks).toEqual(tasks);
        expect(none.score).toBe(scoreOf(tasks));
        expect(none.techniques).toEqual([]);
        const all = decodeOk(encodeResultCode(S, m, tasks, [...TECHNIQUE_CODES].reverse()));
        expect(all.techniques).toEqual(creditedTechniques(m, tasks));
      }
    }
  });

  it("techniques come back in code order, foreign ones dropped", () => {
    expect(decodeOk(encodeResultCode(S, "m1", GOLD, ["3", "C", "1", "4"])).techniques).toEqual(["1", "3"]);
  });
});

describe("tolerant input", () => {
  const expected = decodeOk(C);
  const cases: Array<[string, string]> = [
    ["lowercase", C.toLowerCase()],
    ["spaces instead of dashes", C.replace(/-/g, " ")],
    ["multiple spaces and tabs", C.replace(/-/g, " \t ")],
    ["newline after a dash", C.replace(/-/g, (d, i: number) => (i > 20 && i < 26 ? "-\n" : d))],
    ["newline inside a token", `${C.slice(0, 15)}\n${C.slice(15)}`],
    ["CRLF line wrap", `${C.slice(0, 22)}\r\n${C.slice(22)}`],
    ["en dashes", C.replace(/-/g, "–")],
    ["em dashes", C.replace(/-/g, "—")],
    ["mixed dash characters", C.split("-").join("‑").replace("‑", "−")],
    ["surrounding backticks", `\`${C}\``],
    ["code fence", "```\n" + C + "\n```"],
    ["surrounding quotes", `"${C}"`],
    ["leading/trailing whitespace", `  \n ${C} \n `],
    ["RESULT CODE: prefix", `RESULT CODE: ${C}`],
    ["lowercase prefix without space", `result code:${C}`],
    ["prefix inside backticks", `\`RESULT CODE: ${C}\``],
    ["prefix outside backticks", `RESULT CODE: \`${C}\``],
    ["pasted URL", `http://localhost:3000/result/${C}`],
    ["pasted https URL with query and hash", `https://aigo.app/result/${C}?utm=x#top`],
    ["URL-encoded URL", `http://localhost:3000/result/${encodeURIComponent(C)}`],
    ["line with URL label", `See your result: http://localhost:3000/result/${C}`],
  ];
  it.each(cases)("%s", (_l, raw) => {
    expect(raw.length).toBeLessThanOrEqual(MAX_INPUT_LEN);
    expect(decodeOk(raw)).toEqual(expected);
  });

  it("normalizeInput gives the canonical code", () => {
    expect(normalizeInput(`  \`RESULT CODE: ${C.toLowerCase().replace(/-/g, "—")}\`  `)).toBe(C);
  });

  it("tokens in shuffled order still decode to the same result", () => {
    const toks = tokensOf(C);
    for (let seed = 1; seed <= 20; seed++) {
      const rnd = seededRandom(seed);
      const shuffled = [...toks];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = rnd(1)[0]! % (i + 1);
        [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
      }
      const r = decodeOk(withTokens(shuffled));
      expect({ ...r, normalized: "" }).toEqual({ ...expected, normalized: "" });
    }
    expect(decodeOk(withTokens([...toks].reverse())).score).toBe(100);
  });
});

describe("errors", () => {
  it.each([[""], ["   "], [" \n\t "], [undefined], [null], [42], [{}], [["SV1"]]])("empty: %j", (raw) => {
    expect(errorOf(raw)).toBe("empty");
  });

  it("too_long: over 300 characters", () => {
    expect(errorOf(`${C} ${"x".repeat(MAX_INPUT_LEN)}`)).toBe("too_long");
    expect(errorOf(" ".repeat(MAX_INPUT_LEN) + C)).toBe("too_long");
  });

  it("too_long: more than 24 tokens", () => {
    expect(MAX_TOKENS).toBe(24);
    const toks = tokensOf(C);
    const pad = (n: number) => Array.from({ length: n }, () => UNKNOWN);
    expect(errorOf(withTokens([...toks, ...pad(MAX_TOKENS + 1 - toks.length)]))).toBe("too_long");
    // exactly 24 is parsed (then rejected for the unknown token, not for length)
    expect(errorOf(withTokens([...toks, ...pad(MAX_TOKENS - toks.length)]))).toBe("unknown_token");
  });

  it.each<[string, string]>([
    ["bad prefix", C.replace(/^SV1/, "XV1")],
    ["missing prefix", C.split("-").slice(1).join("-")],
    ["prefix only", "SV1"],
    ["no tokens", `SV1-${PID}`],
    ["O in a token", withTokens(["O" + M1.test.slice(1), ...tokensOf(C).slice(1)])],
    ["0 in a token", withTokens(["0" + M1.test.slice(1), ...tokensOf(C).slice(1)])],
    ["1 in a token", withTokens(["1" + M1.test.slice(1), ...tokensOf(C).slice(1)])],
    ["O in the player id", withTokens(tokensOf(C), "O" + PID.slice(1))],
    ["short player id", withTokens(tokensOf(C), PID.slice(0, 4))],
    ["2-char token", withTokens([M1.test.slice(0, 2), ...tokensOf(C).slice(1)])],
    ["4-char token", withTokens([M1.test + "A", ...tokensOf(C).slice(1)])],
    ["punctuation", C.replace(/-/g, ".")],
    ["emoji", `${C}-🎮`],
  ])("bad_format: %s", (_l, raw) => {
    expect(errorOf(raw)).toBe("bad_format");
  });

  it("wrong_version: SV2", () => {
    expect(errorOf(C.replace(/^SV1/, "SV2"))).toBe("wrong_version");
    expect(errorOf(C.replace(/^SV1/, "sv9"))).toBe("wrong_version");
  });

  it("wrong_player: another player's code", () => {
    expect(errorOf(encodeResultCode(OTHER, "m1", GOLD))).toBe("wrong_player");
    expect(errorOf(withTokens(tokensOf(C), OTHER.playerId))).toBe("wrong_player");
  });

  it("unknown_token", () => {
    const toks = tokensOf(C);
    toks[2] = UNKNOWN;
    expect(errorOf(withTokens(toks))).toBe("unknown_token");
    // another player's tokens under my id are unknown to me (unless they collide by chance)
    const theirs = tokensOf(encodeResultCode(OTHER, "m1", GOLD)).filter((t) => !allTokens(S).includes(t));
    expect(theirs.length).toBeGreaterThan(0);
    expect(errorOf(withTokens([...tokensOf(C), theirs[0]!]))).toBe("unknown_token");
  });

  it("duplicate_token", () => {
    expect(errorOf(`${C}-${M1.test}`)).toBe("duplicate_token");
    expect(errorOf(`${C}-${S.tokens.tech["1"]}`)).toBe("duplicate_token");
    expect(errorOf(`${C}-${M1.questions[0][0]}`)).toBe("duplicate_token");
  });

  it("missing_test", () => {
    expect(errorOf(withTokens(tokensOf(C).filter((t) => t !== M1.test)))).toBe("missing_test");
    expect(errorOf(withTokens([S.tokens.tech["1"]!]))).toBe("missing_test");
  });

  it("mixed_tests", () => {
    // test token of m1 + a task token of m2
    expect(errorOf(swap(C, M1.questions[0][0], M2.questions[0][0]))).toBe("mixed_tests");
    expect(errorOf(swap(C, M1.practical[1].pass, M2.practical[1].pass))).toBe("mixed_tests");
    expect(errorOf(swap(C, M1.bucket.gold, M2.bucket.gold))).toBe("mixed_tests");
    // two test tokens
    expect(errorOf(`${C}-${M2.test}`)).toBe("mixed_tests");
  });

  it("missing_task: one task or the bucket missing", () => {
    for (const drop of [M1.questions[0][0], M1.questions[1][0], M1.questions[2][0], M1.practical[0].pass, M1.practical[1].pass, M1.bucket.gold]) {
      expect(errorOf(withTokens(tokensOf(C).filter((t) => t !== drop))), drop).toBe("missing_task");
    }
    expect(errorOf(withTokens([M1.test]))).toBe("missing_task");
  });

  it("conflicting_tokens: two outcomes for one task, two buckets", () => {
    expect(errorOf(`${C}-${M1.questions[0][1]}`)).toBe("conflicting_tokens");
    expect(errorOf(`${C}-${M1.questions[2][1]}`)).toBe("conflicting_tokens");
    expect(errorOf(`${C}-${M1.practical[0].rewrite}`)).toBe("conflicting_tokens");
    expect(errorOf(`${C}-${M1.practical[1].fail}`)).toBe("conflicting_tokens");
    expect(errorOf(`${C}-${M1.bucket.silver}`)).toBe("conflicting_tokens");
  });

  it("score_mismatch: gold bucket with a 30-point task set", () => {
    const thirty: TaskOutcomes = ["right", "right", "right", "fail", "fail"];
    const honest = encodeResultCode(S, "m1", thirty);
    expect(decodeOk(honest).score).toBe(30);
    expect(errorOf(swap(honest, M1.bucket.none, M1.bucket.gold))).toBe("score_mismatch");
    // every wrong bucket for every outcome set is caught
    for (const tasks of ALL_OUTCOMES) {
      const code = encodeResultCode(S, "m1", tasks);
      const real = bucketOf(scoreOf(tasks));
      for (const rank of ["none", "bronze", "silver", "gold"] as const) {
        if (rank === real) continue;
        expect(errorOf(swap(code, M1.bucket[real], M1.bucket[rank]))).toBe("score_mismatch");
      }
    }
  });
});

describe("parseResultCode", () => {
  it("returns player, tokens and the normalized code", () => {
    const r = parseResultCode(`result code: ${C.toLowerCase()}`);
    expect(r).toEqual({ ok: true, playerId: PID, tokens: tokensOf(C), normalized: C });
  });
  it("does not check tokens against a player", () => {
    expect(parseResultCode(encodeResultCode(OTHER, "m1", GOLD)).ok).toBe(true);
  });
});

describe("RESULT_ERROR_MESSAGES", () => {
  it("has a non-empty message for every error", () => {
    const errors: ResultCodeError[] = [
      "empty",
      "too_long",
      "bad_format",
      "wrong_version",
      "wrong_player",
      "unknown_token",
      "duplicate_token",
      "missing_test",
      "mixed_tests",
      "missing_task",
      "conflicting_tokens",
      "score_mismatch",
      "already_counted",
    ];
    expect(Object.keys(RESULT_ERROR_MESSAGES).sort()).toEqual([...errors].sort());
    for (const e of errors) expect(RESULT_ERROR_MESSAGES[e].length).toBeGreaterThan(10);
    expect(RESULT_ERROR_MESSAGES.bad_format).toBe("We couldn't read this code. Copy the whole code, starting with SV1-.");
    for (const m of Object.values(RESULT_ERROR_MESSAGES)) expect(m).not.toMatch(/doesn't read/);
  });
});

describe("pasted link followed by sentence punctuation", () => {
  it("decodes a /result/ link ending in . or )", async () => {
    const { createSecrets } = await import("./tokens");
    const { encodeResultCode, decodeResultCode } = await import("./resultcode");
    const { seededRandom } = await import("./testutil");
    const s = createSecrets(seededRandom(77));
    const code = encodeResultCode(s, "m1", ["right", "right", "wrong", "pass", "rewrite"], ["1", "2"]);
    for (const tail of [".", ")", ").", "!"]) {
      const r = decodeResultCode(`(see http://localhost:3000/result/${code}${tail}`, s);
      expect(r.ok, tail).toBe(true);
    }
  });
});

describe("technique credit", () => {
  it("only techniques of passed practical tasks are credited", async () => {
    const { createSecrets } = await import("./tokens");
    const { encodeResultCode, decodeResultCode } = await import("./resultcode");
    const { getTest } = await import("./content");
    const { seededRandom } = await import("./testutil");
    const s = createSecrets(seededRandom(78));
    const t = getTest("m1")!;
    const all = ["1", "2", "3"] as const;
    const bothFail = decodeResultCode(encodeResultCode(s, "m1", ["right", "right", "right", "fail", "fail"], [...all]), s);
    expect(bothFail.ok && bothFail.result.techniques).toEqual([]);
    const only4 = decodeResultCode(encodeResultCode(s, "m1", ["right", "right", "right", "pass", "fail"], [...all]), s);
    expect(only4.ok && only4.result.techniques).toEqual([...t.practical[0].techniques].sort());
  });
});
