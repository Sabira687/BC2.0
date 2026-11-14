import { describe, expect, it } from "vitest";
import { cardFace, cardProperties, nextStep, setLabel } from "./nextstep";
import { albumOf } from "./album";
import { createInitialState, createItem, fastForwardDemo } from "./progress";
import { seededRandom } from "./testutil";
import type { AppState } from "./types";

const fresh = (): AppState => createInitialState(seededRandom(7));

describe("nextStep", () => {
  it("before any lesson: start Lesson 1.1 from the content", () => {
    const n = nextStep(fresh());
    expect(n.title).toBe("Start Lesson 1.1 · The Brief Formula");
    expect(n.href).toBe("/console");
    expect(n.cta).toBe("OPEN SET 01");
    expect(n.note).toBe("3 items made for you");
    expect(n.openSet).toBe("m1");
    expect(n.create).toBeUndefined();
  });

  it("once the Learn card exists the CTA opens the lesson", () => {
    const n = nextStep(createItem(fresh(), "learn:m1"));
    expect(n.cta).toBe("Open lesson");
    expect(n.create).toBeUndefined();
  });

  it("follows learnStars to the next lesson", () => {
    expect(nextStep({ ...fresh(), learnStars: { m1: 1 } }).title).toMatch(/^Continue Lesson 1\.2 · /);
    expect(nextStep({ ...fresh(), learnStars: { m1: 2 } }).title).toMatch(/^Continue Lesson 1\.3 · /);
  });

  it("after LEARN 3 stars: TEST (create first, then open)", () => {
    const s: AppState = { ...fresh(), learnStars: { m1: 3 } };
    expect(nextStep(s)).toMatchObject({ title: "Take the TEST · Set 01", href: "/collection", cta: "Create TEST card" });
    const made = createItem(s, "test:m1");
    expect(nextStep(made)).toMatchObject({ href: "/item/test", cta: "Open TEST card" });
  });

  it("after the test: HELP, then the set is complete", () => {
    const done = fastForwardDemo(fresh());
    // the demo ends at Set 01: later sets are free at launch
    expect(nextStep(done)).toMatchObject({ title: "This set is complete", href: "/progress" });
    expect(nextStep(done).text).toBe("Set 02 · Iterate and Set 03 · Show, Don't Tell are free at launch; this demo ends at Set 01.");
    const noHelp: AppState = { ...done, helpUsed: false };
    expect(nextStep(noHelp).title).toMatch(/HELP/);
  });

  it("is always well formed", () => {
    const n = nextStep(fresh());
    expect(n.text.length).toBeGreaterThan(0);
  });
});

describe("nextStep end", () => {
  it("falls back to progress when nothing is pending", () => {
    const done = fastForwardDemo(fresh());
    const sub = { ...done, subscription: { ...done.subscription, active: true } };
    expect(nextStep(sub).href).toMatch(/^\/(progress|console|item)/);
  });
});

describe("card helpers", () => {
  it("cardProperties", () => {
    expect(cardProperties("learn")).toBe("Learn · 3 lessons · ~10 min");
    expect(cardProperties("test")).toBe("Test · 5 tasks · ~5 min");
    expect(cardProperties("help")).toBe("Help · any task · ~1 min");
  });
  it("setLabel", () => {
    expect(setLabel("01", "learn")).toBe("S01 · 1/3");
    expect(setLabel("01", "test")).toBe("S01 · 2/3");
    expect(setLabel("01", "help")).toBe("S01 · 3/3");
  });
});

describe("cardFace", () => {
  it("Set 01 cards are items: name as title, set title as overline, common, with art", () => {
    const set = albumOf(fresh())[0]!;
    const [learn, test, help] = set.cards.map((c) => cardFace(c, set));
    expect(learn).toMatchObject({ title: "Three-Tooth Key", overline: "THE CLEAR ASK", rarity: "common", art: true, setLabel: "S01 · 1/3", stars: 0 });
    expect(test).toMatchObject({ title: "Proving Lock", art: true, setLabel: "S01 · 2/3" });
    expect(help).toMatchObject({ title: "Pocket Compass", setLabel: "S01 · 3/3", stars: undefined });
  });
});
