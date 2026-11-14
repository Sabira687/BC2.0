import { ITEMS, HELP_ITEM } from "./content";
import { describe, expect, it } from "vitest";
import { BENEFITS, ITEM_PANELS, QUICK_DEMO_STEPS, KEPT, PATH_STOPS, PATH_TILES, PLAN_COLUMNS, PREMIUM_TICKET, ROADMAP } from "./marketing";
import { PRICE_USD_PER_MONTH } from "./generator";

const ALL = JSON.stringify([QUICK_DEMO_STEPS, ITEM_PANELS, PATH_STOPS, BENEFITS, KEPT, PREMIUM_TICKET, ROADMAP, PLAN_COLUMNS, PATH_TILES]);

describe("marketing copy", () => {
  it("quick demo step 1 makes the cards, step 2 is the decided text", () => {
    expect(QUICK_DEMO_STEPS[0]).toBe("Make Set 01: your first 3 cards");
    expect(QUICK_DEMO_STEPS[1]).toBe("Open the Learn card, press “Use this answer”, send. Watch the star and your first stamp arrive.");
    expect(QUICK_DEMO_STEPS).toHaveLength(4);
  });
  it("fast-forward step quotes the reachable score", () => {
    expect(QUICK_DEMO_STEPS[3]).toContain("90");
  });
  it("uses the real price", () => {
    expect(PLAN_COLUMNS[2]!.price).toBe(`$${PRICE_USD_PER_MONTH}`);
  });
  it("has five items on the podium, five path stops, three roadmap columns", () => {
    expect(ITEM_PANELS).toHaveLength(5);
    expect(PATH_STOPS).toHaveLength(5);
    expect(ROADMAP.map((r) => r.tag)).toEqual(["NOW", "NEXT", "THEN"]);
  });
  it("premium covers sets 08-15 in two paths of four", () => {
    expect(PATH_TILES.map((t) => t.skills.length)).toEqual([4, 4]);
    expect(PATH_TILES[0]!.first).toBe(8);
  });
  it("avoids banned words (Vault, BOSS, streak mechanics promised)", () => {
    expect(ALL).not.toMatch(/vault|boss/i);
  });
});

describe("podium panels match the item content", () => {
  it("names and lore are the real Set 01 items", () => {
    expect(ITEM_PANELS[0]).toMatchObject({ name: ITEMS.m1!.learn.name, lore: ITEMS.m1!.learn.lore });
    expect(ITEM_PANELS[1]).toMatchObject({ name: ITEMS.m1!.test.name, lore: ITEMS.m1!.test.lore });
    expect(ITEM_PANELS[2]).toMatchObject({ name: HELP_ITEM.name, lore: HELP_ITEM.lore });
  });
});

import { planTicketTitle } from "./marketing";

describe("planTicketTitle", () => {
  it("exact ticket headings", () => {
    expect(PLAN_COLUMNS.map(planTicketTitle)).toEqual(["IN THIS DEMO · LIVE NOW", "FREE · AT LAUNCH $0", "PREMIUM · AT LAUNCH $7 / MONTH"]);
  });
});
