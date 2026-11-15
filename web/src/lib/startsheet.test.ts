import { describe, expect, it } from "vitest";
import { isNameEdited, inkGreeting, nameTag, allRequiredFilled, sheetNo } from "./startsheet";

describe("start sheet helpers", () => {
  it("name is a demo answer until it differs from John", () => {
    expect(isNameEdited("John")).toBe(false);
    expect(isNameEdited("  John ")).toBe(false);
    expect(isNameEdited("Anna")).toBe(true);
    expect(isNameEdited("")).toBe(true);
  });
  it("greeting uses the typed name and the style", () => {
    expect(inkGreeting("mentor", "Anna")).toMatch(/^Hi Anna!/);
    expect(inkGreeting("straight", "Anna")).toMatch(/^Anna\./);
  });
});

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { SHEET_COLORS as C, contrastRatio } from "./startsheet";

describe("start sheet contrast", () => {
  it("text colours are >= 4.5:1 on the sheet and the chosen sticker", () => {
    for (const fg of [C.pencil, C.off, C.inkBlue]) {
      expect(contrastRatio(fg, C.sheet)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(fg, C.chosenSticker)).toBeGreaterThanOrEqual(4.5);
    }
    expect(contrastRatio(C.stickerBorder, C.sheet)).toBeGreaterThanOrEqual(3);
  });
  it("CSS uses these values", () => {
    const css = readFileSync(join(process.cwd(), "src/components/StartForm.module.css"), "utf8").toLowerCase();
    for (const v of [C.pencil, C.off, C.inkBlue, C.stickerBorder]) expect(css).toContain(v);
  });
  it("name edit check ignores characters the sanitizer strips", () => {
    expect(isNameEdited("Jo<hn>")).toBe(isNameEdited("John"));
  });
});

describe("nameTag", () => {
  it("shows CHECK THE NAME in red for an invalid name, readable on the sheet", () => {
    expect(nameTag(null, true)).toEqual({ text: "CHECK THE NAME", tone: "error" });
    expect(nameTag("Anna", true)).toEqual({ text: "YOUR ANSWER ✓", tone: "ink" });
    expect(nameTag("John", false)).toEqual({ text: "DEMO · TYPE YOUR OWN", tone: "pencil" });
    expect(contrastRatio(C.error, C.sheet)).toBeGreaterThanOrEqual(4.5);
  });
});

describe("required + sheet number", () => {
  it("allRequiredFilled", () => {
    expect(allRequiredFilled(["a", "b"])).toBe(true);
    expect(allRequiredFilled(["a", ""])).toBe(false);
    expect(allRequiredFilled(["a", "  "])).toBe(false);
    expect(allRequiredFilled(["a", null])).toBe(false);
    expect(allRequiredFilled(["a", undefined])).toBe(false);
  });
  it("sheetNo", () => {
    expect(sheetNo("67VGT")).toBe("NO. 67VGT");
    expect(sheetNo(null)).toBe("NO. —");
    expect(sheetNo(undefined)).toBe("NO. —");
  });
  it("required asterisk is readable on the sheet", () => {
    expect(contrastRatio(C.error, C.sheet)).toBeGreaterThanOrEqual(4.5);
  });
});
