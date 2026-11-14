/** Copy for the landing page and the Premium page (approved canvas v4.1). Pure data, no UI. */
import { PRICE_USD_PER_MONTH } from "./generator";

export const QUICK_DEMO_STEPS: readonly string[] = [
  "Make Set 01: your first 3 cards",
  "Open the Learn card, press “Use this answer”, send. Watch the star and your first stamp arrive.",
  "Use the Compass in Work chat",
  "Fast-forward John: 90 ★★★, holo + badge",
];

export interface ItemPanel {
  accent: string;
  tag: string;
  name: string;
  lore: string;
  teach: string;
}

/** Placeholder story panels for the five items on the podium (item system comes later). */
export const ITEM_PANELS: readonly ItemPanel[] = [
  {
    accent: "#6AF7FF",
    tag: "ITEM · LEARN · SET 01 · 1/3 · ● COMMON",
    name: "Three-Tooth Key",
    lore: "Forged for doors that never open on the first knock. Its three teeth are who you are, what you need and how it should look. Miss one and the lock just spins.",
    teach: "Teaches: write an ask the AI gets right the first time. 3 lessons on your work, ~10 min.",
  },
  {
    accent: "#FF5AF1",
    tag: "ITEM · TEST · SET 01 · 2/3 · ● COMMON",
    name: "Proving Lock",
    lore: "Five keyholes, no hints. It doesn't care how you learned, only whether your key is cut right.",
    teach: "Tests: 5 tasks on your work, scored out of 100. 90 or more turns the card holographic.",
  },
  {
    accent: "#39FF88",
    tag: "ITEM · HELP · SET 01 · 3/3 · ● COMMON",
    name: "Pocket Compass",
    lore: "It won't walk the road for you. Lost mid-task? It points once, toward one better move, then goes quiet.",
    teach: "Helps: paste it mid-task and get one better move. About a minute.",
  },
  {
    accent: "#67E8F9",
    tag: "ITEM · ??? · SET 05 · ◆ RARE · FREE",
    name: "Locked item",
    lore: "You'll see it later.",
    teach: "Comes with the free core path after the demo.",
  },
  {
    accent: "#FCD34D",
    tag: "ITEM · ??? · SET 12 · ★ LEGENDARY · PREMIUM",
    name: "Locked item",
    lore: "You'll see it later.",
    teach: "Part of the Automator path: Claude Code, agents and connectors.",
  },
];

export interface PathStop {
  n: string;
  title: string;
  text: string;
  /** Position on a 1000 x 440 canvas. */
  x: number;
  y: number;
}

export const PATH_STOPS: readonly PathStop[] = [
  { n: "01", title: "You answer", text: "One minute: your job, your goal, how you like to learn.", x: 120, y: 320 },
  { n: "02", title: "Open your cards", text: "Set 01 is made for you: the Key, the Lock and the Compass, each revealed in its pocket.", x: 315, y: 130 },
  { n: "03", title: "Activate", text: "Paste a card into the AIGO lesson or your own Claude. It answers ▶ ITEM ACTIVATED and becomes your coach.", x: 500, y: 300 },
  { n: "04", title: "Learn on real work", text: "Short lessons with your emails and reports. A star or a stamp only when Claude checks the result.", x: 685, y: 140 },
  { n: "05", title: "Prove it", text: "The Lock: five tasks on your work. 90+ makes the card holographic; a result code brings it home.", x: 880, y: 260 },
];

export const BENEFITS: readonly string[] = [
  "every card is an item: its own art, story, rarity and number",
  "lessons on your real work: emails, reports, meeting notes",
  "stars and stamps only when Claude checks what you did",
  "a stamp book that reads like a list of what you can do",
  "help mid-task: one better move, then back to work",
  "starts in your browser, then works in your own Claude",
  "nothing expires: no streaks, no timers, no lectures",
];

export const KEPT: readonly { from: string; name: string; text: string }[] = [
  { from: "POKÉMON TCG, HEARTHSTONE", name: "Pack openings", text: "A card reveal, with nothing random" },
  { from: "HEARTHSTONE GOLDEN CARDS", name: "Holo foils", text: "Earned for mastery: 90+ on the test" },
  { from: "TRADING CARDS", name: "Rarity and set numbers", text: "● ◆ ★ show how deep a skill goes" },
  { from: "CLUB PENGUIN", name: "Stamp books", text: "Each stamp is a skill you used" },
  { from: "WEBKINZ, CHEAT CODES", name: "Secret codes", text: "Result codes bring progress home" },
  { from: "POKÉDEX", name: "“???” silhouettes", text: "You see what's ahead" },
];

export const LEFT_BEHIND: readonly string[] = ["Streaks and daily guilt", "Random loot boxes", "Timers and energy", "Leaderboards", "In-app coins"];

