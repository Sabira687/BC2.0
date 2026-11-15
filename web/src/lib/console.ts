/**
 * Console helpers (pure): read where the player is from Claude's replies and
 * pick the matching hint from the library (lesson steps and test tasks).
 *
 * Source of truth is the status line Claude prints at the end of every reply:
 *   ▮ LEARN · P7K3Q · Set 01 · Lesson 1.2 Ask for the Shape · step 4/7 Your turn   (final: "Set 01 · Final <title>")
 *   ▮ TEST · P7K3Q · Set 01 · task 4/5 · score 30/100
 * The older internal-id form (`m1.2 …`, `m1 · task …`) is still read, so stored transcripts keep working.
 * Parsing is tolerant (the bar glyph, spacing and case vary between replies).
 */
/** Small honest line under the terminal header (Lesson and Work chat views). */
export const API_KEY_NOTE = "The live AI in this demo console runs on our API key — for the demo only. In the real app, lessons run on your own AI.";
/** Plaque above the "Not sure what to write?" panel. */
export const DEMO_HELPER_NOTE = "DEMO HELPER · ready answers let you try the full path in minutes. In the real app you write your own.";

import type { AppState, Hint, LessonId, ModuleId } from "./types";
import { STEPS } from "./types";
import type { ChatMessage } from "./chat";
import { getModule, getTest } from "./content";
import { DATA_OPEN } from "./encode";
import { STEP_LABELS, fillPlaceholders } from "./generator";
import { buildProgram } from "./program";

export type LessonStatus = { kind: "learn"; playerId: string; lesson: LessonId; module: ModuleId; step: number };
export type TestStatus = { kind: "test"; playerId: string; module: ModuleId; task: number; score: number };
export type Status = LessonStatus | TestStatus;

const LEARN_RE =
  /LEARN\s*·\s*([A-Z0-9]{5})\s*·\s*(?:(m[1-8]\.(?:[1-3]|boss))\b|set\s*0?([1-8])\s*·\s*(?:lesson\s*\3\.([1-3])|(final))\b)[^\n]*?step\s*(\d)\s*\/\s*7/gi;
const TEST_RE = /TEST\s*·\s*([A-Z0-9]{5})\s*·\s*(?:(m[1-8])|set\s*0?([1-8]))\b[^\n]*?task\s*(\d)\s*\/\s*5(?:[^\n]*?score\s*(\d{1,3}))?/gi;

/** Last LEARN or TEST status line in a reply, or null. */
export function parseStatus(text: string): Status | null {
  const tail = text.slice(-4000);
  let best: { index: number; status: Status } | null = null;
  for (const m of tail.matchAll(LEARN_RE)) {
    const step = Number(m[6]);
    if (step > 7) continue;
    const lesson = (m[2] ? m[2].toLowerCase() : m[5] ? `m${m[3]}.boss` : `m${m[3]}.${m[4]}`) as LessonId;
    if (!best || m.index! >= best.index)
      best = { index: m.index!, status: { kind: "learn", playerId: m[1]!.toUpperCase(), lesson, module: lesson.split(".")[0] as ModuleId, step } };
  }
  for (const m of tail.matchAll(TEST_RE)) {
    const task = Number(m[4]);
    if (task > 5) continue;
    if (!best || m.index! >= best.index)
      best = { index: m.index!, status: { kind: "test", playerId: m[1]!.toUpperCase(), module: (m[2] ? m[2].toLowerCase() : `m${m[3]}`) as ModuleId, task, score: Number(m[5] ?? 0) } };
  }
  return best?.status ?? null;
}

const RESULT_CODE_RE = /SV1-[A-Z0-9]{5}(?:-[A-Z0-9]{3}){7,20}/gi;

/** Last result code printed in a reply, or null. */
export function findResultCode(text: string): string | null {
  const all = text.match(RESULT_CODE_RE);
  return all ? all[all.length - 1]!.toUpperCase() : null;
}

