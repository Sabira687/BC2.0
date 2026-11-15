/**
 * The skill sky (pure): the Set 01 constellation, one star per verified step,
 * and the dim neighbouring constellations. Real data only.
 */
import type { AppState, ModuleId } from "./types";
import { MODULES } from "./content";
import { setBadge } from "./progress";
import { stampBook } from "./album";

export interface SkyStar {
  id: "l1" | "l2" | "l3" | "final" | "test" | "help" | "badge";
  label: string;
  lit: boolean;
  /** The first star that is not lit yet. */
  next: boolean;
}

/** Each star is a step verified in the real state (lessons by LEARN stars, the test only if passed, help, the badge). */
export function skySet(state: AppState, module: ModuleId = "m1"): SkyStar[] {
  const ls = state.learnStars[module] ?? 0;
  const tested = (state.results[module]?.stars ?? 0) >= 2;
  const base: Omit<SkyStar, "next">[] = [
    { id: "l1", label: "1.1 The brief formula", lit: ls >= 1 },
    { id: "l2", label: "1.2 Ask for the shape", lit: ls >= 2 },
    { id: "l3", label: "1.3 Give it the material", lit: ls >= 3 },
    { id: "final", label: "Final task", lit: ls >= 3 },
    { id: "test", label: "Proving Lock · test", lit: tested },
    { id: "help", label: "Pocket Compass · help", lit: state.helpUsed },
    { id: "badge", label: "Set badge", lit: setBadge(state, module).earned },
  ];
  const firstDark = base.findIndex((s) => !s.lit);
  return base.map((s, i) => ({ ...s, next: i === firstDark }));
}

export interface SetSky {
  stars: SkyStar[];
  lit: number;
  /** "3 / 7" */
  countText: string;
  /** First star not lit yet, null when the set is complete. */
  next: SkyStar | null;
  complete: boolean;
}

export function setSky(state: AppState, module: ModuleId = "m1"): SetSky {
  const stars = skySet(state, module);
  const lit = stars.filter((s) => s.lit).length;
  return { stars, lit, countText: `${lit} / ${stars.length}`, next: stars.find((s) => s.next) ?? null, complete: lit === stars.length };
}

export interface SkyNeighbour {
  id: "player_one" | "s02" | "s03" | "premium";
  name: string;
  sub: string;
  tone: "lit" | "dim" | "bright" | "gold";
}

/** The constellations around Set 01: Player One (gift), Sets 02 and 03, and the Premium ones. */
export function skyNeighbours(state: AppState): SkyNeighbour[] {
  const one = stampBook(state).playerOne.earned;
  const done = setSky(state).complete;
  const title = (id: ModuleId) => (MODULES.find((m) => m.id === id)?.title ?? id).toUpperCase();
  return [
    { id: "player_one", name: "PLAYER ONE", sub: one ? "GIFT · LIT" : "GIFT", tone: one ? "lit" : "dim" },
    { id: "s02", name: `02 · ${title("m2")}`, sub: done ? "AT LAUNCH" : "FREE", tone: done ? "bright" : "dim" },
    { id: "s03", name: `03 · ${title("m3")}`, sub: done ? "AT LAUNCH" : "FREE", tone: done ? "bright" : "dim" },
    { id: "premium", name: "PREMIUM ★", sub: "8 CONSTELLATIONS", tone: "gold" },
  ];
}

/** Tooltip status of a Set 01 star. */
export function starStatus(star: Pick<SkyStar, "lit" | "next">): "Done" | "Next" | "Not yet" {
  return star.lit ? "Done" : star.next ? "Next" : "Not yet";
}

/** Tooltip text of a Set 01 star: the step name + status. */
export function starTip(star: Pick<SkyStar, "label" | "lit" | "next">): string {
  return `${star.label} · ${starStatus(star)}`;
}

/** Tooltip text of a neighbouring constellation. */
export function neighbourTip(n: Pick<SkyNeighbour, "id" | "tone">): string {
  if (n.id === "premium") return "Unlocks with Premium";
  if (n.id === "player_one") return n.tone === "lit" ? "Gift earned" : "A gift for finishing Set 01";
  return "Available at launch";
}
