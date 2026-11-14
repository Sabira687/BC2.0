/**
 * Album and stamp book (pure view models): the collection grouped by set with
 * counters, silhouettes and per-card stars, and the 12 technique stamps
 * grouped by difficulty. No UI here.
 */
import type { AppState, ItemId, ItemKind, ModuleId, Stars, StampId, TechniqueCode } from "./types";
import { MODULES, itemFor, rarityOfSet, setNumberOf, tierOfSet, type Rarity, type Tier } from "./content";
import { CATALOG } from "./content/catalog";
import { TECHNIQUES } from "./content/techniques";
import { itemSummary } from "./generator";
import { collection, setBadge, type CollectionItem, type ItemStatus } from "./progress";
import { START_BY_LEVEL } from "./program";
import { MODULE_IDS } from "./tokens";


export interface AlbumCard {
  id: ItemId;
  kind: ItemKind;
  status: ItemStatus;
  /** Stars shown on the card; null for HELP (no stars). */
  stars: Stars | null;
  /** TEST with 3 stars. */
  holo: boolean;
  flavor: string;
  /** Item name (Three-Tooth Key), or the set title while the item is not written. */
  name: string;
  lore: string;
  rarity: Rarity;
  reason?: string;
  /** Silhouette card of a set that is not open (no real item behind it). */
  locked?: boolean;
}

export interface AlbumSet {
  module: ModuleId;
  /** "01".."08" */
  number: string;
  /** "???" while the set is a silhouette. */
  title: string;
  /** open: cards shown; locked: silhouette (the demo opens only the start set). */
  state: "open" | "locked";
  /** Free at launch (01-07) or Premium (08+). */
  tier: Tier;
  rarity: Rarity;
  /** Created cards out of all cards of the set, e.g. "1 / 3". */
  counter: string;
  cards: AlbumCard[];
  /** Silhouette text for locked and pro sets. */
  note?: string;
  badge: { earned: boolean; holo: boolean };
}

function starsOf(state: AppState, item: CollectionItem): Stars | null {
  if (item.kind === "help" || item.module === null) return null;
  return item.kind === "learn" ? (state.learnStars[item.module] ?? 0) : (state.results[item.module]?.stars ?? 0);
}

/** The album from the start set onward: every set with its cards, counter and badge. HELP sits in the start set (Set 01 for the default path). */
export function albumOf(state: AppState): AlbumSet[] {
  const items = collection(state);
  const start = START_BY_LEVEL[state.profile.level];
  const sets: AlbumSet[] = [];

  for (const m of MODULE_IDS.slice(MODULE_IDS.indexOf(start))) {
    const own = items.filter((it) => it.module === m);
    const help = m === start ? items.find((it) => it.kind === "help") : undefined;
    const all = help ? [...own, help] : own;
    const number = m.slice(1).padStart(2, "0");
    const created = all.filter((it) => it.status === "created").length;
    const total = all.length > 0 ? all.length : 2;
    const learn = own.find((it) => it.kind === "learn");
    const state_: AlbumSet["state"] = !learn || learn.status === "soon" || learn.status === "locked" || learn.status === "pro" ? "locked" : "open";
    const n = setNumberOf(m);
    const tier = tierOfSet(n);
    const silhouette = state_ !== "open";
    const title = MODULES.find((x) => x.id === m)?.title ?? m;
    sets.push({
      module: m,
      number,
      title: state_ === "locked" ? "???" : title,
      tier,
      rarity: rarityOfSet(n),
      state: state_,
      counter: `${created} / ${total}`,
      cards: silhouette
        ? []
        : all.map((it) => {
            const stars = starsOf(state, it);
            return {
              id: it.id,
              kind: it.kind,
              status: it.status,
              stars,
              holo: it.kind === "test" && stars === 3,
              flavor: itemSummary(state.profile, it.module, it.kind).flavor,
              ...(({ name, lore, rarity }) => ({ name, lore, rarity }))(itemFor(it.module, it.kind)),
              reason: it.reason,
            };
          }),
      note: silhouette ? (tier === "premium" ? "Premium · arrives at launch" : "Free · after the demo") : undefined,
      badge: setBadge(state, m),
    });
  }
  return sets;
}

// ───────────────────────── Stamp book ─────────────────────────

export type Difficulty = "Easy" | "Medium" | "Hard";

export interface StampEntry {
  id: StampId;
  /** Technique name when earned, "???" otherwise. */
  label: string;
  earned: boolean;
}

export interface StampBook {
  playerOne: StampEntry;
  groups: { difficulty: Difficulty; stamps: StampEntry[] }[];
}

/** Technique codes 1–5 Easy, 6–9 Medium, A–C Hard (approved canvas). */
export function difficultyOf(code: TechniqueCode): Difficulty {
  return "12345".includes(code) ? "Easy" : "6789".includes(code) ? "Medium" : "Hard";
}

export function stampBook(state: AppState): StampBook {
  const has = new Set<StampId>(state.stamps);
  const groups: StampBook["groups"] = (["Easy", "Medium", "Hard"] as const).map((difficulty) => ({
    difficulty,
    stamps: TECHNIQUES.filter((t) => difficultyOf(t.code) === difficulty).map((t) => {
      const earned = has.has(t.code);
      return { id: t.code, label: earned ? t.name : "???", earned };
    }),
  }));
  return { playerOne: { id: "player_one", label: "Player One", earned: has.has("player_one") }, groups };
}

/** Counter totals shown everywhere (Collection hero, Progress): 15 sets on the shelf, 12 technique stamps + Player One. */
export const SET_BADGE_TOTAL = CATALOG.length;
export const STAMP_TOTAL = TECHNIQUES.length + 1;

/** Earned / total for set badges and stamps; the totals are the shelf's own (every set, free or premium). */
export function collectionCounters(state: AppState): { badges: { earned: number; total: number }; stamps: { earned: number; total: number } } {
  return {
    badges: { earned: albumOf(state).filter((s) => s.badge.earned).length, total: SET_BADGE_TOTAL },
    stamps: { earned: state.stamps.length, total: STAMP_TOTAL },
  };
}