/** Which item a pasted message contains, by its visible header. */
export function itemKindOf(text: string): "learn" | "test" | "help" | null {
  if (!text.includes(DATA_OPEN)) return null;
  if (text.includes("AIGO ░ LEARN")) return "learn";
  if (text.includes("AIGO ░ TEST")) return "test";
  if (text.includes("AIGO ░ HELP")) return "help";
  return null;
}

export type ConsoleHint = Hint & {
  /** What the console can do for the player at this point. */
  action?: "insert_learn" | "insert_test" | "apply_result";
  /** Result code found in the last reply (for action "apply_result"). */
  resultCode?: string;
  /** Status parsed from the last reply, for display. */
  status?: Status;
};

const GENERIC: Record<(typeof STEPS)[number], Hint> = {
  mission: { todo: "Read the mission and tell Claude you're ready.", answer: "Ready. Let's go." },
  brief: { todo: "Read the short explanation, then ask Claude to show you.", answer: "Makes sense. Show me." },
  watchMe: { todo: "Compare the weak and the strong request, then try it yourself.", answer: "Got it. Let me try." },
  yourTurn: { todo: "Fill in the blanks in Claude's request and send it." },
  solo: { todo: "Write the whole request yourself for the new task." },
  check: { todo: "Read Claude's check. If something is missing, fix your request and send it again.", answer: "Thanks, that's clear. What's next?" },
  clear: { todo: "Lesson cleared! Go on to the next one.", answer: "Next lesson" },
};

function lastOf(messages: readonly ChatMessage[], role: ChatMessage["role"]): ChatMessage | undefined {
  for (let i = messages.length - 1; i >= 0; i--) if (messages[i]!.role === role) return messages[i];
  return undefined;
}

function learnHint(s: LessonStatus, reply: string, lastUser: string | undefined, f: (x: string) => string): ConsoleHint {
  if (s.step === 0) return { todo: "Tell Claude to start the lesson.", answer: "Yes, let's start.", status: s };
  const key = STEPS[s.step - 1]!;
  const lesson = getModule(s.module).lessons?.find((l) => l.id === s.lesson);

  // A failed check (any ✘): the way forward is a fixed Solo prompt.
  if (key === "check" && reply.includes("✘")) {
    const solo = lesson?.hints.solo.answer;
    return { todo: "Something is still missing. Send a fixed request that covers every point.", answer: solo ? f(solo) : undefined, status: s };
  }
  const base = lesson?.hints[key] ?? GENERIC[key];
  const answer = base.answer ? f(base.answer) : undefined;
  // Claude stays on the same step after answering the player's prompt: don't
  // offer the same answer twice, offer to move on instead.
  if (answer && lastUser === answer.trim() && s.step < 7) {
    const next = STEP_LABELS[STEPS[s.step]!];
    return { todo: `Claude answered your prompt. Read it, then move on to ${next}.`, answer: `Continue to ${next}.`, status: s };
  }
  // Module done: point to the TEST item.
  if (key === "clear" && s.lesson.endsWith(".boss") && getTest(s.module)) {
    return { todo: f(base.todo), answer, status: s, action: "insert_test" };
  }
  return { todo: f(base.todo), answer, status: s };
}

function testHint(s: TestStatus, reply: string, f: (x: string) => string): ConsoleHint {
  const test = getTest(s.module);
  if (s.task === 0 || !test) return { todo: "Tell Claude to start the test.", answer: "Yes, start the test.", status: s };
  if (s.task <= 3) {
    const q = test.questions[s.task - 1]!;
    return { todo: f(q.hint.todo), answer: q.hint.answer ? f(q.hint.answer) : undefined, status: s };
  }
  const p = test.practical[s.task - 4]!;
  const answer = p.hint.answer ? f(p.hint.answer) : undefined;
  if (reply.includes("✘") && /rewrite/i.test(reply)) {
    return { todo: "This task didn't pass yet. You can rewrite it once: send a request that covers every point.", answer, status: s };
  }
  return { todo: f(p.hint.todo), answer, status: s };
}

