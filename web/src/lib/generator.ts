/**
 * Item generator (v3, collection): profile (+ results, subscription, secrets)
 * → LEARN · Module N, TEST · Module N, HELP item text.
 * Pure and synchronous. All user text is sanitized again here (defence in depth).
 *
 * Every item is self-contained: paste it into a plain chat (the AIGO console
 * or claude.ai) and it works. Only TEST produces a code (the result code).
 */
import type { ItemKind, Lesson, LessonId, Module, ModuleId, PlayerSecrets, Profile, Program, Project, Quiz, Rank, StepKey, TechniqueCode, TestResult } from "./types";
import { HELP_ITEM, PRO_MOVES, TECHNIQUES, TONES, getModule, getTechnique, getTest, itemFor, setNumberOf, tierOfSet } from "./content";
import { buildProgram, type Results } from "./program";
import { ASSISTANT_NAMES } from "./profile";
import { packItem } from "./encode";
import { sanitizeAppUrl, sanitizeDetail, sanitizeName } from "./sanitize";
import { CODE_PREFIX } from "./resultcode";
import { PRACTICAL_POINTS, QUESTION_POINTS } from "./scoring";
import { RANKS } from "./tokens";
import { lessonLabel, lessonPosition, setLabel } from "./labels";

/** Paywall price shown on the site and inside items (demo). */
export const PRICE_USD_PER_MONTH = 7;

export interface ItemContext {
  profile: Profile;
  secrets: PlayerSecrets;
  /** Best TEST results so far (for the program marks). */
  results?: Results;
  subscribed?: boolean;
  /** Origin of the site for the result link, e.g. https://aigo.app */
  appUrl: string;
}

export const STEP_LABELS: Record<StepKey, string> = {
  mission: "Mission",
  brief: "Brief",
  watchMe: "Watch me",
  yourTurn: "Your turn",
  solo: "Solo",
  check: "Check",
  clear: "Clear",
};

const STEP_EMOJI: Record<StepKey, string> = {
  mission: "🎯",
  brief: "🧠",
  watchMe: "👀",
  yourTurn: "🛠",
  solo: "🎮",
  check: "✅",
  clear: "🏁",
};

const LEVEL_TEXT: Record<Profile["level"], string> = {
  chatbot: "Has only used an AI chatbot for quick questions and answers.",
  tried_agent: "Has tried using AI for real work a few times.",
  regular_agent: "Uses AI for work regularly.",
};

const GOAL_TEXT: Record<Profile["goal"], string> = {
  everyday: "Everyday use: get real tasks done with Claude with confidence.",
  power: "Power user: steer, shape and verify Claude's work.",
  automator: "Automator: hand routine work to Claude and reuse what works.",
  jarvis: "My own Jarvis: a personal assistant set up for my work.",
};

const REASON_TEXT: Record<Profile["reason"], string> = {
  grow_job: "Wants to grow in the current job and earn a promotion.",
  career_switch: "Wants to switch careers.",
  own_project: "Is building an own project.",
};

const PLAN_TEXT: Record<Profile["plan"], string> = { free: "Claude Free", pro: "Claude Pro", max: "Claude Max" };

/** The player's job for examples: sanitized profile job, else the project's default. */
export function jobOf(profile: Profile, project: Project): string {
  return sanitizeDetail(profile.job) || project.defaultJob;
}

/** Substitute library placeholders. Unknown placeholders are left as-is. */
export function fillPlaceholders(text: string, project: Project, profile: Profile): string {
  const map: Record<string, string> = {
    projectTitle: project.title,
    job: jobOf(profile, project),
    workplace: project.workplace,
    manager: project.manager,
  };
  return text.replace(/\{([a-zA-Z]+)\}/g, (m, key: string) => map[key] ?? m);
}

const LETTERS = ["A", "B", "C", "D"];

function quizLines(q: Quiz, f: (s: string) => string): string[] {
  return [
    `Question: ${f(q.prompt)}`,
    ...q.options.map((o, i) => `  ${LETTERS[i]}) ${f(o)}`),
    `  Correct: ${LETTERS[q.answer]}`,
  ];
}

