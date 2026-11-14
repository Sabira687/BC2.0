import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(join(__dirname, "console.module.css"), "utf8");

function lum(hex: string): number {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0]! + 0.7152 * c[1]! + 0.0722 * c[2]!;
}
function ratio(a: string, b: string): number {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
}
function colorOf(selector: string): string {
  const m = css.match(new RegExp(`${selector.replace(/[.:]/g, "\\$&")}\\s*\\{[^}]*?color:\\s*(#[0-9a-fA-F]{6})`));
  if (!m) throw new Error(`no colour for ${selector}`);
  return m[1]!;
}

describe("terminal tokens keep their contrast on the dark panel", () => {
  it("meaningful glyphs (empty stars/bar cells) reach 3:1", () => {
    expect(ratio(colorOf(".t_starOff"), "#0b1020")).toBeGreaterThanOrEqual(3);
    expect(ratio(colorOf(".t_barOff"), "#0b1020")).toBeGreaterThanOrEqual(3);
  });
  it("placeholder text reaches 4.5:1 on the composer field", () => {
    expect(ratio(colorOf(".textareaWrap textarea::placeholder"), "#0e1528")).toBeGreaterThanOrEqual(4.5);
  });
});
