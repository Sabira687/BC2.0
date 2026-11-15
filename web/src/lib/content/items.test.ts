import { describe, expect, it } from "vitest";
import { HELP_ITEM, ITEMS, RARITY_META, itemFor, moduleOfItemName, rarityOfSet, setNumberOf, tierOfSet } from "./items";
import { MODULES } from ".";

describe("item content", () => {
  it("Set 01 items are the Key, the Lock and the Compass, all common", () => {
    expect(ITEMS.m1!.learn.name).toBe("Three-Tooth Key");
    expect(ITEMS.m1!.test.name).toBe("Proving Lock");
    expect(ITEMS.m1!.help.name).toBe("Pocket Compass");
    for (const k of ["learn", "test", "help"] as const) {
      expect(ITEMS.m1![k].rarity).toBe("common");
      expect(ITEMS.m1![k].lore.length).toBeGreaterThan(40);
    }
    expect(ITEMS.m1!.learn.lore).toMatch(/^Cut for doors/);
  });
  it("rarity and tier by set number", () => {
    expect([1, 2, 3].map(rarityOfSet)).toEqual(["common", "common", "common"]);
    expect([4, 5, 6, 7].map(rarityOfSet)).toEqual(["rare", "rare", "rare", "rare"]);
    expect([8, 12, 15].map(rarityOfSet)).toEqual(["legendary", "legendary", "legendary"]);
    expect([1, 7].map(tierOfSet)).toEqual(["free", "free"]);
    expect([8, 15].map(tierOfSet)).toEqual(["premium", "premium"]);
    expect(setNumberOf("m8")).toBe(8);
  });
  it("m8 (Artifacts) is a Premium-path set, m1-m7 are free", () => {
    expect(MODULES.map((m) => tierOfSet(setNumberOf(m.id)))).toEqual(["free", "free", "free", "free", "free", "free", "free", "premium"]);
  });
  it("rarity meta has symbol, label and color", () => {
    expect(RARITY_META.common).toMatchObject({ symbol: "●", label: "COMMON" });
    expect(RARITY_META.rare).toMatchObject({ symbol: "◆", label: "RARE" });
    expect(RARITY_META.legendary).toMatchObject({ symbol: "★", label: "LEGENDARY" });
  });
  it("itemFor: written items by module, fallback to the set title, HELP always the Compass", () => {
    expect(itemFor("m1", "learn")).toMatchObject({ name: "Three-Tooth Key", rarity: "common", written: true });
    expect(itemFor("m2", "learn")).toMatchObject({ name: "Iterate", rarity: "common", written: false });
    expect(itemFor("m5", "test").rarity).toBe("rare");
    expect(itemFor(null, "help")).toMatchObject(HELP_ITEM);
    expect(itemFor("m3", "help").name).toBe("Pocket Compass");
  });
  it("moduleOfItemName finds the module from an item name or a set title", () => {
    expect(moduleOfItemName("Three-Tooth Key")).toBe("m1");
    expect(moduleOfItemName("proving lock")).toBe("m1");
    expect(moduleOfItemName("The Clear Ask")).toBe("m1");
    expect(moduleOfItemName("Iterate")).toBe("m2");
    expect(moduleOfItemName("Nope")).toBeNull();
  });
});