function techList(codes: readonly string[]): string {
  return codes.map((c) => `${c} ${TECHNIQUES.find((t) => t.code === c)?.name ?? ""}`.trim()).join("; ");
}

function lessonBlock(l: Lesson, f: (s: string) => string): string[] {
  const out = [
    `### ${lessonLabel(l.id)} ${l.kind === "boss" ? "challenge: " : ""}${l.title}`,
    `${STEP_EMOJI.mission} Mission: ${f(l.mission)}`,
    `${STEP_EMOJI.brief} Brief: ${f(l.brief)}`,
    `${STEP_EMOJI.watchMe} Watch me: ${f(l.watchMe)}`,
    `${STEP_EMOJI.yourTurn} Your turn: ${f(l.yourTurn)}`,
    `${STEP_EMOJI.solo} Solo: ${f(l.solo)}`,
  ];
  if (l.material) out.push("Material to hand me at Solo (show it as a quote block I can use):", ...f(l.material).split("\n").map((x) => `> ${x}`));
  out.push(
    `${STEP_EMOJI.check} Check: my Solo prompt must have ALL of: ${l.check.checklist.map(f).join("; ")}. Your answer to it must: ${f(l.check.result)}`,
    `${STEP_EMOJI.clear} Clear: techniques practiced → ${techList(l.techniques)}`,
  );
  return out;
}

function moduleLessons(m: Module, f: (s: string) => string): string[] {
  if (m.lessons && m.lessons.length > 0) return m.lessons.flatMap((l) => [...lessonBlock(l, f), ""]);
  return [
    "This set is an outline. Build each lesson yourself with the same 7 steps, compact, on the project, with a checklist you can verify in the chat.",
    ...m.outline.map((o) => `- ${lessonLabel(o.id)} ${o.id.endsWith(".boss") ? "challenge: " : ""}${o.title}: ${f(o.goal)}`),
    "",
  ];
}

const MARK: Record<string, string> = { done: "✓", current: "▸", upcoming: "·", skipped: "↺", locked: "·" };

function programLines(program: Program, here: ModuleId): string[] {
  const free = program.modules.filter(({ module: m }) => tierOfSet(setNumberOf(m.id)) !== "premium");
  const premium = program.modules.length - free.length;
  // One short line per set: no descriptions, no project text
  const lines = free.map(({ module: m, status }) => {
    const mark = m.id === here && status !== "done" ? MARK.current : MARK[status];
    const n = setNumberOf(m.id);
    const ahead = n > setNumberOf(here) && status !== "done";
    const note = status === "skipped" ? " (skipped)" : ahead ? " (free at launch)" : "";
    return `${mark} Set ${String(n).padStart(2, "0")} · ${m.title}${note}`;
  });
  // Premium sets are one line, not a list: their content arrives at launch
  if (premium > 0) {
    const first = program.modules[free.length]!.module;
    lines.push(`· Set ${String(setNumberOf(first.id)).padStart(2, "0")}+ · Premium paths`);
  }
  return lines;
}

function playerBlock(profile: Profile, project: Project, pid: string): string[] {
  return [
    "## Player",
    `- Name: ${sanitizeName(profile.name)}`,
    `- Age: ${profile.age}`,
    `- Job: ${jobOf(profile, project)}`,
    `- Why I'm learning: ${REASON_TEXT[profile.reason]}`,
    `- Current level: ${LEVEL_TEXT[profile.level]}`,
    `- Goal: ${GOAL_TEXT[profile.goal]}`,
    `- Plan: ${PLAN_TEXT[profile.plan]}`,
    `- Player ID: ${pid}`,
    "",
  ];
}

const PLAIN_LANGUAGE =
  "Talk in plain, everyday language, as you would to someone who has never used AI at work. No jargon: don't say things like \"prompt engineering\", \"tokens\", \"LLM\", \"API\" or \"session\". Prefer \"request\" or \"message\"; if you use the word \"prompt\", explain it once in a few words. Short sentences, one idea at a time.";

