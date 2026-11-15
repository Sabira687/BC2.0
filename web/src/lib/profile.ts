/**
 * Questionnaire model (spec/02): options, demo lock, validation, John's defaults.
 */
import type { Assistant, Goal, Level, Plan, Profile, Reason, Style } from "./types";
import { NAME_MAX, cleanName, parseAge, sanitizeDetail } from "./sanitize";

export interface Option<T extends string> {
  value: T;
  label: string;
  hint?: string;
  /** Selectable in the demo. All options are supported by the generator. */
  enabled: boolean;
}

export const LEVEL_OPTIONS: readonly Option<Level>[] = [
  { value: "chatbot", label: "Only a chatbot, question and answer", enabled: true },
  { value: "tried_agent", label: "I've tried an AI agent", enabled: false },
  { value: "regular_agent", label: "I work with an agent regularly", enabled: false },
];

export const GOAL_OPTIONS: readonly Option<Goal>[] = [
  { value: "everyday", label: "Everyday use", enabled: false },
  { value: "power", label: "Power user", enabled: false },
  { value: "automator", label: "Automator", enabled: true },
  { value: "jarvis", label: "My own Jarvis", enabled: false },
];

export const REASON_OPTIONS: readonly Option<Reason>[] = [
  { value: "grow_job", label: "Grow in my current job", enabled: true },
  { value: "career_switch", label: "Switch careers", enabled: false },
  { value: "own_project", label: "My own project", enabled: false },
];

export const STYLE_OPTIONS: readonly Option<Style>[] = [
  { value: "straight", label: "Straight talk", hint: "Short and to the point", enabled: true },
  { value: "mentor", label: "Mentor", hint: "Calm, explains the why", enabled: true },
  { value: "game", label: "Game on", hint: "More game references", enabled: false },
];

export const ASSISTANT_OPTIONS: readonly Option<Assistant>[] = [
  { value: "claude_chat", label: "Claude Chat", enabled: true },
  { value: "claude_code", label: "Claude Code", enabled: false },
  { value: "chatgpt", label: "ChatGPT", enabled: false },
  { value: "gemini", label: "Gemini", enabled: false },
];

export const PLAN_OPTIONS: readonly Option<Plan>[] = [
  { value: "free", label: "Free", hint: "Projects are limited on Free", enabled: false },
  { value: "pro", label: "Pro", enabled: true },
  { value: "max", label: "Max", enabled: false },
];

export const ASSISTANT_NAMES: Record<Assistant, string> = {
  claude_chat: "Claude",
  claude_code: "Claude Code",
  chatgpt: "ChatGPT",
  gemini: "Gemini",
};

/** Demo user from spec/01 (v2): John, 29, office manager who wants to grow in his job. */
export const JOHN: Profile = Object.freeze({
  name: "John",
  age: 29,
  level: "chatbot",
  goal: "automator",
  reason: "grow_job",
  job: "office manager",
  style: "mentor",
  assistant: "claude_chat",
  plan: "pro",
});

/**
 * Strict name check for the questionnaire: the trimmed, cleaned name, or null when the input is empty,
 * longer than NAME_MAX, or looks like markup (< or >).
 */
export function checkName(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const raw = input.trim();
  if (raw.length > NAME_MAX || /[<>]/.test(raw)) return null;
  return cleanName(raw) || null;
}

/** Name used in greetings; empty becomes "there". */
export function greetingName(name: string): string {
  return cleanName(name) || "there";
}

export type ProfileErrors = Partial<Record<keyof Profile, string>>;
export type ProfileResult = { ok: true; profile: Profile } | { ok: false; errors: ProfileErrors };

function pick<T extends string>(options: readonly Option<T>[], raw: unknown, demoLock: boolean): T | null {
  const opt = options.find((o) => o.value === raw);
  if (!opt) return null;
  if (demoLock && !opt.enabled) return null;
  return opt.value;
}

/**
 * Validate untrusted questionnaire input (form data or stored JSON).
 * With `demoLock`, options marked `enabled: false` are rejected, and everything except the style
 * is pinned to the demo values (name, job and age are taken from JOHN).
 */
export function validateProfile(input: unknown, { demoLock = false }: { demoLock?: boolean } = {}): ProfileResult {
  const r = (typeof input === "object" && input !== null ? input : {}) as Record<string, unknown>;
  const errors: ProfileErrors = {};

  const name = demoLock ? JOHN.name : checkName(r.name);
  if (!name) errors.name = "Enter a name (letters only, up to 24).";
  const age = demoLock ? JOHN.age : parseAge(r.age);
  if (age === null) errors.age = "Enter an age from 16 to 99.";
  const level = pick(LEVEL_OPTIONS, r.level, demoLock);
  if (!level) errors.level = "Choose your current level.";
  const goal = pick(GOAL_OPTIONS, r.goal, demoLock);
  if (!goal) errors.goal = "Choose a goal.";
  const reason = pick(REASON_OPTIONS, r.reason, demoLock);
  if (!reason) errors.reason = "Choose why you are learning.";
  const style = pick(STYLE_OPTIONS, r.style, demoLock);
  if (!style) errors.style = "Choose a learning style.";
  const assistant = pick(ASSISTANT_OPTIONS, r.assistant, demoLock);
  if (!assistant) errors.assistant = "Choose an assistant.";
  const plan = pick(PLAN_OPTIONS, r.plan, demoLock);
  if (!plan) errors.plan = "Choose a plan.";

  if (Object.keys(errors).length > 0 || !name || !age || !level || !goal || !reason || !style || !assistant || !plan) {
    return { ok: false, errors };
  }
  return {
    ok: true,
    profile: { name, age, level, goal, reason, job: demoLock ? JOHN.job : sanitizeDetail(r.job), style, assistant, plan },
  };
}
