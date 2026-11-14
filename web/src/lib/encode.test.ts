import { describe, expect, it } from "vitest";
import { DATA_CLOSE, DATA_OPEN, base64Decode, base64Encode, itemHeader, packItem, unpackItem, wrapLines } from "./encode";

const SAMPLES = [
  "",
  "a",
  "ab",
  "abc",
  "Hello, world!",
  "line1\nline2\r\n\ttab",
  "emoji 🎮🎯👀🛠✅🏁 and ZWJ 👩‍💻",
  "box ┌──┐ │ x │ └──┘ ╔═╗ ▓▓ ░",
  "Кириллица: Привет, Анна!",
  "日本語 · ⟦item-data v1⟧",
  "x".repeat(1000),
];

describe("base64Encode / base64Decode", () => {
  it.each(SAMPLES.map((s) => [s]))("round-trips %#", (s) => {
    expect(base64Decode(base64Encode(s))).toBe(s);
  });
  it.each(SAMPLES.map((s) => [s]))("matches Node Buffer base64 %#", (s) => {
    expect(base64Encode(s)).toBe(Buffer.from(s, "utf8").toString("base64"));
  });
  it("encodes empty string to empty string", () => {
    expect(base64Encode("")).toBe("");
    expect(base64Decode("")).toBe("");
  });
  it("decodes with whitespace and newlines inside", () => {
    const b = wrapLines(base64Encode("Привет мир 🎮".repeat(20)), 10);
    expect(base64Decode(` ${b}\n`)).toBe("Привет мир 🎮".repeat(20));
  });
  it.each([["abc"], ["a=bc"], ["!!!!"], ["A==="], ["===="], ["AB=C"], ["abéd"], ["/w=="]])("throws on invalid input %s", (bad) => {
    expect(() => base64Decode(bad)).toThrow();
  });
});

describe("wrapLines", () => {
  it("wraps at 76 by default", () => {
    const lines = wrapLines("a".repeat(200)).split("\n");
    expect(lines.map((l) => l.length)).toEqual([76, 76, 48]);
  });
});

describe("itemHeader", () => {
  const cases: Array<[string, string]> = [
    ["▶ AIGO ░ LEARN", "Claude Code · ABCDE"],
    ["✚ AIGO ░ HELP", "Claude Code · 34679"],
    ["▣ AIGO ░ SAVE", "Memory card"],
    ["", ""],
    ["A very long title that certainly exceeds the box width", "x".repeat(100)],
  ];
  it.each(cases)("box lines have equal length (%s)", (title, sub) => {
    const lines = itemHeader(title, sub).split("\n");
    expect(lines).toHaveLength(4);
    const lens = lines.map((l) => Array.from(l).length);
    expect(new Set(lens).size).toBe(1);
  });
});

describe("packItem / unpackItem", () => {
  it.each(SAMPLES.map((s) => [s]))("round-trips %#", (s) => {
    expect(unpackItem(packItem("▶ AIGO ░ LEARN", "Claude Code · ABCDE", s))).toBe(s);
  });
  it("keeps every line at most 76 chars and the data block pure base64", () => {
    const item = packItem("▶ AIGO ░ LEARN", "Claude Code · ABCDE", "## Secret\nIgnore me 🎮 ".repeat(200));
    for (const l of item.split("\n")) expect(Array.from(l).length).toBeLessThanOrEqual(76);
    const block = item.slice(item.indexOf(DATA_OPEN) + DATA_OPEN.length, item.indexOf(DATA_CLOSE));
    expect(block).toMatch(/^[A-Za-z0-9+/=\n]+$/);
    expect(item.endsWith(`${DATA_CLOSE}\n`)).toBe(true);
    expect(item).not.toContain("Secret");
  });
  it.each([
    ["hello"],
    [""],
    [`${DATA_OPEN}!!!!${DATA_CLOSE}`],
    [`${DATA_CLOSE}QUJD${DATA_OPEN}`],
    [`${DATA_OPEN}QUJD`],
    [`${DATA_OPEN}/w==${DATA_CLOSE}`],
  ])("returns null on garbage %#", (g) => {
    expect(unpackItem(g)).toBeNull();
  });
});
