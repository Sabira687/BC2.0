/**
 * Player-facing names for internal ids (pure): "m1" → "Set 01", "m1.1" → "Lesson 1.1", "m1.boss" → "Final".
 * Internal ids never appear in Claude's replies; old transcripts that still carry them are mapped back by the parsers.
 */
import type { LessonId, ModuleId } from "./types";

export function setLabel(module: ModuleId): string {
  return `Set ${module.slice(1).padStart(2, "0")}`;
}

export function lessonLabel(id: LessonId): string {
  const [m, part] = id.split(".") as [string, string];
  return part === "boss" ? "Final" : `Lesson ${m.slice(1)}.${part}`;
}

/** "Set 01 · Lesson 1.1" / "Set 01 · Final": the lesson position as printed in the status line. */
export function lessonPosition(id: LessonId): string {
  return `${setLabel(id.split(".")[0] as ModuleId)} · ${lessonLabel(id)}`;
}

const NUMBER_WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven"];

/** "three short lessons and a final task": the one wording for a set's size (Start greeting, item texts). */
export function lessonsPhrase(lessons: number, hasFinal = true): string {
  const n = NUMBER_WORDS[lessons] ?? String(lessons);
  return `${n} short lessons${hasFinal ? " and a final task" : ""}`;
}
