import { describe, expect, it } from "vitest";
import { TECHNIQUE_CODES } from "./tokens";
import { createInitialState, createItem, fastForwardDemo } from "./progress";
import { lessonForTechnique, stampBoard, techniqueInfo, whatYouCanDo, YOU_CAN } from "./progressview";
import { seededRandom } from "./testutil";
import type { AppState } from "./types";

const fresh = (): AppState => createInitialState(seededRandom(3));
const demo = (): AppState => fastForwardDemo(fresh());

describe("technique tables", () => {
  it("every technique has a short name and a 'You can' sentence", () => {
    for (const c of TECHNIQUE_CODES) {
      const t = techniqueInfo(c);
      expect(t.short.length).toBeGreaterThan(2);
      expect(YOU_CAN[c].length).toBeGreaterThan(15);
    }
    expect(YOU_CAN["1"]).toBe("Write an ask the AI gets right the first time");
  });
  it("lessonForTechnique: first lesson teaching it (only Set 01 is written in full)", () => {
    expect(lessonForTechnique("1")).toMatchObject({ id: "m1.1", number: "1.1" });
    expect(lessonForTechnique("2")).toMatchObject({ id: "m1.2" });
    expect(lessonForTechnique("3")).toMatchObject({ id: "m1.3", title: "Give It the Material" });
    expect(lessonForTechnique("C")).toBeNull();
  });
  it("set of a technique comes from the modules", () => {
    expect(techniqueInfo("1").set).toBe("01");
    expect(techniqueInfo("4").set).toBe("02");
  });
});

describe("whatYouCanDo: only verified skills", () => {
  it("empty for a fresh player (Player One is a gift, not a skill)", () => {
    expect(whatYouCanDo(fresh())).toEqual([]);
  });
  it("after the demo: one line per earned technique plus the passed test", () => {
    const list = whatYouCanDo(demo());
    expect(list.map((x) => x.text)).toEqual([
      "Write an ask the AI gets right the first time",
      YOU_CAN["2"],
      YOU_CAN["3"],
      "Pass a 5-task test on your own work",
    ]);
    expect(list[0]!.detail).toBe("Brief formula · taught in Lesson 1.1");
    expect(list[3]!.detail).toBe("Test 01 · 90 / 100");
  });
  it("a failed test adds no test line", () => {
    const s = { ...fresh(), results: { m1: { module: "m1" as const, tasks: ["wrong", "wrong", "wrong", "fail", "fail"] as never, score: 0, stars: 0 as const, techniques: [], at: "2026-01-01T00:00:00.000Z" } } };
    expect(whatYouCanDo(s)).toEqual([]);
  });
});

describe("stampBoard", () => {
  it("13 stamps, count and groups with set ranges", () => {
    const b = stampBoard(fresh());
    expect(b.total).toBe(13);
    expect(b.earned).toBe(1);
    expect(b.countText).toBe("1 / 13");
    expect(b.start).toMatchObject({ code: "P", name: "Player One", earned: true });
    expect(b.groups.map((g) => [g.difficulty, g.stamps.length])).toEqual([["Easy", 5], ["Medium", 4], ["Hard", 3]]);
    expect(b.groups[0]!.stamps[0]).toMatchObject({ code: "1", name: "Brief formula", earned: false, setLabel: "SET 01" });
  });
  it("stamp groups are captioned by technique code, not by set", () => {
    expect(stampBoard(fresh()).groups.map((g) => g.caption)).toEqual(["EASY · TECHNIQUES 1–5", "MEDIUM · TECHNIQUES 6–9", "HARD · TECHNIQUES A–C"]);
  });
  it("the Artifacts stamp is captioned Premium", () => {
    const c = stampBoard(fresh()).groups[2]!.stamps.find((x) => x.code === "C")!;
    expect(c.setLabel).toBe("PREMIUM");
    expect(stampBoard(fresh()).groups[0]!.stamps[0]!.setLabel).toBe("SET 01");
  });
  it("after the demo 4 / 13", () => {
    const b = stampBoard(demo());
    expect(b.countText).toBe("4 / 13");
    expect(b.groups[0]!.stamps.filter((s) => s.earned).map((s) => s.code)).toEqual(["1", "2", "3"]);
  });
});

import { stampPassport } from "./progressview";

describe("stampPassport: 13 slots in one grid", () => {
  it("has Player One then 12 techniques with difficulty outlines", () => {
    const p = stampPassport(fresh());
    expect(p.slots).toHaveLength(13);
    expect(p.slots[0]).toMatchObject({ code: "P", difficulty: "start", earned: true });
    expect(p.slots.slice(1, 6).every((s) => s.difficulty === "easy")).toBe(true);
    expect(p.slots.slice(6, 10).every((s) => s.difficulty === "medium")).toBe(true);
    expect(p.slots.slice(10).every((s) => s.difficulty === "hard")).toBe(true);
    expect(p.countText).toBe("1 / 13");
  });
  it("demo earns Player One + three technique stamps", () => {
    const p = stampPassport(demo());
    expect(p.earned).toBe(4);
    expect(p.slots.filter((s) => s.earned).map((s) => s.code)).toEqual(["P", "1", "2", "3"]);
  });
});

describe("stampPassport: spine, counter, caption", () => {
  it("spine carries the player's name; counter n/13; Artifacts caption", () => {
    const s = demo();
    const p = stampPassport(s);
    expect(p.spine).toBe(`ADMIT ONE · VALID FOREVER · No. 0001 · ${s.profile.name.toUpperCase()}`);
    expect(p.countText).toBe("4 / 13");
    expect(p.caption).toBe("the Artifacts stamp comes with premium");
  });
});
