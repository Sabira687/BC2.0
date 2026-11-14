/**
 * Shared domain types for AIGO.
 * Everything here is plain data: no React, no browser APIs.
 */

// ───────────────────────── Questionnaire / profile ─────────────────────────

export type Level = "chatbot" | "tried_agent" | "regular_agent";
export type Goal = "everyday" | "power" | "automator" | "jarvis";
export type Reason = "career_switch" | "grow_job" | "own_project";
export type Style = "straight" | "mentor" | "game";
export type Assistant = "claude_chat" | "claude_code" | "chatgpt" | "gemini";
export type Plan = "free" | "pro" | "max";

export interface Profile {
  /** Display name, already sanitized (see sanitize.ts). */
  name: string;
  age: number;
  level: Level;
  goal: Goal;
  reason: Reason;
  /** Current job, e.g. "office manager". Used in examples. Sanitized. May be empty. */
  job: string;
  style: Style;
  assistant: Assistant;
  plan: Plan;
}

// ───────────────────────── Content library ─────────────────────────

/** Technique codes from spec/03 §9 (v2, Claude Chat). */
export type TechniqueCode = "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "A" | "B" | "C";

export type ModuleId = "m1" | "m2" | "m3" | "m4" | "m5" | "m6" | "m7" | "m8";
/** "m1.1".."m1.3" for lessons, "m1.boss" for the module's Boss. */
export type LessonId = `${ModuleId}.${1 | 2 | 3 | "boss"}`;

export type Block = "Ask" | "Shape" | "Verify" | "Scale";

export interface Technique {
  code: TechniqueCode;
  name: string;
}

/** A multiple-choice question shown with Claude Code's options UI. */
export interface Quiz {
  prompt: string;
  options: string[]; // 3 options
  answer: number; // index of the correct option
}

/** The 7 lesson steps (spec/03 §3). Index + 1 = step number in the status line. */
export const STEPS = ["mission", "brief", "watchMe", "yourTurn", "solo", "check", "clear"] as const;
export type StepKey = (typeof STEPS)[number];

/** Hint panel content for one step: what to do now + a ready answer to copy. */
export interface Hint {
  /** One line: what the player should do right now. */
  todo: string;
  /** Ready-to-send message (copied into the console). Absent = nothing to send. */
  answer?: string;
}

/**
 * A fully written lesson (only m1 in the demo).
 * Strings may contain placeholders resolved by the generator:
 *   {projectTitle} {job} {workplace} {manager}
 */
export interface Lesson {
  id: LessonId;
  title: string;
  kind: "lesson" | "boss";
  mission: string; // 🎯 one line
  brief: string; // 🧠 ≤100 words
  watchMe: string; // 👀 weak ask → weak answer vs strong ask → strong answer
  yourTurn: string; // 🛠 prompt with ___ blanks
  solo: string; // 🎮 new task, whole prompt alone
  /** Raw material the player works with (notes etc.), if the lesson needs it. */
  material?: string;
  check: {
    /** Checklist the AI applies to the player's Solo prompt. All items must be present. */
    checklist: string[];
    /** What the AI checks in the produced result. */
    result: string;
  };
  /** Review question for "Previously on…". */
  quiz: Quiz;
  /** Techniques credited when the player actually does Your turn / Solo. */
  techniques: TechniqueCode[];
  /** Hint panel content per step. */
  hints: Record<StepKey, Hint>;
}

export interface LessonOutline {
  id: LessonId;
  title: string;
  goal: string;
}

export interface Module {
  id: ModuleId;
  title: string;
  block: Block;
  teaches: string;
  /** Where the module runs: the AIGO console, or real Claude (Projects, Artifacts). */
  runsIn: "console" | "claude";
  techniques: TechniqueCode[];
  /** One-line card flavor text per item kind. */
  flavor?: { learn: string; test: string };
  /** Full lessons (m1) — when present, used instead of outline. */
  lessons?: Lesson[];
  /** Outline for modules that are not written in full: 3 lessons + boss. */
  outline: LessonOutline[];
  /** Question used for "Previously on…" when this module was the last one worked on. */
  review: Quiz;
}

export type ProjectId = "promotion_kit" | "job_switch_kit" | "launch_kit";

export interface Project {
  id: ProjectId;
  title: string;
  pitch: string; // one line: what it is and why it matters to the player
  /** Example setting used in lessons and hint answers when the player gives no job. */
  defaultJob: string; // e.g. "office manager"
  workplace: string; // e.g. "a mid-size logistics company"
  manager: string; // e.g. "my manager, Sarah"
  /** What each module adds to the project. */
  additions: Partial<Record<ModuleId, string>>;
}

export interface ToneBlock {
  style: Style;
  label: string;
  /** Rules for how the AI talks (inserted in LEARN). */
  rules: string[];
  /** Short line for HELP's tone. */
  helpTone: string;
}

export interface ProMove {
  situation: string; // "If the conversation shows…"
  move: string; // what to do
  how: string; // exact command / prompt
  why: string; // one line
  technique: TechniqueCode;
}

// ───────────────────────── Program (generator output) ─────────────────────────

export type ModuleStatus = "done" | "current" | "upcoming" | "skipped" | "locked";
/** done = TEST passed (70+). */

export interface ProgramModule {
  module: Module;
  status: ModuleStatus;
}

