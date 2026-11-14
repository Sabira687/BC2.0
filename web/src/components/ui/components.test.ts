import { createElement as e } from "react";
import { renderToStaticMarkup as r } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Card, EventLine, Stamp, Stars, TypeChip } from "./index";

describe("ui components render", () => {
  it("Card normal has text stars and label", () => {
    const h = r(e(Card, { kind: "learn", title: "The Clear Ask", stars: 2, setLabel: "S01 · 1/3" }));
    expect(h).toContain("LEARN card: The Clear Ask, 2 of 3 stars");
    expect(h).toContain("S01 · 1/3");
  });
  it("Card help has no stars; locked is a card back", () => {
    expect(r(e(Card, { kind: "help", title: "X" }))).toContain("TOOL · NO STARS");
    expect(r(e(Card, { kind: "locked", setLabel: "S03" }))).toContain("Locked card");
  });
  it("Card new shows NEW!, holo says holographic", () => {
    expect(r(e(Card, { kind: "test", state: "new", title: "T", stars: 0 }))).toContain("NEW!");
    expect(r(e(Card, { kind: "test", state: "holo", title: "T", stars: 3 }))).toContain("holographic");
  });
  it("Stamp earned vs not", () => {
    expect(r(e(Stamp, { code: "1", name: "Brief formula", difficulty: "Easy", earned: true }))).toContain("Stamp earned: Brief formula, easy");
    const n = r(e(Stamp, { code: "1", name: "Brief formula", difficulty: "Easy", earned: false }));
    expect(n).toContain("???");
    expect(n).toContain("Brief formula");
  });
  it("Stars, EventLine, TypeChip", () => {
    expect(r(e(Stars, { value: 1 }))).toContain("1 of 3 stars");
    expect(r(e(EventLine, { kind: "pass", text: "CHECK PASSED" }))).toContain("CHECK PASSED");
    expect(r(e(TypeChip, { kind: "test" }))).toContain("TEST");
  });
});
