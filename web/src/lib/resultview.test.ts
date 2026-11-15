import { describe, expect, it } from "vitest";
import { PRACTICAL_OUTCOMES } from "./tokens";
import { litStarsAt, nextSkillCta, nextSkills, practiceDetail, resultSummary, starTimeline, taskChecks } from "./resultview";
import { TESTS } from "./content/tests";
import type { TaskOutcomes } from "./types";
import { createInitialState, fastForwardDemo } from "./progress";
import { seededRandom } from "./testutil";
import { demoResultView } from "./resultview";

const FF: TaskOutcomes = ["right", "right", "wrong", "pass", "pass"];

describe("content: every task has feedback and a focus technique", () => {
  const t = TESTS.m1!;
  it("questions carry title, focus, practice line and right/wrong lines", () => {
    for (const q of t.questions) {
      expect(q.title.length).toBeGreaterThan(5);
      expect(q.focus).toMatch(/^[1-9A-C]$/);
      expect(q.practice.length).toBeGreaterThan(10);
      expect(q.feedback.right.length).toBeGreaterThan(5);
      expect(q.feedback.wrong.length).toBeGreaterThan(5);
    }
    expect(t.questions[2].feedback.wrong).toBe("Not this time. Claude only knows the facts you give it, so paste the real text.");
  });
  it("practical tasks carry a line for every outcome", () => {
    for (const p of t.practical) {
      expect(p.focus).toMatch(/^[1-9A-C]$/);
      expect(p.practice.length).toBeGreaterThan(10);
      for (const o of PRACTICAL_OUTCOMES) expect(p.feedback[o].length).toBeGreaterThan(5);
    }
  });
});

describe("taskChecks", () => {
  it("lists the five tasks with title, mark, points and a content line", () => {
    const c = taskChecks("m1", FF);
    expect(c).toHaveLength(5);
    expect(c.map((x) => x.n)).toEqual([1, 2, 3, 4, 5]);
    expect(c.map((x) => x.type)).toEqual(["CHOICE", "CHOICE", "CHOICE", "PRACTICE", "PRACTICE"]);
    expect(c[0]).toMatchObject({ ok: true, mark: "✔", points: 10, max: 10 });
    expect(c[2]).toMatchObject({
      ok: false,
      mark: "✘",
      points: 0,
      max: 10,
      title: TESTS.m1!.questions[2].title,
      line: "Not this time. Claude only knows the facts you give it, so paste the real text.",
    });
    expect(c[3]).toMatchObject({ ok: true, mark: "✔", points: 35, max: 35, title: "Move a Deadline" });
    expect(c[3]!.line).toBe(TESTS.m1!.practical[0].feedback.pass);
  });
  it("a practical task passed on rewrite counts in full and says so; a fail scores 0", () => {
    const c = taskChecks("m1", ["right", "right", "right", "rewrite", "fail"]);
    expect(c[3]).toMatchObject({ ok: true, points: 35, label: "passed on rewrite" });
    expect(c[3]!.line).toBe(TESTS.m1!.practical[0].feedback.rewrite);
    expect(c[4]).toMatchObject({ ok: false, mark: "✘", points: 0, max: 35 });
    expect(c[4]!.line).toBe(TESTS.m1!.practical[1].feedback.fail);
  });
  it("points add up to the score", () => {
    const c = taskChecks("m1", FF);
    expect(c.reduce((a, x) => a + x.points, 0)).toBe(90);
  });
  it("no written test content: no checks", () => {
    expect(taskChecks("m2", FF)).toEqual([]);
  });
});

describe("practiceDetail (One thing to practice)", () => {
  it("is the first failed task, linked to the lesson that teaches its technique", () => {
    const h = practiceDetail("m1", FF)!;
    expect(h.taskNumber).toBe(3);
    expect(h.text).toBe(TESTS.m1!.questions[2].practice);
    expect(h.lesson).toEqual({ id: "m1.3", number: "1.3", title: "Give It the Material", label: "Lesson 1.3 · Give It the Material" });
  });
  it("first failure wins when several tasks failed", () => {
    expect(practiceDetail("m1", ["right", "wrong", "wrong", "fail", "pass"])!.taskNumber).toBe(2);
    expect(practiceDetail("m1", ["right", "right", "right", "pass", "fail"])!.taskNumber).toBe(5);
  });
  it("null when nothing failed (a rewrite is not a failure) or no content", () => {
    expect(practiceDetail("m1", ["right", "right", "right", "rewrite", "pass"])).toBeNull();
    expect(practiceDetail("m2", FF)).toBeNull();
  });
});