export interface Program {
  modules: ProgramModule[];
  project: Project;
  tone: ToneBlock;
  /** The module to work on next (first not yet passed from the start module), or null when all are passed. */
  current: ModuleId | null;
  watchMe: "always" | "on_request";
  taskSize: "compact" | "full";
  /** Modules that need a paid AIGO subscription (everything after the start module when not subscribed). */
  locked: ModuleId[];
}

// ───────────────────────── TEST item (spec/03 §9) ─────────────────────────

export interface TestQuestion extends Quiz {
  /** Short name of the question, shown on the result screen. */
  title: string;
  /** The technique this question checks (maps to the lesson that teaches it). */
  focus: TechniqueCode;
  /** "One thing to practice" line shown when the question is missed. */
  practice: string;
  /** One short line per outcome, shown on the result screen. */
  feedback: Record<QuestionOutcome, string>;
  /** Hint panel: what to do + the correct option text as the ready answer. */
  hint: Hint;
}

export interface PracticalTask {
  title: string;
  /** What the player must write (one or two sentences). */
  task: string;
  /** Raw material given with the task, if any. */
  material?: string;
  /** Every item must be present for a pass. */
  checklist: string[];
  /** Techniques shown by a passed task. */
  techniques: TechniqueCode[];
  /** The technique to revisit when the task fails (maps to the lesson that teaches it). */
  focus: TechniqueCode;
  /** "One thing to practice" line shown when the task fails. */
  practice: string;
  /** One short line per outcome, shown on the result screen. */
  feedback: Record<PracticalOutcome, string>;
  /** Hint panel: what to do + a complete prompt that passes. */
  hint: Hint;
}

/** A module test: 3 multiple-choice questions + 2 practical prompt tasks. */
export interface ModuleTest {
  module: ModuleId;
  questions: [TestQuestion, TestQuestion, TestQuestion];
  practical: [PracticalTask, PracticalTask];
}

/** Per-task outcome. Questions: right/wrong. Practical: pass / pass on the one allowed rewrite / fail. */
export type QuestionOutcome = "right" | "wrong";
export type PracticalOutcome = "pass" | "rewrite" | "fail";
export type TaskOutcomes = [QuestionOutcome, QuestionOutcome, QuestionOutcome, PracticalOutcome, PracticalOutcome];

/** Internal score bucket used by the token table (stored token compatibility). Not shown to players. */
export type Rank = "none" | "bronze" | "silver" | "gold";

/** Stars shown to players: TEST score and LEARN progress both map to 0..3. */
export type Stars = 0 | 1 | 2 | 3;

/** Stamp book entries: a technique shown in a passed TEST, or the gifted "player_one". */
export type StampId = TechniqueCode | "player_one";

// ───────────────────────── Result tokens ─────────────────────────

/** Secret tokens for one module's TEST. Every value is a unique 3-char token. */
export interface ModuleTestTokens {
  /** Identifies the test (always the first token after the player ID). */
  test: string;
  /** Questions 1–3: [right, wrong]. */
  questions: [[string, string], [string, string], [string, string]];
  /** Practical tasks 4–5: pass / rewrite / fail. */
  practical: [Record<PracticalOutcome, string>, Record<PracticalOutcome, string>];
  /** Score bucket (consistency check against the per-task tokens). */
  bucket: Record<Rank, string>;
}

export interface TokenTable {
  modules: Record<ModuleId, ModuleTestTokens>;
  tech: Record<TechniqueCode, string>;
}

export interface PlayerSecrets {
  playerId: string; // 5 chars, visible in item headers
  tokens: TokenTable;
}

// ───────────────────────── Progress / app state ─────────────────────────

export interface TestResult {
  module: ModuleId;
  tasks: TaskOutcomes;
  score: number; // 0..100
  /** Derived from score (testStars), never trusted from storage. */
  stars: Stars;
  techniques: TechniqueCode[];
  at: string; // ISO timestamp
}

/** LEARN and TEST items exist per module; HELP is one for everyone. */
export type ItemKind = "learn" | "test" | "help";
export type ItemId = `learn:${ModuleId}` | `test:${ModuleId}` | "help";

export interface AppState {
  version: 4;
  profile: Profile;
  secrets: PlayerSecrets;
  /** Items the player has created (unlocked) in the collection. */
  created: ItemId[];
  /** Best TEST result per module. */
  results: Partial<Record<ModuleId, TestResult>>;
  /** Number of result codes counted (for achievements/quests). */
  resultsEntered: number;
  /** Demo subscription (simulated upgrade, no payment). */
  subscription: { active: boolean; since: string | null };
  collectionViewed: boolean;
  /** Normalized result codes already counted (bounded). */
  countedCodes: string[];
  /** Best LEARN stars per module (lessons cleared: L1 → 1, L2 → 2, L3 + boss → 3). Only goes up. */
  learnStars: Partial<Record<ModuleId, Stars>>;
  /** Stamp book: verified techniques, plus the gifted "player_one". A set (no duplicates). */
  stamps: StampId[];
  /** HELP was used at least once. */
  helpUsed: boolean;
  /** Demo fast-forward was used (the filled progress went through the real result-code path). */
  demo: { fastForwarded: boolean };
}

export type AchievementId = "player_one" | "first_test" | "set_clear";
export type QuestId = 0 | 1 | 2 | 3;