export const FREE_TICKET: readonly { bold?: string; text: string }[] = [
  { bold: "Core path:", text: "7 skills, 21 cards" },
  { text: "Lessons in AIGO and in your own Claude" },
  { text: "Stars, stamp book, set badges, holo cards" },
  { text: "Result codes from your own Claude" },
  { text: "Cards updated when Claude changes" },
];

export const PREMIUM_TICKET: readonly { bold?: string; text: string }[] = [
  { text: "Everything in Free" },
  { bold: "AIGO Connector", text: "for Claude: your collection inside Claude, progress saves itself" },
  { bold: "Full path:", text: "Power user and Automator, 24 more ★ Legendary cards" },
  { bold: "New cards every month", text: ", after each Claude release" },
  { bold: "Promotion Kit:", text: "your proven skills on one page for your manager" },
  { text: "Priority support" },
];

export interface RoadmapColumn {
  tag: "NOW" | "NEXT" | "THEN";
  title: string;
  color: string;
  items: readonly string[];
  why: string;
}

export const ROADMAP: readonly RoadmapColumn[] = [
  {
    tag: "NOW",
    title: "This demo",
    color: "#6AF7FF",
    items: ["Set 01: Key, Lock, Compass", "AIGO lesson on the Claude API", "Work chat with the Help card", "Stars, stamps, result codes", "Premium checkout in test mode"],
    why: "Live today. Try it as John.",
  },
  {
    tag: "NEXT",
    title: "Free at launch",
    color: "#3B82FF",
    items: ["Sets 02–07: the core path", "21 cards with their own art and stories", "Card updates when Claude changes"],
    why: "Same lesson and test templates. New sets are writing, not new code.",
  },
  {
    tag: "THEN",
    title: "Premium",
    color: "#FF8AD9",
    items: ["AIGO Connector for Claude", "Power user and Automator paths", "Monthly card drops", "Promotion Kit, priority support"],
    why: "The connector is an MCP server: Claude already supports custom connectors, even on the free plan. The Kit exports data AIGO already stores.",
  },
];

// ───────────────────────── Premium page ─────────────────────────

export interface PlanRow {
  title: string;
  why?: string;
}
export interface PlanColumn {
  label: string;
  heading: string;
  price: string | null;
  rows: readonly PlanRow[];
  footnote?: string;
}

export const PLAN_COLUMNS: readonly PlanColumn[] = [
  {
    label: "In this demo",
    heading: "Set 01, working today",
    price: null,
    rows: [
      { title: "Set 01 · The Clear Ask: Key, Lock, Compass" },
      { title: "The AIGO lesson on the Claude API" },
      { title: "Work chat with the Help card" },
      { title: "Stars, stamps, set badge, holo card" },
      { title: "Result codes from your own Claude" },
      { title: "Premium checkout in test mode" },
    ],
  },
  {
    label: "Free · at launch",
    heading: "The core path",
    price: "$0",
    rows: [
      { title: "Core path: 7 skills, 21 cards", why: "Sets 01–07, each with its own items and stories" },
      { title: "Lessons in AIGO and in your own Claude" },
      { title: "Stamp book, set badges, holo cards" },
      { title: "Card updates when Claude changes" },
    ],
    footnote: "Same lesson and test templates as Set 01: new sets are writing, not new code.",
  },
  {
    label: "Premium · at launch",
    heading: "The full path",
    price: `$${PRICE_USD_PER_MONTH}`,
    rows: [
      { title: "AIGO Connector for Claude", why: "an MCP server; Claude supports custom connectors on every plan" },
      { title: "Full path: Power user + Automator", why: "24 more cards in the same format as Set 01" },
      { title: "New cards every month", why: "a content release timed to Claude's updates" },
      { title: "Promotion Kit", why: "one page of stamps, scores and work samples AIGO already stores" },
      { title: "Priority support", why: "Email, reply within a day" },
    ],
  },
];

/** Exact ticket heading: "IN THIS DEMO · LIVE NOW", "FREE · AT LAUNCH $0", "PREMIUM · AT LAUNCH $7 / MONTH". */
export function planTicketTitle(c: PlanColumn): string {
  const label = c.label.toUpperCase();
  if (c.price === null) return `${label} · LIVE NOW`;
  return `${label} ${c.price}${c.price === "$0" ? "" : " / MONTH"}`;
}

export const PATH_TILES: readonly { title: string; sets: string; first: number; skills: readonly string[] }[] = [
  { title: "Power user path", sets: "SETS 08–11", first: 8, skills: ["Artifacts", "Research", "Files & data", "Skills"] },
  { title: "Automator path", sets: "SETS 12–15", first: 12, skills: ["Claude Code", "Agents", "Connectors", "Automations"] },
];

export const PROMISES: readonly { title: string; text: string }[] = [
  { title: "Free stays free", text: "The core path never goes behind the paywall." },
  { title: "Cancel anytime", text: "Your cards, stars and stamps stay with you." },
  { title: "No streaks, no guilt", text: "Learn when your week allows. Nothing expires." },
];
