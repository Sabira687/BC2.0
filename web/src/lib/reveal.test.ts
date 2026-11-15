import { describe, expect, it } from "vitest";
import { REVEAL_TOTAL_MS, revealPhaseAt, revealSequence } from "./reveal";

describe("reveal timeline", () => {
  it("is at most 2.5 s", () => {
    expect(REVEAL_TOTAL_MS).toBeLessThanOrEqual(2500);
    expect(REVEAL_TOTAL_MS).toBeGreaterThan(1500);
  });
  it("walks silhouette, sheen, glow, pause, flip, new, done", () => {
    expect(revealPhaseAt(0)).toBe("silhouette");
    expect(revealPhaseAt(350)).toBe("sheen");
    expect(revealPhaseAt(650)).toBe("glow");
    expect(revealPhaseAt(1000)).toBe("pause");
    expect(revealPhaseAt(1750)).toBe("flip");
    expect(revealPhaseAt(2100)).toBe("new");
    expect(revealPhaseAt(REVEAL_TOTAL_MS)).toBe("done");
    expect(revealPhaseAt(99999)).toBe("done");
  });
});

describe("revealSequence", () => {
  it("one card keeps the single timeline", () => {
    const ev = revealSequence(1);
    expect(ev[0]).toEqual({ at: 0, index: 0, phase: "silhouette" });
    expect(ev.at(-1)).toEqual({ at: REVEAL_TOTAL_MS, index: 0, phase: "done" });
  });
  it("three cards go in order, one after another, done once at the end", () => {
    const ev = revealSequence(3);
    expect(ev.filter((e) => e.phase === "done")).toHaveLength(1);
    expect(ev.at(-1)!.index).toBe(2);
    expect(ev.map((e) => e.at)).toEqual([...ev.map((e) => e.at)].sort((a, b) => a - b));
    expect(ev.filter((e) => e.phase === "silhouette").map((e) => e.index)).toEqual([0, 1, 2]);
    expect(ev.filter((e) => e.phase === "new").map((e) => e.index)).toEqual([0, 1, 2]);
    expect(ev.at(-1)!.at).toBeLessThanOrEqual(7500);
  });
});

import { sparkLayout } from "./reveal";
describe("sparkLayout", () => {
  it("is deterministic with the requested count", () => {
    expect(sparkLayout(14)).toEqual(sparkLayout(14));
    expect(sparkLayout(14)).toHaveLength(14);
  });
});
