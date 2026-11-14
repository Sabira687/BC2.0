import { describe, it, expect } from "vitest";
import type { Lesson, ModuleId, TechniqueCode } from "@/lib/types";
import { STEPS } from "@/lib/types";
import {
  ALL_LESSON_IDS,
  MODULES,
  PROJECTS,
  PRO_MOVES,
  TECHNIQUES,
  TONES,
  TESTS,
  getModule,
  getTechnique,
  getTest,
} from "./index";

const MODULE_IDS: ModuleId[] = ["m1", "m2", "m3", "m4", "m5", "m6", "m7", "m8"];
const ALLOWED_PLACEHOLDERS = new Set(["{projectTitle}", "{job}", "{workplace}", "{manager}"]);
const TECHNIQUE_CODES = new Set<string>(TECHNIQUES.map((t) => t.code));
const FORBIDDEN_IN_CHAT_LESSONS = ["dojo", "terminal", "file system", "claude code"];

/** Every string value reachable from a value, recursively. */
function allStrings(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(allStrings);
  if (value && typeof value === "object") return Object.values(value).flatMap(allStrings);
  return [];
}

const LIBRARY = { MODULES, PROJECTS, PRO_MOVES, TECHNIQUES, TONES, ALL_LESSON_IDS, TESTS };

function wordCount(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length;
}

describe("modules", () => {
  it("has m1..m8 in order", () => {
    expect(MODULES.map((m) => m.id)).toEqual(MODULE_IDS);
  });

  it("has the right blocks and run locations", () => {
    expect(MODULES.map((m) => m.block)).toEqual(["Ask", "Ask", "Shape", "Shape", "Verify", "Verify", "Scale", "Scale"]);
    expect(MODULES.map((m) => m.runsIn)).toEqual([
      "console",
      "console",
      "console",
      "console",
      "console",
      "console",
      "claude",
      "claude",
    ]);
  });

  it("teaches the right techniques per module", () => {
    expect(Object.fromEntries(MODULES.map((m) => [m.id, m.techniques]))).toEqual({
      m1: ["1", "2", "3"],
      m2: ["4", "5"],
      m3: ["6", "7"],
      m4: ["8"],
      m5: ["9", "A"],
      m6: ["3"],
      m7: ["B"],
      m8: ["C"],
    });
  });

  it("each module has 4 outline entries with the right ids and non-empty fields", () => {
    for (const m of MODULES) {
      expect(m.outline.map((o) => o.id)).toEqual([`${m.id}.1`, `${m.id}.2`, `${m.id}.3`, `${m.id}.boss`]);
      for (const o of m.outline) {
        expect(o.title.trim()).not.toBe("");
        expect(o.goal.trim()).not.toBe("");
      }
      expect(m.title.trim()).not.toBe("");
      expect(m.teaches.trim()).not.toBe("");
    }
  });

  it("each module has a valid review quiz", () => {
    for (const m of MODULES) {
      expect(m.review.prompt.trim()).not.toBe("");
      expect(m.review.options).toHaveLength(3);
      expect(Number.isInteger(m.review.answer)).toBe(true);
      expect(m.review.answer).toBeGreaterThanOrEqual(0);
      expect(m.review.answer).toBeLessThan(3);
    }
  });

  it("only m1 is written in full", () => {
    for (const m of MODULES) {
      if (m.id === "m1") expect(m.lessons).toBeDefined();
      else expect(m.lessons).toBeUndefined();
    }
  });

  it("getModule finds every module", () => {
    for (const id of MODULE_IDS) expect(getModule(id).id).toBe(id);
  });
});

