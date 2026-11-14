/**
 * Per-player secret token tables for TEST result codes.
 *
 * A result code is `SV1-<playerId>-<token>-<token>-…`. Claude never computes
 * anything: it copies tokens from the table hidden inside the TEST item, and
 * the site maps them back. Tokens are random, unique within a player, and use
 * an alphabet without look-alike characters.
 */
import type { ModuleId, ModuleTestTokens, PlayerSecrets, PracticalOutcome, Rank, TechniqueCode, TokenTable } from "./types";

/** No 0/O, 1/I/L, 2/Z, 5/S, 8/B — nothing a human or a model can confuse. */
export const ALPHABET = "34679ACDEFGHJKMNPQRTUVWXY";
export const TOKEN_LEN = 3;
export const PLAYER_ID_LEN = 5;

export const MODULE_IDS: readonly ModuleId[] = ["m1", "m2", "m3", "m4", "m5", "m6", "m7", "m8"];
export const TECHNIQUE_CODES: readonly TechniqueCode[] = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "A", "B", "C"];
export const PRACTICAL_OUTCOMES: readonly PracticalOutcome[] = ["pass", "rewrite", "fail"];
export const RANKS: readonly Rank[] = ["none", "bronze", "silver", "gold"];

/** Random source returning `n` uniform bytes. Injected so tests can be deterministic. */
export type RandomBytes = (n: number) => Uint8Array;

export const cryptoRandomBytes: RandomBytes = (n) => {
  const buf = new Uint8Array(n);
  globalThis.crypto.getRandomValues(buf);
  return buf;
};

/** Uniform random string over ALPHABET using rejection sampling (no modulo bias). */
export function randomString(len: number, rand: RandomBytes): string {
  const limit = 256 - (256 % ALPHABET.length);
  let out = "";
  while (out.length < len) {
    for (const b of rand(len * 2)) {
      if (b < limit) out += ALPHABET[b % ALPHABET.length];
      if (out.length === len) break;
    }
  }
  return out;
}

function uniqueToken(used: Set<string>, rand: RandomBytes): string {
  for (let i = 0; i < 10_000; i++) {
    const t = randomString(TOKEN_LEN, rand);
    if (!used.has(t)) {
      used.add(t);
      return t;
    }
  }
  throw new Error("token space exhausted");
}

function moduleTokens(used: Set<string>, rand: RandomBytes): ModuleTestTokens {
  const t = () => uniqueToken(used, rand);
  const outcome = (): Record<PracticalOutcome, string> => ({ pass: t(), rewrite: t(), fail: t() });
  return {
    test: t(),
    questions: [
      [t(), t()],
      [t(), t()],
      [t(), t()],
    ],
    practical: [outcome(), outcome()],
    bucket: { none: t(), bronze: t(), silver: t(), gold: t() },
  };
}

/** Fresh player: id + a token table for every module's TEST and every technique. */
export function createSecrets(rand: RandomBytes = cryptoRandomBytes): PlayerSecrets {
  const used = new Set<string>();
  const modules = {} as Record<ModuleId, ModuleTestTokens>;
  for (const id of MODULE_IDS) modules[id] = moduleTokens(used, rand);
  const tech = {} as Record<TechniqueCode, string>;
  for (const c of TECHNIQUE_CODES) tech[c] = uniqueToken(used, rand);
  const tokens: TokenTable = { modules, tech };
  return { playerId: randomString(PLAYER_ID_LEN, rand), tokens };
}

/** Every token of a module's table, in a fixed order (tests, validation). */
export function moduleTokenList(m: ModuleTestTokens): string[] {
  return [
    m.test,
    ...m.questions.flat(),
    ...m.practical.flatMap((p) => PRACTICAL_OUTCOMES.map((o) => p[o])),
    ...RANKS.map((r) => m.bucket[r]),
  ];
}

export function allTokens(s: PlayerSecrets): string[] {
  return [...MODULE_IDS.flatMap((id) => moduleTokenList(s.tokens.modules[id])), ...TECHNIQUE_CODES.map((c) => s.tokens.tech[c])];
}
