import { describe, expect, it } from "vitest";
import { DEFAULT_QUERY, collectionLayout, fullAlbum, parseAlbumQuery, queryAlbum, serializeAlbumQuery } from "./albumQuery";
import { createInitialState, createItem } from "./progress";
import { seededRandom } from "./testutil";

const fresh = () => createInitialState(seededRandom(7));
const q = (o: Partial<typeof DEFAULT_QUERY> = {}) => ({ ...DEFAULT_QUERY, ...o });

describe("queryAlbum on the real new-player state", () => {
  const sets = fullAlbum(fresh());

  it("fullAlbum has 15 sets / 45 cards; only Set 01 is open, the rest are silhouettes", () => {
    expect(sets).toHaveLength(15);
    expect(sets.flatMap((s) => s.cards)).toHaveLength(45);
    expect(sets.filter((s) => s.state === "open").map((s) => s.number)).toEqual(["01"]);
    const sil = sets[7]!.cards[0]!;
    expect(sil).toMatchObject({ locked: true, kind: "learn", rarity: "legendary" });
  });

  it("by set: 15 groups, first 01, last 15", () => {
    const g = queryAlbum(sets, q());
    expect(g).toHaveLength(15);
    expect(g[0]!.key).toBe("01");
    expect(g[14]!.key).toBe("15");
    expect(g[0]!.cards[0]).toMatchObject({ set: "01", setTitle: "The Clear Ask" });
  });

  it("by rarity with locked on: legendary (Premium silhouettes), rare, common", () => {
    const g = queryAlbum(sets, q({ by: "rarity" }));
    expect(g.map((x) => x.key)).toEqual(["legendary", "rare", "common"]);
    expect(g[0]!.cards).toHaveLength(24);
    expect(g[0]!.cards.every((c) => c.locked)).toBe(true);
    expect(g[1]!.cards).toHaveLength(12);
    expect(g[2]!.cards).toHaveLength(9);
  });

  it("by rarity puts created cards first", () => {
    const s = fullAlbum(createItem(fresh(), "help"));
    const common = queryAlbum(s, q({ by: "rarity" })).find((x) => x.key === "common")!;
    expect(common.cards[0]).toMatchObject({ kind: "help", status: "created" });
  });

  it("by skill: one group per set, alphabetical, LEARN-TEST-HELP inside", () => {
    const g = queryAlbum(sets, q({ by: "skill" }));
    expect(g).toHaveLength(15);
    expect(g.map((x) => x.title)).toEqual([...g.map((x) => x.title)].sort((a, b) => a.localeCompare(b)));
    for (const grp of g) expect(grp.cards.map((c) => c.kind)).toEqual(["learn", "test", "help"]);
  });

  it("by skill: sets with created cards first, then alphabetical", () => {
    const g = queryAlbum(fullAlbum(createItem(fresh(), "help")), q({ by: "skill" }));
    expect(g[0]!.key).toBe("01");
    const rest = g.slice(1).map((x) => x.title);
    expect(rest).toEqual([...rest].sort((a, b) => a.localeCompare(b)));
  });

  it("type help: only help cards in every view, locked or not", () => {
    for (const by of ["set", "skill", "rarity"] as const) {
      const g = queryAlbum(sets, q({ by, type: "help" }));
      expect(g.length).toBeGreaterThan(0);
      for (const grp of g) for (const c of grp.cards) expect(c.kind).toBe("help");
    }
    expect(queryAlbum(sets, q({ by: "rarity", type: "help" })).flatMap((g) => g.cards).some((c) => c.locked)).toBe(true);
  });

  it("showLocked false: one group (Set 01), no silhouettes", () => {
    for (const by of ["set", "skill", "rarity"] as const) {
      const g = queryAlbum(sets, q({ by, showLocked: false }));
      expect(g.flatMap((x) => x.cards).every((c) => c.set === "01" && !c.locked)).toBe(true);
    }
    const g = queryAlbum(sets, q({ showLocked: false }));
    expect(g).toHaveLength(1);
    expect(g[0]!.key).toBe("01");
    expect(g[0]!.cards).toHaveLength(3);
  });
});

describe("album query URL", () => {
  it("parses valid params and ignores invalid ones", () => {
    expect(parseAlbumQuery(new URLSearchParams("by=rarity&type=learn&locked=0"))).toEqual({ by: "rarity", type: "learn", showLocked: false });
    expect(parseAlbumQuery(new URLSearchParams("by=zzz&type=x&locked=9"))).toEqual(DEFAULT_QUERY);
  });
  it("serializes only non-default values", () => {
    expect(serializeAlbumQuery(DEFAULT_QUERY)).toBe("");
    expect(serializeAlbumQuery(q({ by: "skill", type: "help", showLocked: false }))).toBe("by=skill&type=help&locked=0");
  });
});

describe("collectionLayout", () => {
  const sets = fullAlbum(createInitialState(seededRandom(7)));
  it("by set: Free band 01-07, Premium band 08-15", () => {
    const l = collectionLayout(queryAlbum(sets, q()), q());
    expect(l.mode).toBe("sets");
    if (l.mode !== "sets") return;
    expect(l.free.map((g) => g.key)).toEqual(["01", "02", "03", "04", "05", "06", "07"]);
    expect(l.premium).toHaveLength(8);
  });
  it("by rarity and skill: flat, no throw on non-set keys", () => {
    for (const by of ["rarity", "skill"] as const) {
      const l = collectionLayout(queryAlbum(sets, q({ by, type: "learn" })), q({ by, type: "learn" }));
      expect(l.mode).toBe("flat");
    }
    const r = collectionLayout(queryAlbum(sets, q({ by: "rarity" })), q({ by: "rarity" }));
    expect(r.mode === "flat" && r.groups.map((g) => g.key)).toEqual(["legendary", "rare", "common"]);
  });
  it("invalid URL values fall back to defaults", () => {
    expect(parseAlbumQuery(new URLSearchParams("by=xyz&type=zzz&locked=maybe"))).toEqual(DEFAULT_QUERY);
    expect(parseAlbumQuery(new URLSearchParams("by=rarity&type=zzz"))).toEqual({ ...DEFAULT_QUERY, by: "rarity" });
  });
});
