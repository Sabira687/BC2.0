/**
 * Result screen view models (pure): what Claude checked per task, the one
 * thing to practice, the summary line, the star timeline and the next skills.
 * All wording comes from the TEST content; nothing is invented here.
 */
import type { ApplyResult } from "./progress";
import type { AppState, ModuleId, PracticalOutcome, QuestionOutcome, Stars, TaskOutcomes } from "./types";
import { MODULES, setNumberOf, tierOfSet, getModule, getTest, itemFor } from "./content";
import { MODULE_IDS } from "./tokens";
import { PRACTICAL_POINTS, QUESTION_POINTS, failedPractice, firstFailedTask, isPass } from "./scoring";
import { lessonForTechnique, techniqueInfo } from "./progressview";
import type { LessonRef } from "./content";
import { ACHIEVEMENTS } from "./progress";
import { setSky } from "./sky";

export interface TaskCheck {
  /** 1..5 */
  n: number;
  type: "CHOICE" | "PRACTICE";
  title: string;
  ok: boolean;
  mark: "✔" | "✘";
  /** Extra note, e.g. "passed on rewrite". */
  label?: string;
  points: number;
  max: number;
  /** Short content line for the outcome. */
  line: string;
}

export function taskChecks(module: ModuleId, tasks: TaskOutcomes): TaskCheck[] {
  const test = getTest(module);
  if (!test) return [];
  const out: TaskCheck[] = [];
  test.questions.forEach((q, i) => {
    const o: QuestionOutcome = tasks[i] as QuestionOutcome;
    const ok = o === "right";
    out.push({ n: i + 1, type: "CHOICE", title: q.title, ok, mark: ok ? "✔" : "✘", points: ok ? QUESTION_POINTS : 0, max: QUESTION_POINTS, line: q.feedback[o] });
  });
  test.practical.forEach((p, i) => {
    const o: PracticalOutcome = tasks[3 + i] as PracticalOutcome;
    const ok = o !== "fail";
    out.push({
      n: 4 + i,
      type: "PRACTICE",
      title: p.title,
      ok,
      mark: ok ? "✔" : "✘",
      ...(o === "rewrite" ? { label: "passed on rewrite" } : {}),
      points: ok ? PRACTICAL_POINTS : 0,
      max: PRACTICAL_POINTS,
      line: p.feedback[o],
    });
  });
  return out;
}

export interface PracticeHint {
  taskNumber: number;
  text: string;
  lesson: LessonRef | null;
}

/** The first failed task with the content hint and the lesson that teaches its technique (scoring.practiceHint is the plain-string form of the same data). */
export function practiceDetail(module: ModuleId, tasks: TaskOutcomes): PracticeHint | null {
  const f = failedPractice(module, tasks);
  return f ? { taskNumber: f.number, text: f.src.practice, lesson: f.lesson } : null;
}

export function resultSummary(score: number): string {
  return isPass(score)
    ? "You passed. The skill counts from 70, and 90 or more makes your Test card holographic."
    : "Not yet. The skill counts from 70. Go through the Learn card again, then take the Test once more.";
}

/** Delays (ms from mount) at which each star lights; reduced motion lights them all at once. */
export function starTimeline(stars: Stars, reduced: boolean): number[] {
  return Array.from({ length: stars }, (_, i) => (reduced ? 0 : 350 * (i + 1)));
}

export function litStarsAt(timeline: number[], elapsedMs: number): number {
  return timeline.filter((t) => t <= elapsedMs).length;
}

/** The next (up to two) sets after the module, for the "Your next skill" block. */
export function nextSkills(module: ModuleId): { module: ModuleId; label: string }[] {
  const i = MODULE_IDS.indexOf(module);
  return MODULE_IDS.slice(i + 1, i + 3).map((m) => ({ module: m, label: `Set ${m.slice(1).padStart(2, "0")} · ${MODULES.find((x) => x.id === m)?.title ?? getModule(m).title}` }));
}

export interface NextSkillCta {
  title: string;
  sub: string;
}

