import { describe, expect, it } from "vitest";
import { pastedCard, activeCard, activeCardView, activeChip, helpUsedSeen, parseActivation, splitMarkers } from "./markers";
import { createInitialState, createItem } from "./progress";
import { generateHelp, generateLearn, generateTest } from "./generator";
import { seededRandom } from "./testutil";
import { TECHNIQUES } from "./content/techniques";
import type { ChatMessage } from "./chat";

const user = (content: string): ChatMessage => ({ role: "user", content });
const reply = (content: string): ChatMessage => ({ role: "assistant", content });
const T1 = TECHNIQUES[0]!.name;

describe("splitMarkers: TEST COMPLETE result box", () => {
  const BOX = [
    "```",
    " ╔══════════════════════════════════════╗",
    " ║  TEST COMPLETE ▓▓▓▓▓▓▓▓▓▓▓▓  90/100  ║",
    " ║  STARS: ★★★                          ║",
    " ╚══════════════════════════════════════╝",
    "```",
    "TEST COMPLETE · ★★★ · 90/100",
    "RESULT CODE: AIGO-X",
  ].join("\n");
  it("keeps the fenced box as one text block and makes one test event from the summary line", () => {
    const segs = splitMarkers(BOX);
    expect(segs.filter((s) => s.type === "event")).toEqual([{ type: "event", kind: "test", text: "TEST COMPLETE · ★★★ · 90/100" }]);
    expect(segs[0]).toMatchObject({ type: "text" });
    expect((segs[0] as { text: string }).text).toContain("║  TEST COMPLETE ▓▓▓▓▓▓▓▓▓▓▓▓  90/100  ║");
  });
  it("does not treat a bare box line without a separator as an event", () => {
    expect(splitMarkers("TEST COMPLETE ▓▓▓▓ 90/100").every((s) => s.type === "text")).toBe(true);
  });
  it("ignores marker lines inside code fences", () => {
    expect(splitMarkers("```\nSTAMP EARNED · " + T1 + "\n```").every((s) => s.type === "text")).toBe(true);
  });
});

describe("splitMarkers", () => {
  it("returns one text segment for plain text, nothing for empty", () => {
    expect(splitMarkers("Hello\nthere")).toEqual([{ type: "text", text: "Hello\nthere" }]);
    expect(splitMarkers("")).toEqual([]);
  });
  it("turns Claude's marker lines into events and keeps the text around them", () => {
    const text = `▶ ITEM ACTIVATED · LEARN · Three-Tooth Key\nHi John!\n\n✅ CHECK PASSED · ★★☆\nSTAMP EARNED · ${T1}\nNext lesson?`;
    expect(splitMarkers(text)).toEqual([
      { type: "event", kind: "activated", text: "ITEM ACTIVATED · LEARN · Three-Tooth Key" },
      { type: "text", text: "Hi John!" },
      { type: "event", kind: "pass", text: "CHECK PASSED · ★★☆" },
      { type: "event", kind: "stamp", text: `STAMP EARNED · ${T1}` },
      { type: "text", text: "Next lesson?" },
    ]);
  });
  it("colors the activation by card kind", () => {
    expect(splitMarkers("▶ ITEM ACTIVATED · TEST · Foo")[0]).toMatchObject({ kind: "test" });
    expect(splitMarkers("▶ ITEM ACTIVATED · HELP · Pocket Compass")[0]).toMatchObject({ kind: "help", text: "ITEM ACTIVATED · HELP · Pocket Compass" });
  });
  it("recognises HELP USED and TEST COMPLETE", () => {
    expect(splitMarkers("tip\nHELP USED")).toEqual([
      { type: "text", text: "tip" },
      { type: "event", kind: "help", text: "HELP USED" },
    ]);
    expect(splitMarkers("TEST COMPLETE · ★★☆ · 85/100")).toEqual([{ type: "event", kind: "test", text: "TEST COMPLETE · ★★☆ · 85/100" }]);
  });
  it("tolerates markdown wrapping like capture does", () => {
    const out = splitMarkers("> **▶ ITEM ACTIVATED · HELP**\n- `✅ CHECK PASSED · ★☆☆`\n**HELP USED**");
    expect(out.map((s) => (s.type === "event" ? s.kind : "text"))).toEqual(["help", "pass", "help"]);
  });
  it("leaves prose that merely mentions a marker as text", () => {
    for (const t of ["The help used here was great", "I will print STAMP EARNED only when you show it", "STAMP EARNED · Brief formulaic nonsense", "Check passed! Nice."]) {
      expect(splitMarkers(t), t).toEqual([{ type: "text", text: t }]);
    }
    expect(splitMarkers(`x ${"a".repeat(500)}\nHELP USED`)[1]).toMatchObject({ type: "event" });
  });
  it("ignores very long lines and never throws", () => {
    const long = `HELP USED ${"x".repeat(500)}`;
    expect(splitMarkers(long)).toEqual([{ type: "text", text: long }]);
    expect(() => splitMarkers(undefined as unknown as string)).not.toThrow();
  });
});

