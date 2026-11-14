/** Items (v4.1): every card is a named item with lore and rarity. Rarity and tier come from the set number. */
import type { ItemKind, ModuleId } from "@/lib/types";
import { MODULES } from "./modules";

export type Rarity = "common" | "rare" | "legendary";
export type Tier = "free" | "premium";

export interface ItemDef {
  name: string;
  lore: string;
  rarity: Rarity;
}

export const RARITY_META: Record<Rarity, { symbol: string; label: string; color: string }> = {
  common: { symbol: "●", label: "COMMON", color: "#475569" },
  rare: { symbol: "◆", label: "RARE", color: "#0E7490" },
  legendary: { symbol: "★", label: "LEGENDARY", color: "#B45309" },
};

/** Common sets 01-03, Rare 04-07, Legendary (Premium) 08 and up. */
export function rarityOfSet(n: number): Rarity {
  return n <= 3 ? "common" : n <= 7 ? "rare" : "legendary";
}

/** Free sets 01-07 at launch, Premium 08-15. */
export function tierOfSet(n: number): Tier {
  return n <= 7 ? "free" : "premium";
}

export function setNumberOf(m: ModuleId): number {
  return Number(m.slice(1));
}

export const HELP_ITEM: ItemDef = {
  name: "Pocket Compass",
  lore: "It won't walk the road for you. Lost mid-task? It points once, toward one better move, then goes quiet.",
  rarity: "common",
};

/** Written items (Set 01). Other sets fall back to the set title until their items are written. */
export const ITEMS: Partial<Record<ModuleId, Record<ItemKind, ItemDef>>> = {
  m1: {
    learn: {
      name: "Three-Tooth Key",
      lore: "Forged for doors that never open on the first knock. Its three teeth are who you are, what you need and how it should look. Miss one and the lock just spins.",
      rarity: "common",
    },
    test: {
      name: "Proving Lock",
      lore: "Five keyholes, no hints. It doesn't care how you learned, only whether your key is cut right.",
      rarity: "common",
    },
    help: HELP_ITEM,
  },
};

export interface ItemInfo extends ItemDef {
  /** false when the name is only the set title (item not written yet). */
  written: boolean;
}

/** HELP is one card for everyone (the Compass); LEARN/TEST use the module's item, else its title. */
export function itemFor(module: ModuleId | null, kind: ItemKind): ItemInfo {
  if (kind === "help" || module === null) return { ...HELP_ITEM, written: true };
  const def = ITEMS[module]?.[kind];
  if (def) return { ...def, written: true };
  const m = MODULES.find((x) => x.id === module);
  return { name: m?.title ?? module, lore: "", rarity: rarityOfSet(setNumberOf(module)), written: false };
}

/** Module a printed name belongs to: an item name or a set title (case-insensitive). */
export function moduleOfItemName(name: string): ModuleId | null {
  const n = name.trim().toLowerCase();
  for (const m of MODULES) {
    if (m.title.toLowerCase() === n) return m.id;
    const it = ITEMS[m.id];
    if (it && (it.learn.name.toLowerCase() === n || it.test.name.toLowerCase() === n)) return m.id;
  }
  return null;
}
