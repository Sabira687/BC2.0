import { describe, expect, it } from "vitest";
import { createInitialState } from "./progress";
import { skySet } from "./sky";
import { seededRandom } from "./testutil";
import { labelExtent, SKY_VIEWBOX } from "./skygeom";

describe("sky label bounds", () => {
  it("every label (even lit with a check, or NEXT) stays inside the viewBox", () => {
    const sky = skySet(createInitialState(seededRandom(3)), "m1");
    const [minX, , w] = SKY_VIEWBOX;
    for (const s of sky) {
      for (const suffix of [" ✓", " · NEXT", ""]) {
        const [l, r] = labelExtent(s.id, s.label + suffix);
        expect(l, s.id).toBeGreaterThanOrEqual(minX);
        expect(r, s.id).toBeLessThanOrEqual(minX + w);
      }
    }
  });
});
