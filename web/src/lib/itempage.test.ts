import { describe, expect, it } from "vitest";
import { itemPageModel, itemStats } from "./itempage";
import { createInitialState, createItem, fastForwardDemo } from "./progress";
import { seededRandom } from "./testutil";
import type { AppState } from "./types";

const fresh = (): AppState => createInitialState(seededRandom(7));
const withLearn = (): AppState => createItem(fresh(), "learn:m1");

describe("itemPageModel: learn", () => {
  it("fresh: no stars, Lesson 1.1 is next, stamps not earned", () => {
    const p = itemPageModel(withLearn(), "learn:m1");
    expect(p.name).toBe("Three-Tooth Key");
    expect(p.position).toBe("1/3");
    expect(p.setNumber).toBe("01");
    expect(p.stars).toBe(0);
    expect(p.quest.map((r) => r.status)).toEqual(["next", "locked", "locked", "locked"]);
    expect(p.quest[0]!.code).toBe("1.1");
    expect(p.quest[3]!.code).toBe("FINAL");
    expect(p.stamps).toHaveLength(3);
    expect(p.stamps.every((s) => !s.earned)).toBe(true);
    expect(p.stamps[0]!.label).toBe("Brief formula");
    expect(p.stats.find((s) => s.label === "STARS")?.value).toContain("next star: finish Lesson 1.1");
  });

  it("with 1 star: first lesson done, next is 1.2", () => {
    const s = { ...withLearn(), learnStars: { m1: 1 as const } };
    const p = itemPageModel(s, "learn:m1");
    expect(p.quest.map((r) => r.status)).toEqual(["done", "next", "locked", "locked"]);
    expect(p.stats.find((x) => x.label === "STARS")?.value).toContain("Lesson 1.2");
  });

  it("stamps earned come from state.stamps", () => {
    const s = { ...withLearn(), stamps: ["1" as const] };
    expect(itemPageModel(s, "learn:m1").stamps.map((x) => x.earned)).toEqual([true, false, false]);
  });

  it("3 stars: everything done", () => {
    const p = itemPageModel(fastForwardDemo(fresh()), "learn:m1");
    expect(p.quest.every((r) => r.status === "done")).toBe(true);
    expect(p.stars).toBe(3);
  });
});

describe("itemPageModel: test and help", () => {
  it("test with no result: first row next, score not taken", () => {
    const p = itemPageModel(fastForwardDemo(fresh()), "test:m1");
    expect(p.stars).toBe(3);
    expect(p.stats.find((s) => s.label === "BEST SCORE")?.value).toBe("90/100");
    expect(p.quest.every((r) => r.status === "done")).toBe(true);
    const f = createItem({ ...fresh(), learnStars: { m1: 3 } }, "test:m1");
    const q = itemPageModel(f, "test:m1");
    expect(q.stats.find((s) => s.label === "BEST SCORE")?.value).toBe("not taken yet");
    expect(q.quest.filter((r) => r.status === "next")).toHaveLength(1);
    expect(q.quest.find((r) => r.status === "next")?.title).toMatch(/Take the TEST/);
  });

  it("help: no stamps, no stars, used flag drives the quest", () => {
    const s = createItem(fresh(), "help");
    const p = itemPageModel(s, "help");
    expect(p.stars).toBeNull();
    expect(p.stamps).toEqual([]);
    expect(p.quest[0]!.status).toBe("next");
    const used = itemPageModel({ ...s, helpUsed: true }, "help");
    expect(used.quest[0]!.status).toBe("done");
  });
});

describe("itemStats", () => {
  it("new player: 0 stars, three open stamps, use text", () => {
    const st = itemStats(withLearn(), "learn:m1");
    expect(st.stars).toBe(0);
    expect(st.stamps).toEqual([
      { name: "Brief formula", earned: false },
      { name: "Explicit format", earned: false },
      { name: "Your own material", earned: false },
    ]);
    expect(st.use.startsWith("Paste into a new chat")).toBe(true);
    expect(st.lessons).toContain("3 lessons");
    expect(st.story.length).toBeGreaterThan(0);
  });
  it("after lesson 1.1 (learnStars 1 and stamp 1, as capture produces) Brief formula is earned", () => {
    const st = itemStats({ ...withLearn(), learnStars: { m1: 1 as const }, stamps: ["1" as const] }, "learn:m1");
    expect(st.stamps[0]).toEqual({ name: "Brief formula", earned: true });
  });
  it("learnStars alone does not earn a stamp", () => {
    const st = itemStats({ ...withLearn(), learnStars: { m1: 1 as const } }, "learn:m1");
    expect(st.stamps.every((s) => !s.earned)).toBe(true);
  });
});