/**
 * Hint for the current moment of the conversation.
 * `pending` = a reply is streaming; the hint then just says to wait.
 */
export function hintFor(state: AppState, messages: readonly ChatMessage[], pending = false): ConsoleHint {
  if (pending) return { todo: "Claude is replying…" };
  const kinds = messages.filter((m) => m.role === "user").map((m) => itemKindOf(m.content));
  if (!kinds.includes("learn") && !kinds.includes("test")) {
    if (kinds.includes("help")) {
      return { todo: "Help is a one-time tip: read Claude's tip above, then keep chatting as usual. To start a lesson, press “Load my Learn card”.", action: "insert_learn" };
    }
    return { todo: "Press “Load my Learn card” to start your lesson (or load your Test card to take the test).", action: "insert_learn" };
  }
  const reply = lastOf(messages, "assistant");
  if (!reply || messages[messages.length - 1]?.role === "user") {
    // Not streaming and the last word is ours: the request failed or was stopped.
    return { todo: "Claude hasn't answered yet. Press Retry, or send your message again." };
  }

  const code = findResultCode(reply.content);
  if (code) {
    return { todo: "Test complete! Press “Add my result to my collection” to keep your stars and stamps.", action: "apply_result", resultCode: code };
  }

  const status = parseStatus(reply.content);
  if (!status) return { todo: "Answer Claude in your own words." };

  const program = buildProgram(state.profile, state.results, state.subscription.active);
  const f = (s: string) => fillPlaceholders(s, program.project, state.profile);
  if (status.kind === "test") return testHint(status, reply.content, f);
  return learnHint(status, reply.content, lastOf(messages, "user")?.content.trim(), f);
}

// ───────────────────────── Plain-language display ─────────────────────────

/** The brief formula in everyday words (hint panel reminder). */
export const PLAIN_CHECKLIST = ["Who you are and where you work", "What you need from Claude", "How the result should look"] as const;

export interface FriendlyProgress {
  /** e.g. "Lesson 1.1 · step 4 of 7" or "Test · question 2 of 5". */
  label: string;
  /** e.g. "Your turn". */
  detail: string;
  value: number;
  max: number;
}

/** Last status in the conversation (from Claude's replies), or null. */
export function lastStatus(messages: readonly ChatMessage[]): Status | null {
  const reply = lastOf(messages, "assistant");
  return reply ? parseStatus(reply.content) : null;
}

/** Status line → words a non-technical player understands, plus a bar value. */
export function friendlyProgress(s: Status): FriendlyProgress {
  if (s.kind === "test") {
    const n = s.module.slice(1);
    if (s.task === 0) return { label: `Set ${n} test · getting started`, detail: "", value: 0, max: 5 };
    const what = s.task <= 3 ? "question" : "task";
    return { label: `Set ${n} test · ${what} ${s.task} of 5`, detail: `Score so far: ${s.score}`, value: s.task, max: 5 };
  }
  const [m, part] = s.lesson.split(".") as [string, string];
  const lesson = part === "boss" ? `Set ${m.slice(1)} · final challenge` : `Lesson ${m.slice(1)}.${part}`;
  if (s.step === 0) return { label: `${lesson} · getting started`, detail: "", value: 0, max: 7 };
  return { label: `${lesson} · step ${s.step} of 7`, detail: STEP_LABELS[STEPS[s.step - 1]!], value: s.step, max: 7 };
}

/** Message text for display: the LEARN/TEST status line is removed (the UI shows friendly progress instead). */
export function displayText(text: string): string {
  return text
    .split("\n")
    .filter((line) => !/^[^\p{L}\p{N}]*(LEARN|TEST)\s*·\s*[A-Z0-9]{5}\s*·.*(step\s*\d\s*\/\s*7|task\s*\d\s*\/\s*5)/iu.test(line))
    .join("\n")
    .trimEnd();
}