describe("parseActivation", () => {
  it("reads kind and title, the last activation wins", () => {
    expect(parseActivation("▶ ITEM ACTIVATED · LEARN · Three-Tooth Key\nHi")).toEqual({ kind: "learn", title: "Three-Tooth Key" });
    expect(parseActivation("▶ ITEM ACTIVATED · LEARN · A\n▶ ITEM ACTIVATED · TEST · B")).toEqual({ kind: "test", title: "B" });
  });
  it("captures the HELP card title (new activation line) and accepts the old bare line", () => {
    expect(parseActivation("▶ ITEM ACTIVATED · HELP · Pocket Compass")).toEqual({ kind: "help", title: "Pocket Compass" });
    expect(parseActivation("> **▶ ITEM ACTIVATED · HELP**")).toEqual({ kind: "help", title: null });
  });
  it("is null without an activation", () => {
    expect(parseActivation("Hello")).toBeNull();
  });
});

describe("activeCard / activeCardView / activeChip", () => {
  const state = createItem(createItem(createInitialState(seededRandom(2)), "learn:m1"), "test:m1");
  const ctx = { profile: state.profile, secrets: state.secrets, appUrl: "http://localhost:3000" };
  const learn = user(generateLearn(ctx, "m1").text);
  const help = user(generateHelp(state).text);
  const test = user(generateTest(ctx, "m1").text);

  it("is null before anything is loaded", () => {
    expect(activeCard([])).toBeNull();
    expect(activeCard([user("hi"), reply("hello")])).toBeNull();
  });
  it("uses the pasted item header while Claude has not answered", () => {
    expect(activeCard([learn])).toMatchObject({ kind: "learn", module: "m1", title: null });
    expect(activeCard([test])).toMatchObject({ kind: "test", module: "m1" });
    expect(activeCard([help])).toMatchObject({ kind: "help" });
  });
  it("prefers Claude's activation line (title, module by title)", () => {
    const c = activeCard([learn, reply("▶ ITEM ACTIVATED · LEARN · Three-Tooth Key\nHi")]);
    expect(c).toMatchObject({ kind: "learn", title: "Three-Tooth Key", module: "m1", at: 1 });
  });
  it("the latest item wins", () => {
    expect(activeCard([learn, reply("▶ ITEM ACTIVATED · LEARN · Three-Tooth Key"), help])).toMatchObject({ kind: "help" });
  });
  it("builds the mini-card view with live stars", () => {
    const msgs = [learn, reply("▶ ITEM ACTIVATED · LEARN · Three-Tooth Key")];
    const v = activeCardView(state, msgs);
    expect(v).toMatchObject({ kind: "learn", module: "m1", title: "Three-Tooth Key", stars: 0, active: true });
    expect(v.setLabel).toMatch(/^S01 · \d\/3$/);
    const s2 = { ...state, learnStars: { m1: 2 as const } };
    expect(activeCardView(s2, msgs).stars).toBe(2);
  });
  it("defaults to the start LEARN card when nothing is active, HELP has no stars", () => {
    const v = activeCardView(state, []);
    expect(v).toMatchObject({ kind: "learn", module: "m1", active: false, title: "Three-Tooth Key", overline: "THE CLEAR ASK", rarity: "common", art: true });
    const h = activeCardView(state, [help, reply("▶ ITEM ACTIVATED · HELP · Pocket Compass")]);
    expect(h).toMatchObject({ kind: "help", title: "Pocket Compass", active: true });
    expect(h.stars).toBeUndefined();
  });
  it("still recognises the older set-title activation line and a TEST item line", () => {
    expect(activeCard([learn, reply("▶ ITEM ACTIVATED · LEARN · The Clear Ask")])).toMatchObject({ kind: "learn", module: "m1" });
    expect(activeCard([test, reply("▶ ITEM ACTIVATED · TEST · Proving Lock")])).toMatchObject({ kind: "test", module: "m1", title: "Proving Lock" });
    expect(parseActivation("▶ ITEM ACTIVATED · HELP · One Better Move")).toEqual({ kind: "help", title: "One Better Move" });
  });
  it("chip text", () => {
    expect(activeChip("learn", "Three-Tooth Key")).toBe("■ LEARN · Three-Tooth Key is active");
    expect(activeChip("test", "X")).toBe("▲ TEST · X is active");
    expect(activeChip("help", "Pocket Compass")).toBe("● HELP · Pocket Compass is active");
  });
});

