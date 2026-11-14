/**
 * "Peek inside": a safe, whitelisted description of what an item contains and how it is tuned for the player.
 * It is built from content structure, tone rules and profile fields, never by decoding or stripping the item text.
 * It must never expose result tokens, correct answers, hint answers or a result code (see peek.test.ts).
 */
import type { AppState, Goal, ItemId, Style } from "./types";
import { TONES, getModule } from "./content";
import { jobOf } from "./generator";
import { buildProgram } from "./program";
import { kindOf, moduleOfItem } from "./progress";
import { lessonLabel } from "./labels";
import { sanitizeName } from "./sanitize";
import { PRACTICAL_POINTS, QUESTION_POINTS } from "./scoring";

export interface PeekSection {
  title: string;
  lines: string[];
}

export interface PeekModel {
  tunedFor: { label: string; value: string }[];
  sections: PeekSection[];
  styleDiff: { mentor: string[]; straight: string[] } | null;
  sizeKb: number;
}

const GOAL_LABEL: Record<Goal, string> = {
  everyday: "Everyday use",
  power: "Power user",
  automator: "Automator",
  jarvis: "My own Jarvis",
};

const MARKERS = ["▶ ITEM ACTIVATED", "✅ CHECK PASSED", "✦ STAMP EARNED", "▮ LEARN status line"];

function styleDiff(kind: "learn" | "test" | "help"): { mentor: string[]; straight: string[] } {
  const pick = (s: Style) => (kind === "help" ? [TONES[s].helpTone] : [...TONES[s].rules]);
  return { mentor: pick("mentor"), straight: pick("straight") };
}

/** `textLength`: length of the real item text the page already has (for the size line only). */
export function peekItem(state: AppState, id: ItemId, textLength: number): PeekModel {
  const kind = kindOf(id);
  const module = moduleOfItem(id);
  const { profile } = state;
  const program = buildProgram(profile, state.results, state.subscription.active);
  const tunedFor = [
    { label: "Name", value: sanitizeName(profile.name) },
    { label: "Style", value: TONES[profile.style].label },
    { label: "Goal", value: GOAL_LABEL[profile.goal] },
    { label: "Work", value: jobOf(profile, program.project) },
    { label: "Project", value: program.project.title },
    ...(module ? [{ label: "Set", value: `Set ${module.slice(1).padStart(2, "0")} · ${getModule(module).title}` }] : []),
  ];

  const sections: PeekSection[] = [];
  if (kind === "learn" && module) {
    const mod = getModule(module);
    const lessons = mod.lessons && mod.lessons.length > 0 ? mod.lessons : null;
    sections.push({
      title: "LESSON PROGRAM",
      lines: lessons
        ? lessons.map((l) => `${lessonLabel(l.id)} ${l.kind === "boss" ? "Final: " : ""}${l.title}`)
        : mod.outline.map((o) => `${lessonLabel(o.id)} ${o.title}`),
    });
    sections.push({ title: "EVERY LESSON, 7 STEPS", lines: ["Mission → Brief → Watch me → Your turn → Solo → Check → Clear"] });
    sections.push({
      title: "WHAT CLAUDE CHECKS",
      lines: lessons
        ? lessons.filter((l) => l.kind !== "boss").map((l) => `${lessonLabel(l.id)}: ${l.check.checklist.length} points in your message, e.g. ${l.check.checklist[0]!.split(":")[0]!.toLowerCase()}`)
        : ["A checklist per lesson, verified in the chat"],
    });
    sections.push({ title: "REPLY FORMAT", lines: ["Terminal frames: ┌─ TITLE … └───", "Step header with a progress bar", "Choices as [1] … [2] …", "One clear next instruction per message"] });
    sections.push({ title: "LINES THE SITE READS", lines: MARKERS });
  } else if (kind === "test") {
    sections.push({
      title: "HOW THE TEST RUNS",
      lines: [
        "5 tasks: 3 questions + 2 practical tasks",
        `Points: ${QUESTION_POINTS}/${QUESTION_POINTS}/${QUESTION_POINTS}/${PRACTICAL_POINTS}/${PRACTICAL_POINTS}, 100 in all`,
        "Questions: no second try. Practical tasks: one rewrite",
        "Stars: 0 under 50 · 1 at 50 · 2 at 70 · 3 at 90",
        "Ends with a RESULT screen and a code you paste on Progress",
      ],
    });
    sections.push({ title: "ANSWERS", lines: ["Kept out of sight, so nothing is spoiled"] });
    sections.push({ title: "LINES THE SITE READS", lines: ["▶ ITEM ACTIVATED", "▮ TEST status line", "TEST COMPLETE"] });
  } else {
    sections.push({
      title: "ONE BETTER MOVE",
      lines: [
        "Claude looks at your chat so far, nothing after it",
        "Picks at most one Pro move that clearly fits",
        "If nothing fits: a clean move, no invented advice",
        "Then help switches off and the chat goes on as usual",
      ],
    });
    sections.push({ title: "LINES THE SITE READS", lines: ["▶ ITEM ACTIVATED", "HELP USED"] });
  }

  return { tunedFor, sections, styleDiff: styleDiff(kind), sizeKb: Math.max(0.1, Math.round((textLength / 1024) * 10) / 10) };
}
