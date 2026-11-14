/** "Your next step" banner and small card-view helpers (pure; real state only). */
import type { AppState, ItemId, ItemKind, ModuleId } from "./types";
import { getModule } from "./content";
import { testStars } from "./scoring";
import { albumOf, type AlbumCard, type AlbumSet } from "./album";
import type { Rarity } from "./content";

export interface NextStep {
  title: string;
  text: string;
  href: string;
  cta: string;
  /** Set when the CTA creates this card (and plays the reveal) instead of following the link. */
  create?: ItemId;
  /** Set when the CTA opens this whole set (creates its three items and plays the reveal). */
  openSet?: ModuleId;
  /** Small caption under the CTA. */
  note?: string;
}

export function cardProperties(kind: ItemKind): string {
  return kind === "learn" ? "Learn · 3 lessons · ~10 min" : kind === "test" ? "Test · 5 tasks · ~5 min" : "Help · any task · ~1 min";
}

const ORDER: Record<ItemKind, number> = { learn: 1, test: 2, help: 3 };

/** "S01 · 1/3": position of the card inside its set. */
export function setLabel(number: string, kind: ItemKind): string {
  return `S${number} · ${ORDER[kind]}/3`;
}

function lessonList(module: ModuleId): { id: string; title: string }[] {
  const m = getModule(module);
  return m.lessons ?? m.outline;
}

export function nextStep(state: AppState): NextStep {
  const sets = albumOf(state);
  for (const set of sets) {
    if (set.state !== "open") break;
    const m = set.module;
    const stars = state.learnStars[m] ?? 0;
    const lessons = lessonList(m);
    if (stars < 3) {
      const lesson = lessons[Math.min(stars, 2)];
      const num = lesson ? lesson.id.slice(1) : `${set.number}.${stars + 1}`;
      const name = lesson?.title ?? set.title;
      return {
        title: `${stars === 0 ? "Start" : "Continue"} Lesson ${num} · ${name}`,
        text: stars === 0 ? "About 5 minutes. Your first lesson earns the LEARN card its first star." : `About 5 minutes. This lesson moves your LEARN card toward star ${stars + 1}.`,
        href: "/console",
        ...(state.created.includes(`learn:${m}`)
          ? { cta: "Open lesson" }
          : state.created.length === 0
            ? { cta: `OPEN SET ${set.number}`, openSet: m, note: "3 items made for you" }
            : { cta: "Create Learn card", create: `learn:${m}` as ItemId }),
      };
    }
    const result = state.results[m];
    const testMade = state.created.includes(`test:${m}`);
    if (!result || testStars(result.score) < 2) {
      return {
        title: result ? `Retake the TEST · Set ${set.number}` : `Take the TEST · Set ${set.number}`,
        text: "Five tasks, about 5 minutes. The set badge needs two stars or more.",
        href: testMade ? "/item/test" : "/collection",
        cta: testMade ? "Open TEST card" : "Create TEST card",
      };
    }
    if (!state.helpUsed) {
      const made = state.created.includes("help");
      return {
        title: "Use HELP once in real work",
        text: "HELP gives one better move when you are stuck. Using it once completes the set badge.",
        href: made ? "/item/help" : "/collection",
        cta: made ? "Open HELP card" : "Create HELP card",
      };
    }
  }
  const later = sets.filter((s) => s.state !== "open" && s.tier === "free").slice(0, 2);
  const names = later.map((s) => `Set ${s.number} · ${getModule(s.module).title}`);
  return {
    title: "This set is complete",
    text: names.length > 0 ? `${names.join(" and ")} ${names.length > 1 ? "are" : "is"} free at launch; this demo ends at Set 01.` : "More cards are on the way.",
    href: "/progress",
    cta: "See progress",
  };
}

export interface CardFace {
  kind: ItemKind;
  /** Item name (Three-Tooth Key). */
  title: string;
  /** Set title in caps (THE CLEAR ASK). */
  overline: string;
  rarity: Rarity;
  /** Written items have their own art. */
  art: boolean;
  flavor: string;
  stars: number | undefined;
  setLabel: string;
  properties: string;
}

/** What a Card shows for an album card: item name as title, set title as overline, rarity, art. */
export function cardFace(card: AlbumCard, set: Pick<AlbumSet, "number" | "title" | "module">): CardFace {
  const setTitle = getModule(set.module).title;
  return {
    kind: card.kind,
    title: card.name,
    overline: setTitle.toUpperCase(),
    rarity: card.rarity,
    art: card.name !== setTitle,
    flavor: card.flavor,
    stars: card.stars ?? undefined,
    setLabel: setLabel(set.number, card.kind),
    properties: cardProperties(card.kind),
  };
}