describe("helpUsedSeen", () => {
  it("is true only after Claude printed HELP USED", () => {
    expect(helpUsedSeen([])).toBe(false);
    expect(helpUsedSeen([reply("The help used here")])).toBe(false);
    expect(helpUsedSeen([user("x"), reply("tip\nHELP USED")])).toBe(true);
  });
});

describe("pastedCard", () => {
  it("names a pasted card by its header", () => {
    const state = createItem(createInitialState(seededRandom(2)), "learn:m1");
    const ctx = { profile: state.profile, secrets: state.secrets, appUrl: "http://localhost:3000" };
    expect(pastedCard(generateLearn(ctx, "m1").text)).toEqual({ kind: "learn", title: "Three-Tooth Key" });
    expect(pastedCard(generateHelp(state).text)).toEqual({ kind: "help", title: "Pocket Compass" });
    expect(pastedCard("hello")).toBeNull();
  });
});

describe("splitMarkers: framed / prefixed markers (Claude put them inside a frame by mistake)", () => {
  it("recognises markers prefixed with the frame bar", () => {
    const kinds = (t: string) => splitMarkers(t).filter((s) => s.type === "event").map((s) => (s as { kind: string }).kind);
    expect(kinds("│ ✅ CHECK PASSED · ★★☆")).toEqual(["pass"]);
    expect(kinds("│ ✦ STAMP EARNED · " + T1)).toEqual(["stamp"]);
    expect(kinds("│ ▶ ITEM ACTIVATED · LEARN · X")).toEqual(["activated"]);
    expect(kinds("│ HELP USED")).toEqual(["help"]);
    expect(kinds("│ TEST COMPLETE · ★★★ · 90/100")).toEqual(["test"]);
  });
  it("frame header and bottom lines are plain text, not events", () => {
    const segs = splitMarkers("┌─ TEST COMPLETE ───────\n│ task 1  ✓  10\n└───────");
    expect(segs.every((s) => s.type === "text")).toBe(true);
  });
});

describe("splitMarkers: v5 terminal replies", () => {
  const kinds = (t: string) => splitMarkers(t).filter((s) => s.type === "event").map((s) => (s as { kind: string }).kind);
  it("HELP USED with a suffix is still the help marker", () => {
    expect(kinds("HELP USED · back to normal chat")).toEqual(["help"]);
    expect(helpUsedSeen([reply("┌─ TRY THIS ───\n│ x\n└───\nHELP USED · back to normal chat")])).toBe(true);
  });
  it("the TEST COMPLETE frame title and SCORE line are not markers; only the stars/score line is", () => {
    const t = ["━━━━━━", " TEST COMPLETE · PROVING LOCK", "━━━━━━", " 1  Task      ✓ 10/10", "────", " SCORE  90/100       ★★★", "━━━━━━", "TEST COMPLETE · ★★★ · 90/100", "RESULT CODE: SV1-X"].join("\n");
    const ev = splitMarkers(t).filter((s) => s.type === "event");
    expect(ev).toEqual([{ type: "event", kind: "test", text: "TEST COMPLETE · ★★★ · 90/100" }]);
    expect(kinds(" TEST COMPLETE · PROVING LOCK")).toEqual([]);
    expect(kinds(" SCORE  90/100                     ★★★")).toEqual([]);
  });
});
