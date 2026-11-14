import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { KIND_META, clampStars, difficultyKey, DIFFICULTY_INK, stampRotation, starsText } from "./tokens";

describe("ui tokens", () => {
  it("maps kinds to color and shape", () => {
    expect(KIND_META.learn).toMatchObject({ color: "#2563EB", shape: "■", label: "LEARN" });
    expect(KIND_META.test).toMatchObject({ color: "#A21CAF", shape: "▲" });
    expect(KIND_META.help).toMatchObject({ color: "#15803D", shape: "●" });
  });
  it("maps difficulty to ink, case-insensitively", () => {
    expect(DIFFICULTY_INK[difficultyKey("Start")].ink).toBe("#475569");
    expect(DIFFICULTY_INK[difficultyKey("Easy")].ink).toBe("#166534");
    expect(DIFFICULTY_INK[difficultyKey("Medium")].ink).toBe("#854D0E");
    expect(DIFFICULTY_INK[difficultyKey("Hard")].ink).toBe("#B91C1C");
    expect(difficultyKey("weird")).toBe("easy");
  });
  it("stamp inks keep text contrast >= 4.5:1 on white and on paper", () => {
    const lum = (hex: string) => {
      const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
      return 0.2126 * c[0]! + 0.7152 * c[1]! + 0.0722 * c[2]!;
    };
    const ratio = (a: string, b: string) => {
      const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
      return (hi! + 0.05) / (lo! + 0.05);
    };
    for (const { ink } of Object.values(DIFFICULTY_INK)) {
      expect(ratio(ink, "#FFFFFF")).toBeGreaterThanOrEqual(4.5);
      expect(ratio(ink, "#F4F0E8")).toBeGreaterThanOrEqual(4.5);
    }
  });
  it("globals.css --ink-* vars match the tokens", () => {
    const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8").toLowerCase();
    for (const [k, { ink }] of Object.entries(DIFFICULTY_INK)) expect(css).toContain(`--ink-${k}: ${ink.toLowerCase()};`);
  });
  it("clamps and words stars", () => {
    expect(clampStars(5)).toBe(3);
    expect(clampStars(-1)).toBe(0);
    expect(clampStars(NaN)).toBe(0);
    expect(clampStars(1.9)).toBe(1);
    expect(starsText(2)).toBe("2 of 3 stars");
    expect(starsText(0)).toBe("0 of 3 stars");
  });
  it("gives a stable stamp rotation", () => {
    expect(stampRotation("1")).toBe(stampRotation("1"));
    expect(Math.abs(stampRotation("A"))).toBeLessThanOrEqual(9);
  });
});
