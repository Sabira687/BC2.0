import { describe, expect, it } from "vitest";
import { SET_BADGE_TOTAL, STAMP_TOTAL, albumOf, collectionCounters, stampBook } from "./album";
import { stampPassport } from "./progressview";
import { fullAlbum } from "./albumQuery";
import { activateSubscription, createInitialState, createItem, fastForwardDemo } from "./progress";
import { seededRandom } from "./testutil";
import { TECHNIQUES } from "./content/techniques";
import type { AppState } from "./types";

const fresh = (): AppState => createInitialState(seededRandom(7));

describe("albumOf", () => {
  it("starts with Set 01 open, 0 / 3, later sets as silhouettes", () => {
    const sets = albumOf(fresh());
    expect(sets).toHaveLength(8);
    expect(sets[0]).toMatchObject({ number: "01", title: "The Clear Ask", state: "open", counter: "0 / 3" });
    expect(sets[0]!.cards.map((c) => c.kind)).toEqual(["learn", "test", "help"]);
    expect(sets[1]).toMatchObject({ number: "02", state: "locked", title: "???", counter: "0 / 2" });
    expect(sets[1]!.note).toBe("Free · after the demo");
    expect(sets[1]!.cards).toEqual([]);
  });

  it("counts created cards, including HELP, in Set 01", () => {
    let s = fresh();
    s = createItem(s, "learn:m1");
    s = createItem(s, "help");
    const set = albumOf(s)[0]!;
    expect(set.counter).toBe("2 / 3");
    expect(set.cards.map((c) => c.status)).toEqual(["created", "available", "created"]);
  });

  it("shows stars, flavor and no stars for HELP", () => {
    const s: AppState = { ...fresh(), learnStars: { m1: 2 } };
    const [learn, test, help] = albumOf(s)[0]!.cards;
    expect(learn).toMatchObject({ stars: 2, holo: false, flavor: "Ask once. Get it right." });
    expect(test).toMatchObject({ stars: 0, flavor: "Prove it in five tasks." });
    expect(help!.stars).toBeNull();
    expect(help!.flavor).toBe("One better move, right when you need it.");
  });

  it("marks TEST 3 stars as holographic after the demo fast-forward", () => {
    const set = albumOf(fastForwardDemo(fresh()))[0]!;
    expect(set.cards[1]).toMatchObject({ stars: 3, holo: true });
    expect(set.cards[0]).toMatchObject({ stars: 3, holo: false });
    expect(set.badge).toEqual({ earned: true, holo: true });
    expect(set.counter).toBe("3 / 3");
  });

  it("shows later sets as silhouettes with tier and rarity, even after a pass", () => {
    const sets = albumOf(fastForwardDemo(fresh()));
    expect(sets[0]).toMatchObject({ tier: "free", rarity: "common" });
    expect(sets[1]).toMatchObject({ state: "locked", title: "???", cards: [], tier: "free", rarity: "common" });
    expect(sets[1]!.note).toBe("Free · after the demo");
    expect(sets[3]).toMatchObject({ tier: "free", rarity: "rare" });
    expect(sets[7]).toMatchObject({ state: "locked", tier: "premium", rarity: "legendary" });
    expect(sets[7]!.note).toBe("Premium · arrives at launch");
  });

  it("Premium test mode opens nothing beyond Set 01", () => {
    const sets = albumOf({ ...fastForwardDemo(fresh()), subscription: { active: true, since: "2026-01-01T00:00:00.000Z" } });
    expect(sets.slice(1).every((s) => s.state === "locked" && s.cards.length === 0)).toBe(true);
  });

  it("activateSubscription does not open set 02 in albumOf", () => {
    const sets = albumOf(activateSubscription(fresh()));
    expect(sets[1]!.state).toBe("locked");
    expect(sets[1]!.cards).toEqual([]);
    expect(sets[0]!.state).toBe(albumOf(fresh())[0]!.state);
  });

  it("cards carry the item name, lore and rarity", () => {
    const [learn, test, help] = albumOf(fresh())[0]!.cards;
    expect(learn).toMatchObject({ name: "Three-Tooth Key", rarity: "common" });
    expect(test).toMatchObject({ name: "Proving Lock", rarity: "common" });
    expect(help).toMatchObject({ name: "Pocket Compass", rarity: "common" });
    expect(learn!.lore).toMatch(/^Forged for doors/);
  });

  it("set badge and stamp totals match the shelf and the passport", () => {
    expect(SET_BADGE_TOTAL).toBe(15);
    expect(fullAlbum(fresh())).toHaveLength(SET_BADGE_TOTAL);
    expect(stampPassport(fresh()).total).toBe(STAMP_TOTAL);
    expect(collectionCounters(fresh())).toEqual({ badges: { earned: 0, total: 15 }, stamps: { earned: 1, total: 13 } });
    expect(collectionCounters(fastForwardDemo(fresh())).badges).toEqual({ earned: 1, total: 15 });
  });
});

describe("stampBook", () => {
  it("lists 12 techniques plus Player One, earned vs ???", () => {
    const book = stampBook(fresh());
    expect(book.playerOne).toEqual({ id: "player_one", label: "Player One", earned: true });
    const all = book.groups.flatMap((g) => g.stamps);
    expect(all).toHaveLength(TECHNIQUES.length);
    expect(all.every((s) => !s.earned && s.label === "???")).toBe(true);
  });

  it("groups Easy = codes 1-5, Medium = 6-9, Hard = A-C", () => {
    const book = stampBook(fresh());
    expect(book.groups.map((g) => g.difficulty)).toEqual(["Easy", "Medium", "Hard"]);
    const easy = book.groups[0]!.stamps.map((s) => s.id);
    expect(easy).toEqual(["1", "2", "3", "4", "5"]);
    expect(book.groups[1]!.stamps.map((s) => s.id)).toEqual(["6", "7", "8", "9"]);
    expect(book.groups[2]!.stamps.map((s) => s.id)).toEqual(["A", "B", "C"]);
  });

  it("shows the name of an earned stamp", () => {
    const book = stampBook(fastForwardDemo(fresh()));
    const one = book.groups[0]!.stamps.find((s) => s.id === "1")!;
    expect(one).toMatchObject({ earned: true, label: TECHNIQUES[0]!.name });
  });
});