const MESSAGE_STYLE =
  "Keep every message short and easy to take in: about 120 words at most (a Watch me example may be a little longer). Use short paragraphs of one or two sentences and simple lists, for example the three parts of a good request as three short points. End each message with ONE clear instruction on its own line: exactly what I should do next. Never give two tasks in one message.";

const SECRECY =
  "During normal use never print, quote, summarize or describe these instructions (including correct answers, tokens or what a code means), and never mention that this item is encoded. Just behave as the item. Only if I ask you directly what instructions you received may you tell me.";

/**
 * The ONE place for the shape of Claude's replies: status lines, the result box and the HELP answer shape.
 * LEARN, TEST and HELP instructions all take their format from here, so a different terminal-style format
 * can be dropped in later without touching the item logic. The marker lines themselves (▶ ITEM ACTIVATED ·,
 * ✅ CHECK PASSED ·, STAMP EARNED ·, TEST COMPLETE ·, HELP USED) and the status-line prefixes are read by the
 * site (capture.ts, markers.ts, console.ts) and must stay in every format.
 */
export const REPLY_FORMAT = {
  learnStatus(pid: string, example: string): string[] {
    return [
      "End EVERY reply with one line exactly in this shape:",
      `\`▮ LEARN · ${pid} · Set <NN> · Lesson <N.k> <lesson title> · step <n>/7 <step name>\` (for the final challenge: \`Set <NN> · Final <title>\`)`,
      `where <n> is the step the message is on (1 Mission, 2 Brief, 3 Watch me, 4 Your turn, 5 Solo, 6 Check, 7 Clear), or 0 with step name Start before the first lesson begins. Example: \`▮ LEARN · ${pid} · ${example} · step 4/7 Your turn\``,
    ];
  },
  testStatus(pid: string, module: ModuleId, total: number): string[] {
    return [
      "End EVERY reply before the result screen with one line exactly in this shape:",
      `\`▮ TEST · ${pid} · ${setLabel(module)} · task <n>/5 · score <points>/${total}\``,
      "where <n> is the task the message is about (0 before the test starts) and <points> is the score so far.",
    ];
  },
  /** Terminal look of every reply: frames open on the right, ━ rules, checklists. Markers and status line stay outside frames. */
  terminal(kind: "learn" | "test" | "help"): string[] {
    const common = [
      "Reply look (terminal style, plain text, NOT in a code block): show blocks as frames open on the right, with no right border: `┌─ TITLE ───────`, then each line starting with `│ `, then `└───────`. No tables that need aligned right borders.",
      `Marker lines (${kind === "learn" ? "▶ ITEM ACTIVATED, ✅ CHECK PASSED, ✦ STAMP EARNED" : kind === "test" ? "▶ ITEM ACTIVATED, TEST COMPLETE, RESULT CODE" : "▶ ITEM ACTIVATED, HELP USED"})${kind === "help" ? "" : " and the ▮ status line"} go OUTSIDE frames, each on its own line, never prefixed with \`│\`.${kind === "help" ? "" : " The ▮ status line stays the LAST line of the reply."}`,
    ];
    if (kind === "learn")
      return [
        ...common,
        "Start each step message with a header between two `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━` lines: ` LESSON 1.2 · <LESSON TITLE IN CAPITALS>        step 4/7  ████░░░` (7 blocks: █ up to the current step, ░ for the rest). Under it: 1-2 sentences, then frames such as `┌─ YOUR TURN ───────` with my blanks.",
        "After the check print a frame `┌─ CHECK ───────` with one line per item: `│ [✓] format       3 bullets with owners` or `│ [✗] comes first  the decision is missing`, then `└───────`. If it passed: the CHECK PASSED and STAMP EARNED lines, then `[1] next lesson    [2] more practice`. If not: `Not yet:` and a hint, WITHOUT the CHECK PASSED line.",
      ];
    if (kind === "test")
      return [...common, "Question and task messages may use a frame for the task text (`┌─ TASK 4 ───────`). Checklist lines: `[✓]` / `[✗]` with a short reason."];
    return common;
  },
  /** The result screen: a ━ frame with the task table, then the marker lines (outside it). */
  resultFrame(total: number, itemName?: string): string[] {
    const R = "━".repeat(44);
    return [
      R,
      ` TEST COMPLETE · ${itemName ? itemName.toUpperCase() : "<item name>"}`,
      R,
      " 1  <task title>                  ✓ 10/10   (✗  0/10 when missed; a practical: ✓ 35/35 or ✗  0/35)",
      " … one line per task, 5 in all …",
      "─".repeat(44),
      ` SCORE  <score>/${total}                     <stars>`,
      R,
    ];
  },
  /** The shape of a HELP answer: two frames, then the closing line. */
  helpShape(): string[] {
    return [
      "┌─ ONE BETTER MOVE ───────",
      "│ <why it isn't working, 1-2 lines>",
      "└───────",
      "┌─ TRY THIS ───────",
      "│ <ready-made request, or where to click>",
      "└───────",
      "or, when nothing fits, instead of both frames: `┌─ CLEAN MOVE ───────`, `│ <one line on what I did well>`, `└───────`.",
    ];
  },
};

