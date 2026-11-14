import { describe, expect, it } from "vitest";
import {
  ALPHABET,
  MODULE_IDS,
  PLAYER_ID_LEN,
  PRACTICAL_OUTCOMES,
  RANKS,
  TECHNIQUE_CODES,
  TOKEN_LEN,
  allTokens,
  createSecrets,
  cryptoRandomBytes,
  moduleTokenList,
  randomString,
  type RandomBytes,
} from "./tokens";
import type { PlayerSecrets } from "./types";
import { seededRandom } from "./testutil";

const TOKEN_RE = new RegExp(`^[${ALPHABET}]{${TOKEN_LEN}}$`);
const PLAYER_RE = new RegExp(`^[${ALPHABET}]{${PLAYER_ID_LEN}}$`);
const PER_MODULE = 1 + 3 * 2 + 2 * 3 + 4; // test + questions + practical + buckets = 17

/** Collects every token straight from the table shape (independent of allTokens). */
function tableTokens(s: PlayerSecrets): string[] {
  const out: string[] = [];
  for (const id of MODULE_IDS) {
    const m = s.tokens.modules[id];
    out.push(m.test);
    for (const [r, w] of m.questions) out.push(r, w);
    for (const p of m.practical) out.push(p.pass, p.rewrite, p.fail);
    out.push(m.bucket.none, m.bucket.bronze, m.bucket.silver, m.bucket.gold);
  }
  for (const c of TECHNIQUE_CODES) out.push(s.tokens.tech[c]);
  return out;
}

function checkSecrets(s: PlayerSecrets) {
  expect(s.playerId).toHaveLength(5);
  expect(s.playerId).toMatch(PLAYER_RE);
  expect(Object.keys(s.tokens.modules).sort()).toEqual([...MODULE_IDS].sort());
  for (const id of MODULE_IDS) {
    const m = s.tokens.modules[id];
    expect(m.questions).toHaveLength(3);
    for (const q of m.questions) expect(q).toHaveLength(2);
    expect(m.practical).toHaveLength(2);
    for (const p of m.practical) expect(Object.keys(p).sort()).toEqual([...PRACTICAL_OUTCOMES].sort());
    expect(Object.keys(m.bucket).sort()).toEqual([...RANKS].sort());
    expect(moduleTokenList(m)).toHaveLength(PER_MODULE);
  }
  expect(Object.keys(s.tokens.tech).sort()).toEqual([...TECHNIQUE_CODES].sort());
  const toks = tableTokens(s);
  expect(toks).toHaveLength(8 * 17 + 12);
  expect(new Set(toks).size).toBe(toks.length);
  for (const t of toks) {
    expect(t).toHaveLength(3);
    expect(t).toMatch(TOKEN_RE);
  }
}

describe("ALPHABET", () => {
  it("has no look-alike characters", () => {
    for (const c of "0O1IL2Z5S8B") expect(ALPHABET).not.toContain(c);
  });
  it("has no duplicate characters and is uppercase alphanumerics", () => {
    expect(new Set(ALPHABET).size).toBe(ALPHABET.length);
    expect(ALPHABET).toMatch(/^[A-Z0-9]+$/);
  });
  it("constants", () => {
    expect(TOKEN_LEN).toBe(3);
    expect(PLAYER_ID_LEN).toBe(5);
    expect(MODULE_IDS).toEqual(["m1", "m2", "m3", "m4", "m5", "m6", "m7", "m8"]);
    expect(TECHNIQUE_CODES).toHaveLength(12);
  });
});

describe("randomString", () => {
  it("returns the requested length using only ALPHABET", () => {
    const rand = seededRandom(7);
    for (const len of [0, 1, 3, 5, 17, 100]) {
      const s = randomString(len, rand);
      expect(s).toHaveLength(len);
      for (const c of s) expect(ALPHABET).toContain(c);
    }
  });
  it("uses every alphabet character over many draws", () => {
    expect(new Set(randomString(5000, seededRandom(3))).size).toBe(ALPHABET.length);
  });
  it("is deterministic for a given seed", () => {
    expect(randomString(20, seededRandom(42))).toBe(randomString(20, seededRandom(42)));
  });
  it("rejection sampling: bytes >= 250 are skipped and it still terminates", () => {
    const inner = seededRandom(9);
    let calls = 0;
    const rand: RandomBytes = (n) => {
      calls++;
      if (calls <= 5) return new Uint8Array(n).fill(250 + (calls % 6));
      return inner(n);
    };
    const s = randomString(8, rand);
    expect(s).toHaveLength(8);
    for (const c of s) expect(ALPHABET).toContain(c);
    expect(calls).toBeGreaterThan(5);
  });
  it("maps byte b < 250 to ALPHABET[b % 25]", () => {
    const rand: RandomBytes = (n) => Uint8Array.from({ length: n }, (_, i) => [255, 0, 24, 25, 249][i % 5]!);
    expect(randomString(4, rand)).toBe(ALPHABET[0]! + ALPHABET[24]! + ALPHABET[0]! + ALPHABET[24]!);
  });
});

describe("createSecrets", () => {
  it("builds a complete table of unique 3-char tokens (seeded)", () => {
    for (const seed of [1, 2, 3, 99, 12345]) checkSecrets(createSecrets(seededRandom(seed)));
  });
  it("works with the real crypto RNG", () => {
    checkSecrets(createSecrets());
    checkSecrets(createSecrets(cryptoRandomBytes));
  });
  it("is deterministic for a seed; different seeds give different players", () => {
    expect(createSecrets(seededRandom(4))).toEqual(createSecrets(seededRandom(4)));
    const a = createSecrets(seededRandom(1));
    const b = createSecrets(seededRandom(2));
    expect(a.playerId).not.toBe(b.playerId);
    expect(a.tokens).not.toEqual(b.tokens);
  });
  it("allTokens lists every table token exactly once: 8×17 + 12", () => {
    const s = createSecrets(seededRandom(5));
    const all = allTokens(s);
    expect(all).toHaveLength(8 * 17 + 12);
    expect(new Set(all).size).toBe(all.length);
    expect([...all].sort()).toEqual(tableTokens(s).sort());
  });
  it("moduleTokenList: test first, then questions, practical, buckets", () => {
    const m = createSecrets(seededRandom(6)).tokens.modules.m1;
    const list = moduleTokenList(m);
    expect(list[0]).toBe(m.test);
    expect(list.slice(1, 7)).toEqual(m.questions.flat());
    expect(list.slice(7, 10)).toEqual([m.practical[0].pass, m.practical[0].rewrite, m.practical[0].fail]);
    expect(list.slice(13)).toEqual([m.bucket.none, m.bucket.bronze, m.bucket.silver, m.bucket.gold]);
  });
});
