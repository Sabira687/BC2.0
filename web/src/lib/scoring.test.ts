import { describe, expect, it } from "vitest";
import { PASS_SCORE, PRACTICAL_POINTS, QUESTION_POINTS, bucketOf, isPass, learnStarsFor, scoreOf, testStars } from "./scoring";
import { ALL_OUTCOMES, expectedScore } from "./testutil";
import type { TaskOutcomes } from "./types";

describe("scoreOf", () => {
  it("covers all 72 outcome combinations", () => {
    expect(ALL_OUTCOMES).toHaveLength(72);
    expect(new Set(ALL_OUTCOMES.map((t) => t.join())).size).toBe(72);
  });

  it.each(ALL_OUTCOMES.map((t) => [t.join(" "), t] as const))("%s", (_l, t) => {
    expect(scoreOf(t)).toBe(expectedScore(t));
  });

  it("10 per question, 35 per practical task, rewrite counts in full", () => {
    expect(QUESTION_POINTS).toBe(10);
    expect(PRACTICAL_POINTS).toBe(35);
    expect(scoreOf(["right", "right", "right", "pass", "pass"])).toBe(100);
    expect(scoreOf(["right", "right", "right", "rewrite", "rewrite"])).toBe(100);
    expect(scoreOf(["wrong", "wrong", "wrong", "fail", "fail"])).toBe(0);
    expect(scoreOf(["right", "right", "right", "fail", "fail"])).toBe(30);
    expect(scoreOf(["wrong", "wrong", "wrong", "rewrite", "fail"])).toBe(35);
    expect(scoreOf(["right", "wrong", "wrong", "pass", "rewrite"])).toBe(80);
  });

  it("the set of reachable scores", () => {
    const scores = [...new Set(ALL_OUTCOMES.map(scoreOf))].sort((a, b) => a - b);
    expect(scores).toEqual([0, 10, 20, 30, 35, 45, 55, 65, 70, 80, 90, 100]);
  });

  it("does not mutate its input", () => {
    const t: TaskOutcomes = ["right", "wrong", "right", "rewrite", "fail"];
    const copy = [...t];
    scoreOf(t);
    expect(t).toEqual(copy);
  });
});

describe("testStars", () => {
  it.each([
    [0, 0],
    [49, 0],
    [50, 1],
    [69, 1],
    [70, 2],
    [89, 2],
    [90, 3],
    [100, 3],
  ] as const)("%i → %i", (score, stars) => {
    expect(testStars(score)).toBe(stars);
  });

  it("token buckets follow the stars", () => {
    expect([0, 50, 70, 90].map(bucketOf)).toEqual(["none", "bronze", "silver", "gold"]);
  });
  it("on reachable scores the star thresholds equal the old rank thresholds (85 gold)", () => {
    for (const t of ALL_OUTCOMES) {
      const s = scoreOf(t);
      expect(testStars(s) === 3).toBe(s >= 85);
    }
  });
});

describe("learnStarsFor", () => {
  const c = (l1: boolean, l2: boolean, l3: boolean, boss: boolean) => ({ l1, l2, l3, boss });
  it("stars = lessons cleared; the third needs L3 and the boss", () => {
    expect(learnStarsFor(c(false, false, false, false))).toBe(0);
    expect(learnStarsFor(c(true, false, false, false))).toBe(1);
    expect(learnStarsFor(c(true, true, false, false))).toBe(2);
    expect(learnStarsFor(c(true, true, true, false))).toBe(2);
    expect(learnStarsFor(c(true, true, true, true))).toBe(3);
  });
});

describe("isPass", () => {
  it("passes from 70", () => {
    expect(PASS_SCORE).toBe(70);
    expect(isPass(69)).toBe(false);
    expect(isPass(70)).toBe(true);
    expect(isPass(100)).toBe(true);
    expect(isPass(0)).toBe(false);
  });
  it("a pass is exactly silver or gold", () => {
    for (const t of ALL_OUTCOMES) {
      const s = scoreOf(t);
      expect(isPass(s)).toBe(testStars(s) >= 2);
    }
  });
});

import { practiceHint } from "./scoring";
import type { TestResult } from "./types";

describe("practiceHint (plan interface)", () => {
  const res = (tasks: TestResult["tasks"], score: number): TestResult => ({ module: "m1", tasks, score, stars: 0, techniques: [], at: "2026-01-01T00:00:00.000Z" });
  it("10/10/0/35/35 → the q3 hint", () => {
    expect(practiceHint(res(["right", "right", "wrong", "pass", "pass"], 90))).toEqual({ task: "Why paste your own material", lesson: "Lesson 1.3 · Give it the material" });
  });
  it("100/100 → null", () => {
    expect(practiceHint(res(["right", "right", "right", "pass", "pass"], 100))).toBeNull();
  });
  it("a set without written test content → null", () => {
    expect(practiceHint({ ...res(["wrong", "wrong", "wrong", "fail", "fail"], 0), module: "m2" })).toBeNull();
  });
});
