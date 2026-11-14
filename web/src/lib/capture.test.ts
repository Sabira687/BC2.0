import { describe, expect, it } from "vitest";
import { applyCaptured, captureFromAssistant, gainOf, techniqueByName } from "./capture";
import { createInitialState } from "./progress";
import { seededRandom } from "./testutil";
import type { Status } from "./console";

const learn: Status = { kind: "learn", playerId: "ABCDE", lesson: "m1.2", module: "m1", step: 7 };
const test: Status = { kind: "test", playerId: "ABCDE", module: "m1", task: 5, score: 90 };
const T1 = "Brief formula: context + goal + format";

describe("captureFromAssistant", () => {
  it("activation lines with item names are recognised by their prefix", () => {
    expect(captureFromAssistant("▶ ITEM ACTIVATED · LEARN · Three-Tooth Key", null).activated).toBe("learn");
    expect(captureFromAssistant("▶ ITEM ACTIVATED · TEST · Proving Lock", null).activated).toBe("test");
    const h = captureFromAssistant("▶ ITEM ACTIVATED · HELP · Pocket Compass\ntip\nHELP USED", null);
    expect(h).toMatchObject({ activated: "help", helpUsed: true });
  });

  it("reads exact markers", () => {
    const text = `▶ ITEM ACTIVATED · LEARN · Three-Tooth Key\nHello\n✅ CHECK PASSED · ★★☆\nSTAMP EARNED · ${T1}\n`;
    expect(captureFromAssistant(text, learn)).toEqual({ activated: "learn", learnStars: { module: "m1", stars: 2 }, stamps: ["1"], helpUsed: false });
  });
  it("accepts the ⭐ variant", () => {
    expect(captureFromAssistant("✅ CHECK PASSED · ⭐⭐⭐", learn).learnStars).toEqual({ module: "m1", stars: 3 });
    expect(captureFromAssistant("✅ CHECK PASSED · ⭐", learn).learnStars?.stars).toBe(1);
  });
  it("tolerates spacing, case, separators and a missing ▶/✅", () => {
    const c = captureFromAssistant(`item   activated  -  test  -  Foo\ncheck passed | ★★☆\nstamp earned • role`, learn);
    expect(c.activated).toBe("test");
    expect(c.learnStars?.stars).toBe(2);
    expect(c.stamps).toEqual(["7"]);
  });
  it("tolerates markdown wrapping", () => {
    const text = `> **▶ ITEM ACTIVATED · HELP**\n- \`✅ CHECK PASSED · ★☆☆\`\n## **STAMP EARNED · Explicit output format.**\n**HELP USED**`;
    const c = captureFromAssistant(text, learn);
    expect(c.activated).toBe("help");
    expect(c.helpUsed).toBe(true);
    expect(c.learnStars?.stars).toBe(1);
    expect(c.stamps).toEqual(["2"]);
  });
  it("matches the part before the colon and technique with a hyphen", () => {
    expect(captureFromAssistant("STAMP EARNED · Brief formula", null).stamps).toEqual(["1"]);
    expect(captureFromAssistant("STAMP EARNED · Fact-checking and sources", null).stamps).toEqual(["9"]);
  });
  it("ignores unknown techniques and unknown text", () => {
    expect(captureFromAssistant("STAMP EARNED · Telepathy\nrandom text", null)).toEqual({ stamps: [], helpUsed: false });
  });
  it("dedupes stamps and orders them by technique code", () => {
    const text = "STAMP EARNED · Role\nSTAMP EARNED · Explicit output format\nSTAMP EARNED · Role";
    expect(captureFromAssistant(text, null).stamps).toEqual(["2", "7"]);
  });
  it("takes the max stars when several CHECK PASSED lines appear and clamps", () => {
    expect(captureFromAssistant("✅ CHECK PASSED · ★☆☆\n✅ CHECK PASSED · ★★★\n✅ CHECK PASSED · ★★☆", learn).learnStars?.stars).toBe(3);
    expect(captureFromAssistant("CHECK PASSED ★★★★★", learn).learnStars?.stars).toBe(3);
  });
  it("ignores CHECK PASSED without a LEARN status", () => {
    expect(captureFromAssistant("✅ CHECK PASSED · ★★☆", null).learnStars).toBeUndefined();
    expect(captureFromAssistant("✅ CHECK PASSED · ★★☆", test).learnStars).toBeUndefined();
  });
  it("matches stamp names with a head only, parentheses, dashes, trailing emoji", () => {
    for (const line of [
      "STAMP EARNED · Brief formula (context + goal + format)",
      "STAMP EARNED · Brief formula: context + goal + format ✅",
      "STAMP EARNED · Brief formula — context + goal + format",
      "STAMP EARNED · Brief formula 🎉",
      "STAMP EARNED · Brief formula",
    ]) expect(captureFromAssistant(line, null).stamps, line).toEqual(["1"]);
    expect(captureFromAssistant("STAMP EARNED · Brief formulaic nonsense", null).stamps).toEqual([]);
  });
  it("a check without stars records no learnStars", () => {
    expect(captureFromAssistant("✅ Check passed! Nice work.", learn).learnStars).toBeUndefined();
    expect(captureFromAssistant("✅ CHECK PASSED · ☆☆☆", learn).learnStars).toBeUndefined();
  });
  it("HELP marker without a status sets helpUsed", () => {
    expect(captureFromAssistant("HELP USED", null).helpUsed).toBe(true);
    const c = captureFromAssistant("▶ ITEM ACTIVATED · HELP", null);
    expect(c.helpUsed).toBe(true);
    expect(c.activated).toBe("help");
  });
  it("recognises the HELP activation line that names the card", () => {
    const c = captureFromAssistant("▶ ITEM ACTIVATED · HELP · Pocket Compass\ntip\nHELP USED", null);
    expect(c).toEqual({ activated: "help", stamps: [], helpUsed: true });
  });
  it("does not treat prose mentioning help as a marker", () => {
    expect(captureFromAssistant("The help used here was great", null).helpUsed).toBe(false);
  });
  it("ignores the decorative TEST COMPLETE line", () => {
    expect(captureFromAssistant("TEST COMPLETE ▓▓▓▓ 90/100", test)).toEqual({ stamps: [], helpUsed: false });
  });
  it("never throws on odd input", () => {
    expect(captureFromAssistant("", null)).toEqual({ stamps: [], helpUsed: false });
    expect(() => captureFromAssistant("★".repeat(100000) + "\n" + "x ".repeat(100000), learn)).not.toThrow();
  });
});