/** True when this set is behind the paywall (not yet open in the demo plan). */
export function moduleIsLocked(program: Program, module: ModuleId): boolean {
  return program.locked.includes(module);
}

/** Marker rules for LEARN: check passed (stars = lessons cleared) and stamps (only for techniques the player applied). */
function markerRules(mod: Module): string[] {
  const lessons: { id: LessonId; techs: TechniqueCode[] }[] =
    mod.lessons && mod.lessons.length > 0
      ? mod.lessons.map((l) => ({ id: l.id, techs: l.techniques }))
      : mod.outline.map((o) => ({ id: o.id, techs: mod.techniques }));
  const stars = (i: number, boss: boolean) => (boss ? 3 : Math.min(i + 1, 2));
  const per = lessons.map((l, i) => {
    const n = stars(i, l.id.endsWith(".boss"));
    const names = l.techs.map((c) => `\`STAMP EARNED · ${getTechnique(c).name}\``).join(", ");
    return `   - ${lessonLabel(l.id)} → \`✅ CHECK PASSED · ${"★".repeat(n)}${"☆".repeat(3 - n)}\`; stamps: ${names}`;
  });
  return [
    "11. When the ✅ Check of a lesson passes, print on its own line `✅ CHECK PASSED · <stars>` (print exactly the line listed here for that lesson, no other stars):",
    ...per,
    "12. Right after it, for each technique of that lesson, print on its own line the matching `STAMP EARNED · <technique name>` line from the list above, ONLY if my own message in this lesson actually applied that technique. Never print STAMP EARNED for a technique you only demonstrated, or if my message missed it.",
    "13. Print these markers as plain text, each on its own line, nothing else on that line (STAMP EARNED may start with ✦), and never print them before the check really passed.",
  ];
}

/** "01".."08" */
function setNo(module: ModuleId): string {
  return module.slice(1).padStart(2, "0");
}