describe("m1 full lessons", () => {
  const m1 = getModule("m1");
  const lessons: Lesson[] = m1.lessons ?? [];

  it("has 4 lessons matching the outline", () => {
    expect(lessons.map((l) => l.id)).toEqual(["m1.1", "m1.2", "m1.3", "m1.boss"]);
    expect(lessons.map((l) => l.id)).toEqual(m1.outline.map((o) => o.id));
    expect(lessons.map((l) => l.title)).toEqual(m1.outline.map((o) => o.title));
    expect(lessons.map((l) => l.kind)).toEqual(["lesson", "lesson", "lesson", "boss"]);
  });

  it("every step is filled and the brief is at most 100 words", () => {
    for (const l of lessons) {
      for (const s of [l.title, l.mission, l.brief, l.watchMe, l.yourTurn, l.solo, l.check.result]) {
        expect(s.trim()).not.toBe("");
      }
      expect(wordCount(l.brief)).toBeLessThanOrEqual(100);
    }
  });

  it("has a 3-4 item checklist with non-empty items", () => {
    for (const l of lessons) {
      expect(l.check.checklist.length).toBeGreaterThanOrEqual(3);
      expect(l.check.checklist.length).toBeLessThanOrEqual(4);
      for (const item of l.check.checklist) expect(item.trim()).not.toBe("");
    }
  });

  it("has a valid 3-option quiz per lesson", () => {
    for (const l of lessons) {
      expect(l.quiz.prompt.trim()).not.toBe("");
      expect(l.quiz.options).toHaveLength(3);
      expect(Number.isInteger(l.quiz.answer)).toBe(true);
      expect(l.quiz.answer).toBeGreaterThanOrEqual(0);
      expect(l.quiz.answer).toBeLessThan(3);
    }
  });

  it("material: none in L1.1, present and at most 120 words elsewhere", () => {
    for (const l of lessons) {
      if (l.id === "m1.1") {
        expect(l.material).toBeUndefined();
      } else {
        expect(l.material?.trim() ?? "").not.toBe("");
        expect(wordCount(l.material ?? "")).toBeLessThanOrEqual(120);
      }
    }
  });

  it("has hints for all 7 steps with a todo and an answer", () => {
    for (const l of lessons) {
      expect(Object.keys(l.hints).sort()).toEqual([...STEPS].sort());
      for (const step of STEPS) {
        const hint = l.hints[step];
        expect(hint.todo.trim()).not.toBe("");
        expect(hint.answer?.trim() ?? "").not.toBe("");
      }
    }
  });

  it("Your turn has blanks in regular lessons only, and its hint fills them all", () => {
    for (const l of lessons) {
      if (l.kind === "lesson") expect(l.yourTurn).toContain("___");
      else expect(l.yourTurn).not.toContain("___");
      expect(l.hints.yourTurn.answer).not.toContain("___");
      expect(l.hints.solo.answer).not.toContain("___");
    }
  });

  it("solo hint answers contain the full material", () => {
    for (const l of lessons) {
      if (l.material) expect(l.hints.solo.answer).toContain(l.material);
    }
  });

  it("clear hints lead on, and the boss points to the TEST item", () => {
    for (const l of lessons) {
      if (l.kind === "boss") {
        expect(l.hints.clear.todo).toBe("Set done: take the TEST card to get your score.");
        expect(l.hints.clear.answer).toBe("Thanks! I'm ready for the test.");
      } else {
        expect(l.hints.clear.answer).toBe("Next lesson");
      }
    }
  });

  it("credits the right techniques", () => {
    const byId = Object.fromEntries(lessons.map((l) => [l.id, l.techniques]));
    expect(byId).toEqual({ "m1.1": ["1"], "m1.2": ["2"], "m1.3": ["3"], "m1.boss": ["1", "2", "3"] });
  });
});

describe("m1 TEST item", () => {
  const test = getTest("m1");

  it("exists for m1 and belongs to m1", () => {
    expect(test).toBeDefined();
    expect(test?.module).toBe("m1");
    expect(TESTS.m1).toBe(test);
  });

  it("has 3 questions with 3 options, a valid answer and the correct option as the hint answer", () => {
    const questions = test?.questions ?? [];
    expect(questions).toHaveLength(3);
    for (const q of questions) {
      expect(q.prompt.trim()).not.toBe("");
      expect(q.options).toHaveLength(3);
      for (const o of q.options) expect(o.trim()).not.toBe("");
      expect(Number.isInteger(q.answer)).toBe(true);
      expect(q.answer).toBeGreaterThanOrEqual(0);
      expect(q.answer).toBeLessThan(3);
      expect(q.hint.todo.trim()).not.toBe("");
      expect(q.hint.answer).toBe(q.options[q.answer]);
    }
    expect(new Set(questions.map((q) => q.answer)).size).toBeGreaterThan(1);
  });

  it("has 2 practical tasks with 3- and 4-item checklists", () => {
    const practical = test?.practical ?? [];
    expect(practical).toHaveLength(2);
    expect(practical.map((p) => p.checklist.length)).toEqual([3, 4]);
    for (const p of practical) {
      for (const s of [p.title, p.task, p.hint.todo, ...p.checklist]) expect(s.trim()).not.toBe("");
      expect(p.hint.answer?.trim() ?? "").not.toBe("");
    }
    expect(practical.map((p) => p.techniques)).toEqual([
      ["1", "2"],
      ["1", "2", "3"],
    ]);
  });

  it("task 5 has material and its hint answer contains it verbatim", () => {
    const task5 = test?.practical[1];
    const material = task5?.material ?? "";
    expect(material.trim()).not.toBe("");
    expect(wordCount(material)).toBeLessThanOrEqual(90);
    expect(task5?.hint.answer).toContain(`My notes:\n${material}`);
    expect(test?.practical[0].material).toBeUndefined();
  });

  it("hint answers have no blanks and only allowed placeholders", () => {
    const answers = [...(test?.questions ?? []), ...(test?.practical ?? [])].map((t) => t.hint.answer ?? "");
    for (const a of answers) {
      expect(a).not.toContain("___");
      const bad = (a.match(/\{[a-zA-Z]+\}/g) ?? []).filter((p) => !ALLOWED_PLACEHOLDERS.has(p));
      expect(bad).toEqual([]);
    }
  });

  it("uses only valid technique codes", () => {
    for (const p of test?.practical ?? []) {
      for (const code of p.techniques) expect(TECHNIQUE_CODES.has(code)).toBe(true);
    }
  });

  it("no other module has a TEST yet", () => {
    for (const id of MODULE_IDS) if (id !== "m1") expect(getTest(id)).toBeUndefined();
  });
});