describe("technique name aliases", () => {
  it("matches a short stamp name to its technique", () => {
    expect(captureFromAssistant("STAMP EARNED · Explicit format", null).stamps).toEqual(["2"]);
    expect(captureFromAssistant("✦ STAMP EARNED · Explicit format ✅", null).stamps).toEqual(["2"]);
    expect(techniqueByName("Explicit output format")).toBe("2");
    expect(techniqueByName("Explicit format")).toBe("2");
  });
});

describe("captureFromAssistant: markers inside a frame", () => {
  it("reads markers prefixed with the frame bar or ✦", () => {
    const text = `┌─ CHECK ───\n│ [✓] format · ok\n│ ✅ CHECK PASSED · ★★☆\n│ ✦ STAMP EARNED · ${T1}\n└───\n│ ▶ ITEM ACTIVATED · LEARN · Three-Tooth Key\n│ HELP USED`;
    expect(captureFromAssistant(text, learn)).toEqual({ activated: "learn", learnStars: { module: "m1", stars: 2 }, stamps: ["1"], helpUsed: true });
  });
  it("frame lines and the step bar are not markers", () => {
    expect(captureFromAssistant("━━━━━━\nm1.1 Title · step 4/7 ████░░░\n━━━━━━\n┌─ YOUR TURN ───\n└───", learn)).toEqual({ stamps: [], helpUsed: false });
  });
});

describe("captureFromAssistant: v5 help line", () => {
  it("HELP USED · back to normal chat counts as help used", () => {
    expect(captureFromAssistant("┌─ TRY THIS ───\n│ x\n└───\nHELP USED · back to normal chat", null).helpUsed).toBe(true);
  });
});

describe("applyCaptured", () => {
  const s0 = createInitialState(seededRandom(3));
  it("applies stars, stamps and help, then is idempotent (same reference)", () => {
    const c = captureFromAssistant(`✅ CHECK PASSED · ★★☆\nSTAMP EARNED · ${T1}\nHELP USED`, learn);
    const s1 = applyCaptured(s0, c);
    expect(s1.learnStars.m1).toBe(2);
    expect(s1.stamps).toContain("1");
    expect(s1.stamps).toContain("player_one");
    expect(s1.helpUsed).toBe(true);
    expect(s1.created).toContain("help");
    expect(applyCaptured(s1, c)).toBe(s1);
  });
  it("never lowers stars", () => {
    const hi = applyCaptured(s0, captureFromAssistant("CHECK PASSED ★★★", learn));
    const lo = applyCaptured(hi, captureFromAssistant("CHECK PASSED ★☆☆", learn));
    expect(lo).toBe(hi);
    expect(lo.learnStars.m1).toBe(3);
  });
  it("returns the same state for an empty capture", () => {
    expect(applyCaptured(s0, { stamps: [], helpUsed: false })).toBe(s0);
  });
});

describe("gainOf", () => {
  const s0 = createInitialState(seededRandom(3));
  it("reports only what is new compared with the state before", () => {
    const c = captureFromAssistant(`▶ ITEM ACTIVATED · LEARN · X\n✅ CHECK PASSED · ★★☆\nSTAMP EARNED · ${T1}\nHELP USED`, learn);
    const s1 = applyCaptured(s0, c);
    const g1 = gainOf(s0, s1, c);
    expect(g1).toEqual({ activated: "learn", learnStars: { module: "m1", stars: 2 }, stamps: ["1"], helpUsed: true });
    const s2 = applyCaptured(s1, c);
    expect(gainOf(s1, s2, c)).toEqual({ activated: "learn", stamps: [], helpUsed: false });
  });
});