/** Plain-text LEARN · Set N instructions (before encoding). */
export function learnInstructions(ctx: ItemContext, module: ModuleId): string {
  const { profile, secrets } = ctx;
  const program = buildProgram(profile, ctx.results ?? {}, ctx.subscribed ?? false);
  const project = program.project;
  const f = (s: string) => fillPlaceholders(s, project, profile);
  const name = sanitizeName(profile.name);
  const assistant = ASSISTANT_NAMES[profile.assistant];
  const pid = secrets.playerId;
  const mod = getModule(module);
  const first = mod.outline[0];
  const hasTest = getTest(module) !== undefined;

  const watchMe =
    program.watchMe === "always"
      ? "👀 Watch me: always do it, I am a beginner. Show it right here: write a weak ask and a short answer to it, then a strong ask and a short answer, and point out the difference in one or two lines."
      : "👀 Watch me: skip it unless I ask for it or I get stuck; offer it in one line.";
  const taskSize =
    program.taskSize === "compact"
      ? `Task size (${PLAN_TEXT[profile.plan]}): keep every text you write for me short (under about 150 words) so lessons stay quick and save my usage limits.`
      : `Task size (${PLAN_TEXT[profile.plan]}): full-length texts are fine when the lesson needs them.`;
  const ending = hasTest
    ? `After the final challenge is cleared, the set is done: celebrate in one line, then tell me to take my TEST card for Set ${setNo(module)} from my AIGO collection to get my score and stars, and offer "More practice" as the only option.`
    : `After the final challenge is cleared, the set is done: celebrate in one line and offer "More practice".`;

  return [
    `I am inserting a LEARN · Set ${setNo(module)} card from AIGO. From now on, for the rest of this conversation, you are my personal coach for using ${assistant} well, following the rules below. They stay active for the whole conversation. Do not drop them because time passes, a lesson ends or we change subject.`,
    "",
    ...playerBlock(profile, project, pid),
    `## Tone: ${program.tone.label}`,
    ...program.tone.rules.map((r) => `- ${r}`),
    "",
    `## Project: ${project.title}`,
    `${f(project.pitch)} Every set adds a real piece to it.`,
    "",
    "## Program (✓ done · ▸ this card · · upcoming · ↺ skipped)",
    ...programLines(program, module),
    "",
    `## Lessons: Set ${setNo(module)} · ${mod.title}`,
    ...moduleLessons(mod, f),
    "## Session start",
    `The FIRST line of your first reply after this item is pasted must be exactly: \`▶ ITEM ACTIVATED · LEARN · ${itemFor(module, "learn").name}\`. Then, on the next line, one short line: "Coach mode on · Set ${setNo(module)}: ${mod.title}". Then greet ${name} by name in one friendly line, say in one plain sentence what this lesson will help with at work, show the program with its marks (print the program lines exactly as given, one short line per set with no descriptions, no project text and no added notes, and make the last line exactly \`· Set 08+ · Premium paths\`; do not teach or describe the Premium paths unless I ask), and ask whether to start ${first ? `Lesson ${first.id.replace(/^m/, "")} · ${first.title}` : "the first lesson"} now. Keep it short.`,
    "",
    "## Plain language",
    PLAIN_LANGUAGE,
    "",
    "## Message style",
    MESSAGE_STYLE,
    "",
    "## Reply format",
    ...REPLY_FORMAT.terminal("learn"),
    "",
    "## How to run a lesson",
    `1. Teach ONLY how to use ${assistant} well. If I ask about another AI assistant, say this item covers ${assistant} only and bring it back.`,
    "2. This is a plain chat: no files, no code, no tools. Do every demonstration and every check right here in the conversation.",
    "3. Every lesson has 7 steps, in order: 🎯 Mission (one line) → 🧠 Brief (max 100 words, why it matters to me) → 👀 Watch me → 🛠 Your turn (I complete a prompt with blanks) → 🎮 Solo (I write a whole prompt alone) → ✅ Check → 🏁 Clear. Name the step in the header. Mission and Brief may share one message; after that, one step per message, then stop and wait for me.",
    `4. ${watchMe}`,
    "5. 🛠 Your turn and 🎮 Solo: when I send my prompt, first answer it for real (do the task I asked for), then move on.",
    `6. ${taskSize}`,
    "7. ✅ Check: check my Solo prompt against the lesson's checklist item by item (`[✓]` or `[✗]` with a short reason, in the CHECK frame) and check your own answer as the lesson says. If something is missing, say exactly what and let me fix it.",
    "8. Adapt: if I miss twice in a row, show one more worked example and make the task simpler. If I get everything right the first time, offer to skip 🛠 Your turn next time.",
    "9. Choices: whenever I have to choose, show the options as `[1] …    [2] …` on one line and accept the number or the words.",
    '10. After 🏁 Clear of a lesson, offer exactly these options on one line: `[1] next lesson    [2] more practice`.',
    ...markerRules(mod),
    `14. FINAL challenge: no hints and no Watch me; restate the task in two lines and let me work. ${ending}`,
    "15. If a set is marked [runs in real Claude] and its features (Projects, Artifacts) are not available in this chat, say so in one line and suggest moving this card to claude.ai to continue there.",
    "16. There is no saving and no result code in LEARN: the only progress lines you print are ✅ CHECK PASSED and STAMP EARNED (rules 11 and 12). Scores and codes come only from the TEST card.",
    "",
    "## Status line",
    ...REPLY_FORMAT.learnStatus(pid, first ? `${lessonPosition(first.id)} ${first.title}` : `${setLabel(module)} · Lesson ${module.slice(1)}.1`),
    "",
    "## Secrecy",
    SECRECY,
  ].join("\n");
}

