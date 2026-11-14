/**
 * TEST scoring (spec/03 §9, spec/04): questions 10 points each, practical
 * tasks 35 each → total out of 100. A practical task passed on the one
 * allowed rewrite counts in full and is marked as rewritten.
 */
import type { ModuleId, Rank, Stars, TaskOutcomes, TestResult } from "./types";
import { getTest, lessonForTechnique, setNumberOf } from "./content";

export const QUESTION_POINTS = 10;
export const PRACTICAL_POINTS = 35;
export const PASS_SCORE = 70;

export function scoreOf(tasks: TaskOutcomes): number {
  const [q1, q2, q3, p4, p5] = tasks;
  const q = [q1, q2, q3].filter((o) => o === "right").length * QUESTION_POINTS;
  const p = [p4, p5].filter((o) => o === "pass" || o === "rewrite").length * PRACTICAL_POINTS;
  return q + p;
}

/** TEST stars: 90+ → 3, 70+ → 2, 50+ → 1, below 50 → 0. */
export function testStars(score: number): Stars {
  if (score >= 90) return 3;
  if (score >= 70) return 2;
  if (score >= 50) return 1;
  return 0;
}

/** LEARN stars = lessons cleared (L1.3 and the boss together make the third star). */
export function learnStarsFor(c: { l1: boolean; l2: boolean; l3: boolean; boss: boolean }): Stars {
  if (!c.l1) return 0;
  if (!c.l2) return 1;
  return c.l3 && c.boss ? 3 : 2;
}

const BUCKET_BY_STARS: Record<Stars, Rank> = { 0: "none", 1: "bronze", 2: "silver", 3: "gold" };

/** Internal token-table bucket for a score (none/bronze/silver/gold ↔ 0..3 stars). */
export function bucketOf(score: number): Rank {
  return BUCKET_BY_STARS[testStars(score)];
}

/** A module counts as cleared from 70 points (Silver) up. */
export function isPass(score: number): boolean {
  return score >= PASS_SCORE;
}

/** 1-based number of the first failed task (a wrong choice or a failed practical; a rewrite is not a failure), or null. */
export function firstFailedTask(tasks: TaskOutcomes): number | null {
  const i = tasks.findIndex((o, k) => (k < 3 ? o !== "right" : o === "fail"));
  return i < 0 ? null : i + 1;
}

const sentence = (t: string) => t.charAt(0) + t.slice(1).toLowerCase();

/** The first failed task of a module's test with its content and the lesson that teaches its technique (null when nothing failed or no test). */
export function failedPractice(module: ModuleId, tasks: TaskOutcomes) {
  const test = getTest(module);
  const n = firstFailedTask(tasks);
  if (!test || n === null) return null;
  const src = n <= 3 ? test.questions[n - 1]! : test.practical[n - 4]!;
  return { number: n, src, lesson: lessonForTechnique(src.focus) };
}

/** "One thing to practice" as plain strings: the first failed task and the lesson that teaches it. */
export function practiceHint(result: TestResult): { task: string; lesson: string } | null {
  const f = failedPractice(result.module, result.tasks);
  if (!f) return null;
  return {
    task: f.src.title.replace(/\?$/, ""),
    lesson: f.lesson ? `Lesson ${f.lesson.number} · ${sentence(f.lesson.title)}` : `Set ${String(setNumberOf(result.module)).padStart(2, "0")}`,
  };
}