describe("chat-only wording in m1-m6", () => {
  it("never mentions the old Claude Code setup", () => {
    const chatModules = MODULES.filter((m) => m.runsIn === "console");
    expect(chatModules.map((m) => m.id)).toEqual(["m1", "m2", "m3", "m4", "m5", "m6"]);
    const texts = allStrings(chatModules).map((s) => s.toLowerCase());
    for (const word of FORBIDDEN_IN_CHAT_LESSONS) {
      expect(texts.filter((s) => s.includes(word))).toEqual([]);
    }
  });
});

describe("techniques", () => {
  it("has 12 techniques with unique codes", () => {
    expect(TECHNIQUES).toHaveLength(12);
    expect(TECHNIQUE_CODES.size).toBe(12);
    for (const t of TECHNIQUES) {
      expect(t.name.trim()).not.toBe("");
      expect(getTechnique(t.code)).toBe(t);
    }
  });

  it("every referenced technique code exists", () => {
    const referenced: TechniqueCode[] = [
      ...MODULES.flatMap((m) => m.techniques),
      ...MODULES.flatMap((m) => (m.lessons ?? []).flatMap((l) => l.techniques)),
      ...PRO_MOVES.map((p) => p.technique),
    ];
    for (const code of referenced) expect(TECHNIQUE_CODES.has(code)).toBe(true);
  });
});

describe("pro moves, tones, projects", () => {
  it("has 7 pro moves with non-empty fields", () => {
    expect(PRO_MOVES).toHaveLength(7);
    for (const p of PRO_MOVES) {
      for (const s of [p.situation, p.move, p.how, p.why]) expect(s.trim()).not.toBe("");
    }
  });

  it("has 3 tones with 4-6 rules each", () => {
    expect(Object.keys(TONES).sort()).toEqual(["game", "mentor", "straight"]);
    for (const [style, tone] of Object.entries(TONES)) {
      expect(tone.style).toBe(style);
      expect(tone.label.trim()).not.toBe("");
      expect(tone.helpTone.trim()).not.toBe("");
      expect(tone.rules.length).toBeGreaterThanOrEqual(4);
      expect(tone.rules.length).toBeLessThanOrEqual(6);
    }
  });

  it("has 3 projects with non-empty fields and additions for m1..m8", () => {
    expect(Object.keys(PROJECTS).sort()).toEqual(["job_switch_kit", "launch_kit", "promotion_kit"]);
    for (const [id, p] of Object.entries(PROJECTS)) {
      expect(p.id).toBe(id);
      for (const s of [p.title, p.pitch, p.defaultJob, p.workplace, p.manager]) {
        expect(s.trim()).not.toBe("");
      }
      for (const mid of MODULE_IDS) {
        expect(p.additions[mid]?.trim() ?? "").not.toBe("");
      }
    }
    expect(PROJECTS.promotion_kit.defaultJob).toBe("office manager");
  });
});

describe("lesson ids", () => {
  it("ALL_LESSON_IDS has 32 unique ids in program order", () => {
    expect(ALL_LESSON_IDS).toHaveLength(32);
    expect(new Set(ALL_LESSON_IDS).size).toBe(32);
    expect(ALL_LESSON_IDS[0]).toBe("m1.1");
    expect(ALL_LESSON_IDS[3]).toBe("m1.boss");
    expect(ALL_LESSON_IDS[31]).toBe("m8.boss");
  });
});

describe("text hygiene", () => {
  const strings = allStrings(LIBRARY);

  it("only allowed placeholders appear", () => {
    const bad = strings.flatMap((s) => s.match(/\{[a-zA-Z]+\}/g) ?? []).filter((p) => !ALLOWED_PLACEHOLDERS.has(p));
    expect(bad).toEqual([]);
  });

  it("no stray braces outside placeholders", () => {
    const leftovers = strings.map((s) => s.replace(/\{[a-zA-Z]+\}/g, "")).filter((s) => /[{}]/.test(s));
    expect(leftovers).toEqual([]);
  });

  it("never mentions the old save flow", () => {
    const lower = strings.map((s) => s.toLowerCase());
    for (const phrase of ["save & exit", "save code", "save your progress", "saving"]) {
      expect(lower.filter((s) => s.includes(phrase))).toEqual([]);
    }
  });

  it("no triple backticks anywhere", () => {
    expect(strings.filter((s) => s.includes("```"))).toEqual([]);
  });
});
