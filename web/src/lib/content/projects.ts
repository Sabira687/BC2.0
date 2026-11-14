import type { Project, ProjectId } from "@/lib/types";

/** The through-line projects, one per "reason" in the questionnaire (spec/03 §1). */
export const PROJECTS: Record<ProjectId, Project> = {
  promotion_kit: {
    id: "promotion_kit",
    title: "Work Kit",
    pitch:
      "Texts that help you at work and toward a promotion: an email to your manager, a weekly report, a meeting summary and a review self-assessment.",
    defaultJob: "office manager",
    workplace: "a mid-size logistics company",
    manager: "my manager, Sarah",
    additions: {
      m1: "An email to your manager asking for a growth conversation, plus a first weekly report.",
      m2: "Three versions of that email, with the best one picked and polished.",
      m3: "A report written in the style your manager likes.",
      m4: "A full weekly report built from raw notes, with sections and a table.",
      m5: "A fact-checked self-assessment for your performance review.",
      m6: "A meeting summary and a task list from your own notes.",
      m7: "A Work Kit project in Claude with your standing instructions.",
      m8: "A reusable weekly report template as an artifact.",
    },
  },
  job_switch_kit: {
    id: "job_switch_kit",
    title: "Job Switch Kit",
    pitch:
      "Texts that move your career switch forward: cover letters, résumé bullets, outreach messages and interview prep.",
    defaultJob: "customer support specialist",
    workplace: "an online retailer",
    manager: "my team lead, Mark",
    additions: {
      m1: "A clear outreach message to someone in your target field, plus résumé bullets from your raw notes.",
      m2: "Three openings for your cover letter, with the best one picked and polished.",
      m3: "Résumé bullets written in the style of a strong example.",
      m4: "A full cover letter built section by section.",
      m5: "Résumé and cover letter claims checked against your real record.",
      m6: "Interview prep built from a job posting you paste in.",
      m7: "A Job Switch Kit project in Claude with your background as standing instructions.",
      m8: "A reusable cover letter template as an artifact.",
    },
  },
  launch_kit: {
    id: "launch_kit",
    title: "Launch Kit",
    pitch:
      "Texts that get your own project off the ground: a project pitch, a plan, update posts and landing page copy.",
    defaultJob: "graphic designer",
    workplace: "a small design studio",
    manager: "my studio lead, Alex",
    additions: {
      m1: "A one-paragraph pitch for your project, plus a first progress update.",
      m2: "Three taglines to choose from, with the best one refined.",
      m3: "Update posts in a voice you like, built from an example.",
      m4: "A project plan with phases, tasks and dates.",
      m5: "Landing page claims checked: no numbers you cannot back up.",
      m6: "A launch to-do list from your own notes and feedback.",
      m7: "A Launch Kit project in Claude with your project's background as standing instructions.",
      m8: "Landing page copy as a reusable artifact.",
    },
  },
};