describe("resultSummary", () => {
  it("passed, below pass, and holo wording", () => {
    expect(resultSummary(90)).toBe("You passed. The skill counts from 70, and 90 or more makes your Test card holographic.");
    expect(resultSummary(75)).toBe("You passed. The skill counts from 70, and 90 or more makes your Test card holographic.");
    expect(resultSummary(55)).toMatch(/^Not yet\./);
  });
});

describe("star timeline", () => {
  it("lights the stars one by one, 350 ms apart", () => {
    expect(starTimeline(3, false)).toEqual([350, 700, 1050]);
    expect(starTimeline(2, false)).toEqual([350, 700]);
    expect(starTimeline(0, false)).toEqual([]);
  });
  it("reduced motion: all at once", () => {
    expect(starTimeline(3, true)).toEqual([0, 0, 0]);
  });
  it("litStarsAt counts the stars whose time has come", () => {
    expect(litStarsAt([350, 700, 1050], 0)).toBe(0);
    expect(litStarsAt([350, 700, 1050], 700)).toBe(2);
    expect(litStarsAt([0, 0, 0], 0)).toBe(3);
  });
});

describe("nextSkills", () => {
  it("the next two sets after the module", () => {
    expect(nextSkills("m1").map((s) => s.label)).toEqual(["Set 02 · Iterate", "Set 03 · Show, Don't Tell"]);
    expect(nextSkills("m8")).toEqual([]);
    expect(nextSkills("m7").map((s) => s.label)).toEqual(["Set 08 · Artifacts"]);
  });
});

describe("nextSkillCta", () => {
  it("free sets: free at launch, the demo ends at Set 01", () => {
    expect(nextSkillCta("m1", true)).toEqual({ title: "Choose Set 02 · Iterate or Set 03 · Show, Don't Tell", sub: "Set 02 · Iterate or Set 03 · Show, Don't Tell — free at launch; this demo ends at Set 01." });
  });
  it("not cleared: finish the set first", () => {
    expect(nextSkillCta("m1", false).title).toBe("Finish Set 01 first");
  });
  it("Premium path and last set", () => {
    expect(nextSkillCta("m7", true).sub).toContain("Premium");
    expect(nextSkillCta("m8", true).title).toBe("You have reached the last set");
  });
});

describe("demoResultView", () => {
  it("is null before any result and shows John's m1 result after the fast-forward", () => {
    const fresh = createInitialState(seededRandom(3));
    expect(demoResultView(fresh)).toBeNull();
    const ff = fastForwardDemo(fresh);
    const v = demoResultView(ff)!;
    expect(v.ok).toBe(true);
    expect(v.result.score).toBe(90);
    expect(v.newStamps).toEqual(ff.results.m1!.techniques);
    expect(v.previousBest).toBeNull();
    expect(v.unlocked).toEqual([]);
  });
});

import { testCompleteFrame } from "./resultview";
import { lineMarker } from "./markers";