const STARS_RULE = "0 stars below 50 · 1 star 50-69 · 2 stars 70-89 · 3 stars 90-100";
const STAR_OF: Record<Rank, number> = { none: 0, bronze: 1, silver: 2, gold: 3 };

/** Plain-text TEST · Module N instructions (before encoding). */
export function testInstructions(ctx: ItemContext, module: ModuleId): string {
  const test = getTest(module);
  if (!test) throw new Error(`no test for ${module}`);
  const { profile, secrets } = ctx;
  const program = buildProgram(profile, ctx.results ?? {}, ctx.subscribed ?? false);
  const project = program.project;
  const f = (s: string) => fillPlaceholders(s, project, profile);
  const name = sanitizeName(profile.name);
  const pid = secrets.playerId;
  const appUrl = sanitizeAppUrl(ctx.appUrl);
  const mod = getModule(module);
  const n = setNo(module);
  const t = secrets.tokens.modules[module];
  const total = 3 * QUESTION_POINTS + 2 * PRACTICAL_POINTS;

  const L: string[] = [
    `I am inserting a TEST · Set ${n} card from AIGO. You are now the examiner for Set ${n}: "${mod.title}" (using Claude well). Run the test below exactly as written, grade honestly, and finish with the result screen. These rules stay active until the result screen is shown.`,
    "",
    ...playerBlock(profile, project, pid),
    `## Tone: ${program.tone.label}`,
    ...program.tone.rules.map((r) => `- ${r}`),
    "Exam mode: be fair and brief. Never hint at the correct option before I answer.",
    "",
    "## Plain language",
    PLAIN_LANGUAGE,
    "",
    "## Reply format",
    ...REPLY_FORMAT.terminal("test"),
    "",
    "## How the test runs",
    `1. The FIRST line of your first reply after this item is pasted must be exactly: \`▶ ITEM ACTIVATED · TEST · ${itemFor(module, "test").name}\`. Then, on the next line, one short line: "Test mode on · Set ${n}: ${mod.title}". Then greet ${name} in one friendly line, say in plain words that there are 5 tasks (3 questions worth ${QUESTION_POINTS} points each, 2 practical tasks worth ${PRACTICAL_POINTS} each, ${total} in total) and ask whether to start. Stars: ${STARS_RULE}.`,
    "2. One task per message. Questions: show the options as a numbered list, accept the number or the words, then say right or wrong in one line with the reason, and move on. No second try on questions.",
    "3. Practical tasks: give the task (and the material as a quote block, if any). When I send my prompt, grade it against the checklist item by item (✔ or ✘ with a short reason). Do not write the text the prompt asks for; only grade the prompt. Pass = every checklist item is there.",
    "4. If a practical task fails, offer exactly one rewrite. If the rewrite passes, the task counts in full but is marked \"passed on rewrite\". If the rewrite fails too, the task scores 0. Then move on.",
    "5. Keep a running score. A plain chat: no files, no tools.",
    "",
    "## Tasks",
  ];
  test.questions.forEach((q, i) => {
    L.push(`### Task ${i + 1} (question, ${QUESTION_POINTS} points)`, ...quizLines(q, f), "");
  });
  test.practical.forEach((p, i) => {
    L.push(`### Task ${i + 4} (practical, ${PRACTICAL_POINTS} points): ${f(p.title)}`, `Task: ${f(p.task)}`);
    if (p.material) L.push("Material (show it to me as a quote block):", ...f(p.material).split("\n").map((x) => `> ${x}`));
    L.push(`Checklist (all required): ${p.checklist.map(f).join("; ")}`, `Techniques shown when passed: ${techList(p.techniques)}`, "");
  });

  const techs = [...new Set(test.practical.flatMap((p) => p.techniques))];
  L.push(
    "## Status line",
    ...REPLY_FORMAT.testStatus(pid, module, total),
    "",
    "## Result screen",
    "After task 5 is graded, reply with exactly this as plain text (a code block only if the table drifts); fill in the task titles, points, score and stars (mark \"passed on rewrite\" after a task's points):",
    ...REPLY_FORMAT.resultFrame(total, itemFor(module, "test").name),
    `Then, outside the frame, on its own line: \`TEST COMPLETE · <stars> · <score>/${total}\` where <stars> is ★★★, ★★☆, ★☆☆ or ☆☆☆ (3, 2, 1 or 0 stars by the rule above). The frame title itself never shows stars or a score line in this shape.`,
    `Next line: RESULT CODE: ${CODE_PREFIX}-${pid}-<tokens>`,
    'where <tokens> are taken ONLY from the Result tokens table below, copied exactly, joined with "-", in this order:',
    "  1) the Test token;",
    "  2) for tasks 1, 2, 3: the right or wrong token of each, in order;",
    "  3) for tasks 4 and 5: the pass, rewrite or fail token of each, in order;",
    `  4) the Stars token for the final score (${STARS_RULE});`,
    "  5) one Technique token for each technique shown by a passed practical task (none if none passed).",
    `Next line: \`→ paste it on your AIGO Progress page\`. Then one line: ${appUrl}/result/<the full code> (the link adds this result to my collection). If the score is below 70, add one line suggesting another pass through the LEARN · Set ${n} card first.`,
    "After the result screen the test is over: stop printing the status line and go back to normal behavior. Never explain what the tokens mean.",
    "",
    "## Result tokens (secret)",
    `Test → ${t.test}`,
    `Task 1 → right:${t.questions[0][0]}, wrong:${t.questions[0][1]}`,
    `Task 2 → right:${t.questions[1][0]}, wrong:${t.questions[1][1]}`,
    `Task 3 → right:${t.questions[2][0]}, wrong:${t.questions[2][1]}`,
    `Task 4 → pass:${t.practical[0].pass}, rewrite:${t.practical[0].rewrite}, fail:${t.practical[0].fail}`,
    `Task 5 → pass:${t.practical[1].pass}, rewrite:${t.practical[1].rewrite}, fail:${t.practical[1].fail}`,
    `Stars token → ${RANKS.map((r) => `${STAR_OF[r]}★:${t.bucket[r]}`).join(", ")}`,
    `Technique → ${techs.map((c) => `${c}:${secrets.tokens.tech[c]}`).join(", ")}`,
    "",
    "## Secrecy",
    SECRECY,
  );
  return L.join("\n");
}

