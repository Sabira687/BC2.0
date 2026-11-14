import { describe, expect, it } from "vitest";
import { captureNotices, starsText } from "./notices";
import { captureFromAssistant } from "./capture";
import { TECHNIQUES } from "./content/techniques";

describe("starsText", () => {
  it("renders filled and empty stars", () => {
    expect(starsText(2)).toBe("★★☆");
    expect(starsText(0)).toBe("☆☆☆");
  });
});

describe("captureNotices", () => {
  it("is empty for plain text", () => {
    expect(captureNotices(captureFromAssistant("Hello there", null))).toEqual([]);
  });

  it("reports activation, stars and stamps from Claude's lines", () => {
    const name = TECHNIQUES[0]!.name;
    const text = `▶ ITEM ACTIVATED · LEARN · Three-Tooth Key\n✅ CHECK PASSED · ★★☆\nSTAMP EARNED · ${name}`;
    const status = { kind: "learn", playerId: "ABCDE", lesson: "m1.2", module: "m1", step: 7 } as const;
    expect(captureNotices(captureFromAssistant(text, status))).toEqual([
      "LEARN card activated",
      "✅ Check passed · ★★☆",
      `Stamp earned: ${name}`,
    ]);
  });
});

import { gainFor } from "./notices";
describe("gainFor", () => {
  const gain = { stamps: [], helpUsed: false };
  it("shows a gain only while the conversation is still at the length it was captured at", () => {
    expect(gainFor({ gain, at: 4 }, 4)).toBe(gain);
    expect(gainFor({ gain, at: 4 }, 5)).toBeNull(); // player sent/inserted/used Help, or a reply was added
    expect(gainFor({ gain, at: 4 }, 0)).toBeNull(); // start over
    expect(gainFor(null, 4)).toBeNull();
  });
});
