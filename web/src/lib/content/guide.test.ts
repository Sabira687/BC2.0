import { describe, expect, it } from "vitest";
import { GUIDE_CHECKLIST, GUIDE_CONNECTOR, GUIDE_STEPS, GUIDE_WAYS } from "./guide";

describe("guide content", () => {
  it("has six numbered steps with distinct visuals", () => {
    expect(GUIDE_STEPS.map((s) => s.n)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(new Set(GUIDE_STEPS.map((s) => s.visual)).size).toBe(6);
    for (const s of GUIDE_STEPS) expect(s.title && s.text && s.tag).toBeTruthy();
  });
  it("has two ways to learn (own Claude recommended), a checklist and the Premium connector", () => {
    expect(GUIDE_WAYS).toHaveLength(2);
    expect(GUIDE_WAYS.filter((w) => w.recommended).map((w) => w.name)).toEqual(["Your own Claude"]);
    expect(GUIDE_CHECKLIST).toHaveLength(5);
    expect(GUIDE_CONNECTOR.kicker).toMatch(/PREMIUM/);
  });
});