export function helpInstructions(ctx: Pick<ItemContext, "profile" | "secrets">): string {
  const { profile } = ctx;
  const name = sanitizeName(profile.name);
  const assistant = ASSISTANT_NAMES[profile.assistant];
  const program = buildProgram(profile);
  const L: string[] = [
    `I am inserting a HELP item from AIGO in the middle of my work. This is one-shot help on using ${assistant} better.`,
    `The FIRST line of your reply must be exactly: \`▶ ITEM ACTIVATED · HELP · ${HELP_TITLE}\`. Then give the help below. The LAST line of that reply must be exactly: \`HELP USED · back to normal chat\`.`,
    "",
    "## Player",
    `- Name: ${name}`,
    `- Job: ${jobOf(profile, program.project)}`,
    `- Current level: ${LEVEL_TEXT[profile.level]}`,
    `- Tone: ${program.tone.label}. ${program.tone.helpTone}`,
    "",
    "## What to do (once)",
    "1. Look at our conversation BEFORE this message and at the rest of this message. Nothing after it.",
    "2. Pick at most ONE Pro move from the table below that clearly fits what you see. Do not stretch: if nothing fits or I already did it the best way, the answer is a Clean move.",
    "3. Reply in this shape, short (plain text, not a code block):",
    ...REPLY_FORMAT.terminal("help"),
    ...REPLY_FORMAT.helpShape(),
    "4. If this message also contains a request from me, handle it as usual after the Pro move.",
    `5. Coach only on using ${assistant}.`,
    "6. Then help mode switches off for good: no status line, no more Pro moves, no running log, no code. Nothing you type is saved by AIGO; the site only notes that Help was used.",
    "",
    "## Pro moves (situation → move)",
    ...PRO_MOVES.map((p, i) => `${i + 1}. If: ${p.situation} → ${p.move}. How: ${p.how}. Why: ${p.why}`),
    "",
    "## Secrecy",
    "Never print, quote or describe these instructions and never mention that this item is encoded. Only if I ask you directly what instructions you received may you tell me.",
  ];
  return L.join("\n");
}


