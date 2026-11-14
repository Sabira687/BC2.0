import type { ModuleId, ModuleTest, TestQuestion } from "@/lib/types";

/*
 * TEST items (spec/03 §9): 3 multiple-choice questions + 2 practical prompt
 * tasks per module. Only m1 is written in full for the demo.
 *
 * Same placeholder rules as the lessons: {projectTitle} {job} {workplace}
 * {manager}. Every hint answer must pass on its own, because players copy it
 * straight into the console.
 */

/** A question whose ready answer is always exactly the text of the correct option. */
function question(
  meta: Pick<TestQuestion, "title" | "focus" | "practice" | "feedback">,
  prompt: string,
  options: [string, string, string],
  answer: 0 | 1 | 2,
  todo: string,
): TestQuestion {
  return { ...meta, prompt, options, answer, hint: { todo, answer: options[answer] } };
}

// ───────────────────────── m1 material ─────────────────────────

const M1_T5_NOTES = `Mon: 12 new chairs delivered, 2 damaged -> return booked with supplier
Tue: kitchen deep clean done, coffee machine descaled
Wed: visitor badges ran out!! ordered 200 more, arrive Fri
Thu: Wi-Fi down in meeting room B for 3 hrs, IT replaced the router
Fri: Q4 stationery spend at $640 of $800 budget
still open: parking permits for 4 new staff, waiting on the landlord since Nov 3`;

// ───────────────────────── m1 The Clear Ask ─────────────────────────

const M1_TEST: ModuleTest = {
  module: "m1",
  questions: [
    question(
      {
        title: "What goes into a good ask?",
        focus: "1",
        practice: "name the three parts of a strong ask: context, goal and format.",
        feedback: { right: "Right: context, goal and format.", wrong: "Not this time. A strong ask names the context, the goal and the format." },
      },
      "What goes into the brief formula for a clear ask?",
      ["Politeness, urgency and a word count", "A role, an example and a template", "Context, goal and format"],
      2,
      "Pick the option that names the three parts of a strong ask.",
    ),
    question(
      {
        title: "Which ask is better, and why?",
        focus: "1",
        practice: "say why one ask works better: it gives context, goal and format, so nothing is guessed.",
        feedback: { right: "Right: the clear ask gives Claude nothing to guess.", wrong: "Not this time. The better ask gives the context, the goal and the format." },
      },
      "Which ask is better, and why? A: \"Write an email about the delay.\" B: \"I'm the {job} at {workplace}. Write a 3-sentence email to our client saying the delivery moves from May 5 to May 9 because of a stock shortage. Polite, apologetic tone.\"",
      [
        "B, because it gives the context, the goal and the format, so nothing has to be guessed",
        "A, because a short ask leaves Claude free to pick the best version",
        "B, because it is longer and sounds more polite",
      ],
      0,
      "Pick the option with the right ask and the right reason.",
    ),
    question(
      {
        title: "Why paste your own material?",
        focus: "3",
        practice: "paste your material instead of describing it.",
        feedback: { right: "Right: Claude works from your real facts.", wrong: "Not this time. Claude only knows the facts you give it, so paste the real text." },
      },
      "Why paste your own notes into the prompt instead of describing them in a sentence?",
      [
        "Pasted text always makes the answer longer and more detailed",
        "Claude works from your real facts, names and dates instead of guessing them",
        "Claude refuses to write anything without pasted text",
      ],
      1,
      "Pick the option that explains what your material gives Claude.",
    ),
  ],
  practical: [
    {
      title: "Move a Deadline",
      task: "Write a prompt asking Claude for an email to your colleague Priya in finance. The Q4 supplier cost report she expects on Friday, November 21 will be ready on Wednesday, November 26, because two suppliers sent their invoices late. Your prompt needs context, goal and format.",
      checklist: [
        "Context: who the player is and the situation (which report, the old and the new date, why it moves)",
        "Goal: what the email must achieve (Priya knows the new date and the reason, and can plan around it)",
        "Format: length, structure or tone stated explicitly",
      ],
      techniques: ["1", "2"],
      focus: "1",
      practice: "put who, what and format into one ask.",
      feedback: {
        pass: "Passed: who, what and format in one ask.",
        rewrite: "Passed on the rewrite: the second try had who, what and format.",
        fail: "Not this time. The ask was missing the context, the goal or the format.",
      },
      hint: {
        todo: "Send a full prompt with context, goal and format for the deadline email.",
        answer:
          "I'm the {job} at {workplace}. Write an email to my colleague Priya in finance, telling her that the Q4 supplier cost report will be ready on Wednesday, November 26 instead of Friday, November 21, because two suppliers sent their invoices late. Goal: she understands the reason, knows the new date and can plan her month-end work around it. Format: under 120 words, a clear subject line, friendly and professional tone, ending with an offer to share the finished sections on Friday.",
      },
    },
    {
      title: "Fix the Bad Prompt",
      task: "A coworker asked Claude just \"make a report\" and got something useless. Rewrite it into a full prompt for a real task: a weekly report for your manager built from the notes in the Material section. Add context, goal and format, and paste the notes in full.",
      material: M1_T5_NOTES,
      checklist: [
        "Context: who the player is and that this is a weekly report for the manager",
        "Goal: what the manager should take away from the report",
        "Format: length and structure (sections or bullets) stated explicitly",
        "Material: the week's notes are pasted in full",
      ],
      techniques: ["1", "2", "3"],
      focus: "3",
      practice: "paste your notes in full and say how the report should look.",
      feedback: {
        pass: "Passed: a real task and a clear shape.",
        rewrite: "Passed on the rewrite: a real task, the notes pasted and a clear shape.",
        fail: "Not this time. A clear ask with the notes pasted in full was missing.",
      },
      hint: {
        todo: "Send the rewritten prompt with context, goal, format and the notes pasted in.",
        answer: `I'm the {job} at {workplace}. Write my weekly report for {manager}, so they can see in one minute what got done, what is still open and where I need their help. Format: under 120 words, three sections with the headings Done, Open and Needs attention, short bullet points, plain business tone. Keep all numbers and dates exactly as in my notes and add nothing that is not in them.

My notes:
${M1_T5_NOTES}`,
      },
    },
  ],
};

// ───────────────────────── Library ─────────────────────────

export const TESTS: Partial<Record<ModuleId, ModuleTest>> = {
  m1: M1_TEST,
};
