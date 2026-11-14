import { describe, expect, it } from "vitest";
import { createInitialState, fastForwardDemo } from "./progress";
import { seededRandom } from "./testutil";
import { setSky, skyNeighbours, skySet } from "./sky";
import type { AppState } from "./types";

const fresh = (): AppState => createInitialState(seededRandom(3));
const demo = (): AppState => fastForwardDemo(fresh());

describe("skySet (plan interface)", () => {
  it("new player: nothing lit, next is l1", () => {
    const sky = skySet(fresh(), "m1");
    expect(sky.map((s) => s.id)).toEqual(["l1", "l2", "l3", "final", "test", "help", "badge"]);
    expect(sky.every((s) => !s.lit)).toBe(true);
    expect(sky.filter((s) => s.next).map((s) => s.id)).toEqual(["l1"]);
    expect(sky.every((s) => s.label.length > 3)).toBe(true);
  });
  it("learnStars 1: l1 lit, next l2", () => {
    const sky = skySet({ ...fresh(), learnStars: { m1: 1 as const } }, "m1");
    expect(sky.filter((s) => s.lit).map((s) => s.id)).toEqual(["l1"]);
    expect(sky.find((s) => s.next)?.id).toBe("l2");
  });
  it("after fast-forward all 7 lit, no next", () => {
    const sky = skySet(demo(), "m1");
    expect(sky.filter((s) => s.lit)).toHaveLength(7);
    expect(sky.some((s) => s.next)).toBe(false);
  });
});

describe("setSky: stars lit from real state", () => {
  it("a fresh state has nothing lit, next star is lesson 1.1", () => {
    const sky = setSky(fresh());
    expect(sky.lit).toBe(0);
    expect(sky.next?.id).toBe("l1");
    expect(sky.complete).toBe(false);
  });
  it("learn stars light lessons in order; 3 stars light 1.3 and the final task", () => {
    const s = { ...fresh(), learnStars: { m1: 2 as const } };
    const sky = setSky(s);
    expect(sky.stars.filter((x) => x.lit).map((x) => x.id)).toEqual(["l1", "l2"]);
    expect(sky.next?.id).toBe("l3");
    expect(setSky({ ...s, learnStars: { m1: 3 as const } }).stars.filter((x) => x.lit)).toHaveLength(4);
  });
  it("help lights the compass star; the demo lights all seven", () => {
    expect(setSky({ ...fresh(), helpUsed: true }).stars.find((x) => x.id === "help")?.lit).toBe(true);
    const sky = setSky(demo());
    expect(sky.lit).toBe(7);
    expect(sky.complete).toBe(true);
    expect(sky.next).toBeNull();
    expect(sky.countText).toBe("7 / 7");
  });
  it("a failed test does not light the test star", () => {
    const s = demo();
    const bad = { ...s, results: { m1: { ...s.results.m1!, score: 40, stars: 0 as const } }, stamps: s.stamps };
    expect(setSky(bad).stars.find((x) => x.id === "test")?.lit).toBe(false);
  });
});

describe("skyNeighbours", () => {
  it("Player One is lit, 02/03 say FREE, Premium is gold", () => {
    const n = skyNeighbours(fresh());
    expect(n.map((x) => x.id)).toEqual(["player_one", "s02", "s03", "premium"]);
    expect(n[0]).toMatchObject({ tone: "lit", sub: "GIFT · LIT" });
    expect(n[1]).toMatchObject({ name: "02 · ITERATE", sub: "FREE", tone: "dim" });
    expect(n[2]).toMatchObject({ name: "03 · SHOW, DON'T TELL", sub: "FREE" });
    expect(n[3]).toMatchObject({ tone: "gold", sub: "8 CONSTELLATIONS" });
  });
  it("after Set 01 is complete, 02/03 say AT LAUNCH", () => {
    const n = skyNeighbours(demo());
    expect(n[1]).toMatchObject({ sub: "AT LAUNCH", tone: "bright" });
    expect(n[2]).toMatchObject({ sub: "AT LAUNCH", tone: "bright" });
  });
});