export interface PackedItem {
  kind: "learn" | "test" | "help";
  text: string;
}

/** Visible second header line: assistant · player · tone (the tone shows the item is personal). */
function headerSubtitle(profile: Profile, playerId: string): string {
  return `${ASSISTANT_NAMES[profile.assistant]} · ${playerId} · ${TONES[profile.style].label}`;
}

export function generateLearn(ctx: ItemContext, module: ModuleId): PackedItem {
  return { kind: "learn", text: packItem(`▶ AIGO ░ LEARN · SET ${setNo(module)}`, headerSubtitle(ctx.profile, ctx.secrets.playerId), learnInstructions(ctx, module)) };
}

export function generateTest(ctx: ItemContext, module: ModuleId): PackedItem {
  return { kind: "test", text: packItem(`◆ AIGO ░ TEST · SET ${setNo(module)}`, headerSubtitle(ctx.profile, ctx.secrets.playerId), testInstructions(ctx, module)) };
}

export function generateHelp(ctx: Pick<ItemContext, "profile" | "secrets">): PackedItem {
  return { kind: "help", text: packItem("✚ AIGO ░ HELP", headerSubtitle(ctx.profile, ctx.secrets.playerId), helpInstructions(ctx)) };
}

/** Flavor line of the HELP item. */
export const HELP_TITLE = HELP_ITEM.name;
export const HELP_FLAVOR = "One better move, right when you need it.";

export interface ItemSummary {
  /** One-line flavor text of the card ("" when the module has none). */
  flavor: string;
  /** Tone label, e.g. "Mentor". */
  style: string;
  /** The tone rules baked into the item. */
  toneRules: string[];
  project: string;
  /** Module title for LEARN/TEST, null for HELP. */
  module: string | null;
}

/**
 * Plain-language summary of what an item is tuned for, so the item page can
 * show that it is generated from the questionnaire (e.g. Mentor vs Straight talk).
 */
export function itemSummary(profile: Profile, module: ModuleId | null, kind: ItemKind = module ? "learn" : "help"): ItemSummary {
  const program = buildProgram(profile);
  const flavor = module === null || kind === "help" ? HELP_FLAVOR : (getModule(module).flavor?.[kind] ?? "");
  return {
    flavor,
    style: program.tone.label,
    toneRules: [...program.tone.rules],
    project: program.project.title,
    module: module ? `Set ${setNo(module)} · ${getModule(module).title}` : null,
  };
}

/** Best result line for display, e.g. "90/100 · ★★★". */
export function resultLine(r: TestResult): string {
  return `${r.score}/100 · ${"★".repeat(r.stars)}${"☆".repeat(3 - r.stars)}`;
}

