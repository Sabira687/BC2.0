/** The full 45-item catalog (15 sets x 3): 21 Free (sets 01-07) + 24 Premium (sets 08-15). Pure data; only Set 01 is playable in the demo. */
import type { ItemKind } from "@/lib/types";
import { itemFor, rarityOfSet, tierOfSet, type Rarity, type Tier } from "./items";

export type ArtKey = "key" | "lock" | "compass";

export interface CatalogItem {
  kind: ItemKind;
  /** Item name (Three-Tooth Key) or the set title until the item is written. */
  name: string;
  rarity: Rarity;
  /** Illustration key; null falls back to the type shape (silhouette). */
  art: ArtKey | null;
}

export interface CatalogSet {
  /** "01".."15" */
  number: string;
  title: string;
  tier: Tier;
  rarity: Rarity;
  /** Premium learning path of sets 08-15. */
  path?: "Power user" | "Automator";
  playable: boolean;
  items: [CatalogItem, CatalogItem, CatalogItem];
}

const SET_TITLES: readonly string[] = [
  "The Clear Ask", "Iterate", "Show, Don't Tell", "Structure", "Trust but Verify", "Your Material", "Projects",
  "Artifacts", "Research", "Files & Data", "Skills", "Claude Code", "Agents", "Connectors", "Automations",
];
const KINDS: readonly ItemKind[] = ["learn", "test", "help"];
const ART_SET_1: Record<ItemKind, ArtKey> = { learn: "key", test: "lock", help: "compass" };

export const CATALOG: readonly CatalogSet[] = SET_TITLES.map((title, i) => {
  const n = i + 1;
  const rarity = rarityOfSet(n);
  const items = KINDS.map((kind): CatalogItem => {
    const info = n === 1 ? itemFor("m1", kind) : null;
    return { kind, name: info ? info.name : title, rarity, art: n === 1 ? ART_SET_1[kind] : null };
  }) as CatalogSet["items"];
  return {
    number: String(n).padStart(2, "0"),
    title,
    tier: tierOfSet(n),
    rarity,
    ...(n >= 8 ? { path: n <= 11 ? ("Power user" as const) : ("Automator" as const) } : {}),
    playable: n === 1,
    items,
  };
});

export const CATALOG_COUNTS = {
  total: CATALOG.length * 3,
  free: CATALOG.filter((s) => s.tier === "free").length * 3,
  premium: CATALOG.filter((s) => s.tier === "premium").length * 3,
};

export function catalogSet(number: string): CatalogSet {
  const s = CATALOG.find((x) => x.number === number);
  if (!s) throw new Error(`no set ${number}`);
  return s;
}

/** Non-throwing lookup: undefined for anything that is not a set number (e.g. a rarity group key). */
export function findCatalogSet(number: string): CatalogSet | undefined {
  return CATALOG.find((x) => x.number === number);
}
