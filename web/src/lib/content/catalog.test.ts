import { describe, expect, it } from "vitest";
import { CATALOG, CATALOG_COUNTS, catalogSet } from "./catalog";

describe("45-item catalog", () => {
  it("has 15 sets x 3 items: 21 free + 24 premium = 45", () => {
    expect(CATALOG).toHaveLength(15);
    expect(CATALOG.flatMap((s) => s.items)).toHaveLength(45);
    expect(CATALOG_COUNTS).toEqual({ total: 45, free: 21, premium: 24 });
  });
  it("sets 01-07 are free, 08-15 premium, numbered and titled", () => {
    expect(CATALOG.map((s) => s.number)).toEqual(["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12", "13", "14", "15"]);
    expect(CATALOG.filter((s) => s.tier === "free")).toHaveLength(7);
    expect(CATALOG.filter((s) => s.tier === "premium")).toHaveLength(8);
    expect(catalogSet("01").title).toBe("The Clear Ask");
    expect(catalogSet("15").title).toBe("Automations");
    expect(catalogSet("08").path).toBe("Power user");
    expect(catalogSet("12").path).toBe("Automator");
    expect(catalogSet("03").path).toBeUndefined();
  });
  it("rarity: Common 01-03, Rare 04-07, Legendary premium", () => {
    expect(CATALOG.map((s) => s.rarity)).toEqual([..."ccc"].map(() => "common").concat(["rare", "rare", "rare", "rare"], Array(8).fill("legendary")));
  });
  it("each set has learn, test, help items with a name, kind and art key or null", () => {
    for (const s of CATALOG) {
      expect(s.items.map((i) => i.kind)).toEqual(["learn", "test", "help"]);
      for (const i of s.items) {
        expect(i.name.length).toBeGreaterThan(0);
        expect(i.rarity).toBe(s.rarity);
      }
    }
    expect(catalogSet("01").items.map((i) => [i.name, i.art])).toEqual([["Three-Tooth Key", "key"], ["Proving Lock", "lock"], ["Pocket Compass", "compass"]]);
    expect(catalogSet("02").items[0]!.art).toBeNull();
    expect(catalogSet("02").items[0]!.name).toBe("Iterate");
  });
  it("only set 01 is playable in the demo", () => {
    expect(CATALOG.filter((s) => s.playable).map((s) => s.number)).toEqual(["01"]);
  });
});