describe("testCompleteFrame", () => {
  const frame = testCompleteFrame("m1", FF, 90, 3);
  it("is the chat frame: rules, item name, one row per task from content, score and stars", () => {
    const R = "━".repeat(44);
    expect(frame.lines[0]).toBe(R);
    expect(frame.lines[1]).toBe(" TEST COMPLETE · PROVING LOCK");
    expect(frame.lines[2]).toBe(R);
    const q = TESTS.m1!.questions;
    expect(frame.lines[3]).toBe(` 1  ${q[0]!.title.padEnd(31)}✓ 10/10`);
    expect(frame.lines[5]).toBe(` 3  ${q[2]!.title.padEnd(31)}✗  0/10`);
    expect(frame.lines[6]).toContain("✓ 35/35");
    expect(frame.lines[8]).toBe("─".repeat(44));
    expect(frame.lines[9]).toMatch(/^ SCORE  90\/100 +★★★$/);
    expect(frame.lines[10]).toBe(R);
    expect(frame.lines).toHaveLength(11);
  });
  it("the marker line is the real marker and the frame title is not a marker", () => {
    expect(frame.marker).toBe("TEST COMPLETE · ★★★ · 90/100");
    expect(frame.lines.some((l) => lineMarker(l) === "test")).toBe(false);
    expect(lineMarker(frame.marker)).toBe("test");
  });
  it("marks a rewrite, fills stars with ☆, and truncates very long titles", () => {
    const f = testCompleteFrame("m1", ["right", "right", "right", "rewrite", "fail"], 65, 1);
    expect(f.lines[6]).toContain("✓ 35/35 passed on rewrite");
    expect(f.lines[7]).toContain("✗  0/35");
    expect(f.lines[9]).toMatch(/SCORE {2}65\/100 +★☆☆$/);
    expect(f.marker).toBe("TEST COMPLETE · ★☆☆ · 65/100");
    for (const l of f.lines.slice(3, 8)) expect(l.length).toBeLessThanOrEqual(60);
  });
  it("is empty for a set without a written test", () => {
    expect(testCompleteFrame("m5", FF, 90, 3).lines).toEqual([]);
  });
});

import { readingDelayMs, resultChips } from "./resultview";

describe("readingDelayMs", () => {
  it("about 0.9 s, skipped under reduced motion", () => {
    expect(readingDelayMs(false)).toBe(900);
    expect(readingDelayMs(true)).toBe(0);
  });
});

describe("resultChips (from real state)", () => {
  const ffState = fastForwardDemo(createInitialState(seededRandom(3)));
  const view = demoResultView(ffState)!;
  it("constellation complete, one stamp chip per new stamp, one chip per milestone", () => {
    const chips = resultChips({ ...view, newAchievements: ["set_clear"] });
    expect(chips[0]).toEqual({ tone: "gold", text: "CONSTELLATION COMPLETE" });
    expect(chips.filter((c) => c.text.startsWith("+ STAMP"))).toHaveLength(view.newStamps.length);
    expect(chips.some((c) => c.text.startsWith("MILESTONE · "))).toBe(true);
  });
  it("no constellation chip while the set is unfinished", () => {
    const s = createInitialState(seededRandom(3));
    const partial = { ...view, state: s, newStamps: [], newAchievements: [] };
    expect(resultChips(partial).some((c) => c.text === "CONSTELLATION COMPLETE")).toBe(false);
  });
});

import { applyResultCode } from "./progress";
import { encodeResultCode } from "./resultcode";
import { withAlreadyCountedView } from "./resultview";

describe("withAlreadyCountedView", () => {
  it("shows the full result for an already counted code and leaves state alone", () => {
    const s0 = createInitialState();
    const tasks: TaskOutcomes = ["right", "right", "right", "pass", "pass"];
    const code = encodeResultCode(s0.secrets, "m1", tasks, []);
    const first = applyResultCode(s0, code);
    if (!first.ok) throw new Error("fresh code must apply");
    const again = applyResultCode(first.state, code);
    expect(again).toMatchObject({ ok: false, error: "already_counted" });
    const v = withAlreadyCountedView(again, code);
    if (!v.ok) throw new Error("expected full view");
    expect(v.state).toBe(first.state);
    expect(v.state.resultsEntered).toBe(first.state.resultsEntered);
    expect(v.result.score).toBe(first.result.score);
    expect(v.result.stars).toBe(first.result.stars);
    expect(v.result.tasks).toEqual(tasks);
    expect(v.newStamps).toEqual([]);
    expect(v.newAchievements).toEqual([]);
    expect(v.alreadyCounted).toBe(true);
  });
  it("keeps foreign, malformed and fresh outcomes as they were", () => {
    const s0 = createInitialState();
    const other = createInitialState();
    const foreign = encodeResultCode(other.secrets, "m1", ["right", "right", "right", "pass", "pass"], []);
    for (const raw of [foreign, "garbage", ""]) {
      const a = applyResultCode(s0, raw);
      expect(withAlreadyCountedView(a, raw)).toBe(a);
    }
    const fresh = applyResultCode(s0, encodeResultCode(s0.secrets, "m1", ["right", "right", "right", "pass", "pass"], []));
    expect(withAlreadyCountedView(fresh, "x")).toBe(fresh);
  });
});
