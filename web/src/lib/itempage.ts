/** View model for the item page (/item/[kind]): stats, stamps and quest log from real state. Pure; no UI. */
import type { AppState, ItemId, ItemKind, Stars } from "./types";
import { RARITY_META, getModule, itemFor, type Rarity } from "./content";
import { TECHNIQUES, TECHNIQUE_ALIASES } from "./content/techniques";
import { albumOf } from "./album";
import { kindOf, moduleOfItem, setBadgeSteps } from "./progress";
import { testStars } from "./scoring";
import { itemSummary } from "./generator";

export interface QuestRow {
  code: string;
  title: string;
  status: "done" | "next" | "locked";
}

export interface ItemPageModel {
  kind: ItemKind;
  name: string;
  lore: string;
  rarity: Rarity;
  rarityLabel: string;
  setNumber: string;
  setTitle: string;
  /** "1/3": place of the item inside its set. */
  position: string;
  /** null for HELP. */
  stars: Stars | null;
  stats: { label: string; value: string }[];
  stamps: { code: string; label: string; earned: boolean }[];
  /** The "Use:" line of the tooltip. */
  use: string;
  quest: QuestRow[];
}

const ORDER: Record<ItemKind, number> = { learn: 1, test: 2, help: 3 };

function stampLabel(code: string): string {
  return TECHNIQUE_ALIASES[code]?.[0] ?? TECHNIQUES.find((t) => t.code === code)?.name ?? code;
}

function questFrom(rows: { code: string; title: string; done: boolean }[]): QuestRow[] {
  const next = rows.findIndex((r) => !r.done);
  return rows.map((r, i) => ({ code: r.code, title: r.title, status: r.done ? "done" : i === next ? "next" : "locked" }));
}

export function itemPageModel(state: AppState, id: ItemId): ItemPageModel {
  const kind = kindOf(id);
  const module = moduleOfItem(id);
  const set = albumOf(state).find((s) => s.cards.some((c) => c.id === id));
  const mod = getModule(module ?? set?.module ?? "m1");
  const item = itemFor(module, kind);
  const learnStars = module ? (state.learnStars[module] ?? 0) : 0;
  const result = module ? state.results[module] : undefined;
  const stars: Stars | null = kind === "help" ? null : kind === "learn" ? (learnStars as Stars) : ((result ? testStars(result.score) : 0) as Stars);
  const setNumber = set?.number ?? "01";
  const worksIn = mod.runsIn === "console" ? "AIGO console · your own AI" : "your own AI";

  const practice = itemSummary(state.profile, module, kind).project;
  const stats: ItemPageModel["stats"] = [];
  let quest: QuestRow[];
  let use: string;
  if (kind === "learn") {
    const lessons = (mod.lessons ?? mod.outline).filter((l) => !l.id.endsWith("boss"));
    const nextLesson = `${setNumber.replace(/^0/, "")}.${Math.min(learnStars + 1, lessons.length)}`;
    stats.push(
      { label: "LESSONS", value: `${lessons.length} lessons + a final task` },
      { label: "TIME", value: "about 10 minutes" },
      { label: "PRACTICE ON", value: practice },
      { label: "WORKS IN", value: worksIn },
      { label: "STARS", value: learnStars >= 3 ? "3 of 3 · complete" : `${learnStars} of 3 · next star: finish Lesson ${nextLesson}` },
    );
    quest = questFrom([
      ...lessons.map((l, i) => ({ code: l.id.slice(1), title: l.title, done: learnStars > i })),
      { code: "FINAL", title: "Final task", done: learnStars === 3 },
    ]);
    use = `paste into a new chat. your AI teaches you ${mod.title}.`;
  } else if (kind === "test") {
    stats.push(
      { label: "TASKS", value: "3 questions + 2 practical tasks" },
      { label: "TIME", value: "about 5 minutes" },
      { label: "BEST SCORE", value: result ? `${result.score}/100` : "not taken yet" },
      { label: "WORKS IN", value: worksIn },
      { label: "STARS", value: `${stars} of 3` },
    );
    const s = stars ?? 0;
    quest = questFrom([
      { code: "T1", title: "Take the TEST (5 tasks)", done: !!result },
      { code: "T2", title: "Score 70+ for ★★", done: s >= 2 },
      { code: "T3", title: "Score 90+ for ★★★ (holo)", done: s >= 3 },
    ]);
    use = `paste into a new chat after the set's LEARN. Claude runs 5 tasks and ends with a RESULT CODE.`;
  } else {
    const badge = setBadgeSteps(state, set?.module ?? "m1");
    stats.push(
      { label: "USE", value: "any moment, mid-task" },
      { label: "TIME", value: "about 1 minute" },
      { label: "WORKS IN", value: "AIGO console · your own AI" },
      { label: "USED", value: state.helpUsed ? "yes" : "not yet" },
      { label: "SET BADGE", value: `${badge.done} of ${badge.total} steps` },
    );
    quest = questFrom([{ code: "H1", title: "Use HELP once", done: state.helpUsed }]);
    use = "paste it mid-task. Claude helps once, then the chat goes on as usual.";
  }

  // state.stamps is the single source of truth (capture adds a stamp when Claude prints STAMP EARNED).
  const stamps =
    kind === "help"
      ? []
      : mod.techniques.map((code) => ({ code, label: stampLabel(code), earned: state.stamps.includes(code) }));

  return {
    kind,
    name: item.name,
    lore: item.lore ?? "",
    rarity: item.rarity,
    rarityLabel: `${RARITY_META[item.rarity].symbol} ${RARITY_META[item.rarity].label}`,
    setNumber,
    setTitle: mod.title,
    position: `${ORDER[kind]}/3`,
    stars,
    stats,
    stamps,
    use,
    quest,
  };
}

/** Flat view of an item page for tooltips and tests; wraps itemPageModel (one implementation). */
export interface ItemStats {
  lessons: string;
  time: string;
  practiceOn: string;
  worksIn: string;
  stars: Stars | null;
  stamps: { name: string; earned: boolean }[];
  use: string;
  story: string;
}

export function itemStats(state: AppState, id: ItemId): ItemStats {
  const m = itemPageModel(state, id);
  const stat = (label: string) => m.stats.find((x) => x.label === label)?.value ?? "";
  const use = m.use.charAt(0).toUpperCase() + m.use.slice(1);
  return {
    lessons: stat("LESSONS") || stat("TASKS") || stat("USE"),
    time: stat("TIME"),
    practiceOn: stat("PRACTICE ON"),
    worksIn: stat("WORKS IN"),
    stars: m.stars,
    stamps: m.stamps.map((s) => ({ name: s.label, earned: s.earned })),
    use,
    story: m.lore,
  };
}
