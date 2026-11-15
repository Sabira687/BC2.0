/** Static copy for the Guide page (/guide): six setup steps, the two ways to learn, the checklist. */
export type GuideVisual = "claude" | "item" | "paste" | "learn" | "code" | "help";

export interface GuideStep {
  n: number;
  title: string;
  text: string;
  tag: string;
  visual: GuideVisual;
  /** Premium-only step (the connector). */
  premium?: boolean;
}

export const GUIDE_STEPS: readonly GuideStep[] = [
  { n: 1, title: "Get your AI (we use Claude in this demo)", text: "Free is enough. In this demo that is claude.ai in the browser, the desktop app or the phone app.", tag: "TOOL · CLAUDE (FREE PLAN WORKS)", visual: "claude" },
  { n: 2, title: "Copy an item", text: "Open your collection, pick an item, press Copy card. It is a short block of text with the lessons inside.", tag: "FROM YOUR COLLECTION", visual: "item" },
  { n: 3, title: "Paste it into a new chat", text: "Start a fresh chat so nothing old gets in the way. Paste, send.", tag: "LOOK FOR ▶ ITEM ACTIVATED", visual: "paste" },
  { n: 4, title: "Learn in the chat", text: "Your AI runs the lesson on your real work and checks every answer. Stars and stamps appear as lines in the chat.", tag: "ALL LEARNING HAPPENS IN THE AI", visual: "learn" },
  { n: 5, title: "Bring your progress home", text: "The test ends with a RESULT CODE. Paste it on your Progress page: stars, stamps and badges land in AIGO.", tag: "IN THE AIGO CONSOLE THIS IS AUTOMATIC", visual: "code" },
  { n: 6, title: "Stuck at work? Use a Help item", text: "In any chat, paste the Pocket Compass. Your AI looks at what already happened and suggests one better move.", tag: "WORKS IN THE MIDDLE OF REAL WORK", visual: "help" },
];

export const GUIDE_WAYS = [
  { name: "Your own AI", note: "for real users · not needed for this demo", recommended: true },
  { name: "AIGO console", note: "No setup, right in the browser. Progress saves itself.", recommended: false },
] as const;

export const GUIDE_CHECKLIST: readonly string[] = ["get your AI", "copy an item", "paste it into a new chat", "pass a lesson", "bring the result code home"];

export const GUIDE_CONNECTOR = {
  kicker: "★ WITH PREMIUM · AT LAUNCH",
  title: "Connect AIGO to your AI · with Premium · at launch",
  text: "Add AIGO once in Claude under Settings → Connectors. Then your AI opens your items itself and progress saves without codes.",
  label: "coming with Premium",
} as const;
