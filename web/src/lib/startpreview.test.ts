import { describe, expect, it } from "vitest";
import { firstReply } from "./startpreview";
import { TONES, getModule } from "./content";

describe("firstReply", () => {
  it("mentor and straight differ and use the player's name and real module", () => {
    const m = firstReply("mentor", "John");
    const s = firstReply("straight", "John");
    expect(m.text).not.toBe(s.text);
    expect(m.text).toContain("John");
    expect(s.text).toContain("John");
    expect(m.text).toContain(getModule("m1").title);
    expect(m.text).toContain("1.1 The Brief Formula");
  });
  it("shows a real tone rule and label", () => {
    const m = firstReply("mentor", "John");
    expect(m.styleLabel).toBe(TONES.mentor.label);
    expect(TONES.mentor.rules).toContain(m.rule);
  });
  it("counts three short lessons and a final task, not 4 lessons", () => {
    for (const style of ["straight", "mentor"] as const) {
      const t = firstReply(style, "John").text;
      expect(t).toContain("three short lessons and a final task");
      expect(t).not.toMatch(/4 short lessons/);
    }
  });
  it("falls back when the name is empty", () => {
    expect(firstReply("straight", "").text).toMatch(/^Player\./);
  });
});