/** Text of the "Your next skill" block: free sets say "free at launch", the demo ends at Set 01 (even with Premium test mode). */
export function nextSkillCta(module: ModuleId, cleared: boolean): NextSkillCta {
  const n = module.slice(1).padStart(2, "0");
  if (!cleared) return { title: `Finish Set ${n} first`, sub: "Get 70 or more on this Test to count the skill. Then the next sets follow." };
  const next = nextSkills(module);
  if (next.length === 0) return { title: "You have reached the last set", sub: "More skills are on the way." };
  const names = next.map((x) => x.label).join(" or ");
  const premium = next.every((x) => tierOfSet(setNumberOf(x.module)) === "premium");
  return {
    title: `Choose ${names}`,
    sub: premium ? `${names.replace(" or ", " and ")} — Premium paths, arriving at launch.` : `${names} — free at launch; this demo ends at Set ${n}.`,
  };
}

/** The stored Set 01 TEST result as a Result-screen model (for the demo fast-forward), or null when there is none. */
export function demoResultView(state: AppState): Extract<ApplyResult, { ok: true }> | null {
  const result = state.results.m1;
  if (!result) return null;
  return { ok: true, state, result, previousBest: null, newStamps: [...result.techniques], isBest: true, cleared: result.score >= 70, unlocked: [], newAchievements: [] };
}

// ───────────────────────── The TEST COMPLETE frame (as Claude prints it) ─────────────────────────

const FRAME_W = 44;
const TITLE_W = 31;

export interface TestCompleteFrame {
  /** The ━ frame, one string per line (no marker lines). */
  lines: string[];
  /** The machine marker line printed under the frame. */
  marker: string;
}

/** The result frame Claude prints at the end of a TEST, rebuilt from the decoded outcomes and the test content. Empty when the set has no written test. */
export function testCompleteFrame(module: ModuleId, tasks: TaskOutcomes, score: number, stars: Stars): TestCompleteFrame {
  const checks = taskChecks(module, tasks);
  if (checks.length === 0) return { lines: [], marker: "" };
  const R = "━".repeat(FRAME_W);
  const fit = (t: string) => (t.length > TITLE_W - 1 ? `${t.slice(0, TITLE_W - 2)}…` : t);
  const rows = checks.map((c) => ` ${c.n}  ${fit(c.title).padEnd(TITLE_W)}${c.ok ? "✓" : "✗"} ${String(c.points).padStart(2)}/${c.max}${c.label ? ` ${c.label}` : ""}`);
  const starText = "★".repeat(stars) + "☆".repeat(3 - stars);
  const left = ` SCORE  ${score}/100`;
  const row = (left: string, right: string) => left + " ".repeat(Math.max(1, 42 - left.length - right.length)) + right;
  return {
    lines: [R, ` TEST COMPLETE · ${itemFor(module, "test").name.toUpperCase()}`, R, ...rows, "─".repeat(FRAME_W), row(left, starText), R],
    marker: `TEST COMPLETE · ${starText} · ${score}/100`,
  };
}

// ───────────────────────── Reading animation and chips ─────────────────────────

/** How long "READING CODE_" shows before the result appears; reduced motion skips it. */
export function readingDelayMs(reduced: boolean): number {
  return reduced ? 0 : 900;
}

export interface ResultChip {
  tone: "gold" | "green" | "blue";
  text: string;
}

/** Chips under the score, from the real state: constellation complete, one "+ STAMP" per new stamp, one "MILESTONE" per new achievement. */
export function resultChips(r: Extract<ApplyResult, { ok: true }>): ResultChip[] {
  const out: ResultChip[] = [];
  if (setSky(r.state, r.result.module).complete) out.push({ tone: "gold", text: "CONSTELLATION COMPLETE" });
  for (const c of r.newStamps) out.push({ tone: "green", text: `+ STAMP · ${techniqueInfo(c).short.toUpperCase()}` });
  for (const a of r.newAchievements) out.push({ tone: "blue", text: `MILESTONE · ${ACHIEVEMENTS[a].title.toUpperCase()}` });
  return out;
}
