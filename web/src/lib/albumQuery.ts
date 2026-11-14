/** Collection sorting and filters (pure): groups the album by set, skill or rarity. */
import { albumOf, type AlbumCard, type AlbumSet } from "./album";
import { CATALOG, findCatalogSet } from "./content";
import type { AppState, ItemId, ItemKind } from "./types";

/** What the query needs from a set; AlbumSet fits, and so do catalog silhouettes. */
export type QuerySet = Pick<AlbumSet, "number" | "title" | "state" | "tier" | "rarity" | "counter" | "cards">;

/** All 15 sets: open sets carry real cards, every other set (unopened, Premium) is three silhouette cards. */
export function fullAlbum(state: AppState): QuerySet[] {
  const real = new Map(albumOf(state).map((s) => [s.number, s]));
  return CATALOG.map((cs) => {
    const own = real.get(cs.number);
    if (own && own.state === "open") return own;
    return {
      number: cs.number,
      title: cs.title,
      state: "locked" as const,
      tier: cs.tier,
      rarity: cs.rarity,
      counter: "0 / 3",
      cards: cs.items.map((it): AlbumCard => ({
        id: `locked:${cs.number}:${it.kind}` as ItemId,
        kind: it.kind,
        status: "locked",
        locked: true,
        stars: null,
        holo: false,
        flavor: "",
        name: cs.title,
        lore: "",
        rarity: cs.rarity,
      })),
    };
  });
}

export type AlbumBy = "set" | "skill" | "rarity";
export interface AlbumQuery {
  by: AlbumBy;
  type: "all" | ItemKind;
  showLocked: boolean;
}
export type AlbumGroupCard = AlbumCard & { set: string; setTitle: string };
export interface AlbumGroup {
  key: string;
  title: string;
  cards: AlbumGroupCard[];
}

export const DEFAULT_QUERY: AlbumQuery = { by: "set", type: "all", showLocked: true };

const KIND_ORDER: Record<ItemKind, number> = { learn: 0, test: 1, help: 2 };
const RARITIES = [
  ["legendary", "★ Legendary"],
  ["rare", "◆ Rare"],
  ["common", "● Common"],
] as const;

export function queryAlbum(sets: QuerySet[], q: AlbumQuery): AlbumGroup[] {
  const visible = sets.filter((s) => q.showLocked || s.state === "open");
  const wrap = (s: QuerySet): AlbumGroupCard[] =>
    s.cards.filter((c) => (q.type === "all" || c.kind === q.type) && (q.showLocked || !c.locked)).map((c) => ({ ...c, set: s.number, setTitle: s.title }));
  const byKind = (a: AlbumGroupCard, b: AlbumGroupCard) => KIND_ORDER[a.kind] - KIND_ORDER[b.kind];

  if (q.by === "set") {
    return [...visible]
      .sort((a, b) => a.number.localeCompare(b.number))
      .map((s) => ({ key: s.number, title: `Set ${s.number} · ${s.title}`, cards: wrap(s) }))
      .filter((g) => g.cards.length > 0);
  }
  if (q.by === "skill") {
    // collected sets (any created card, whatever the type filter) first, then alphabetical
    const collected = (s: QuerySet) => s.cards.some((c) => c.status === "created");
    return [...visible]
      .sort((a, b) => Number(collected(b)) - Number(collected(a)) || a.title.localeCompare(b.title))
      .map((s) => ({ key: s.number, title: s.title, cards: wrap(s).sort(byKind) }))
      .filter((g) => g.cards.length > 0);
  }
  const all = visible.flatMap(wrap);
  return RARITIES.map(([key, title]) => ({
    key,
    title,
    cards: all
      .filter((c) => c.rarity === key)
      .sort((a, b) => Number(b.status === "created") - Number(a.status === "created") || a.set.localeCompare(b.set) || byKind(a, b)),
  })).filter((g) => g.cards.length > 0);
}

export function parseAlbumQuery(p: URLSearchParams): AlbumQuery {
  const by = p.get("by");
  const type = p.get("type");
  const locked = p.get("locked");
  return {
    by: by === "skill" || by === "rarity" ? by : "set",
    type: type === "learn" || type === "test" || type === "help" ? type : "all",
    showLocked: locked !== "0",
  };
}

export function serializeAlbumQuery(q: AlbumQuery): string {
  const p = new URLSearchParams();
  if (q.by !== "set") p.set("by", q.by);
  if (q.type !== "all") p.set("type", q.type);
  if (!q.showLocked) p.set("locked", "0");
  return p.toString();
}

export type CollectionLayout =
  | { mode: "sets"; free: AlbumGroup[]; premium: AlbumGroup[] }
  | { mode: "flat"; groups: AlbumGroup[] };

/** How the groups are laid out: set view splits into the Free and Premium bands; skill/rarity are one flat list. Never throws on non-set keys. */
export function collectionLayout(groups: AlbumGroup[], q: AlbumQuery): CollectionLayout {
  if (q.by !== "set") return { mode: "flat", groups };
  const tier = (g: AlbumGroup) => findCatalogSet(g.key)?.tier;
  return { mode: "sets", free: groups.filter((g) => tier(g) === "free"), premium: groups.filter((g) => tier(g) === "premium") };
}
