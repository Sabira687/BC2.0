import { describe, expect, it } from "vitest";
import { DEMO_SNAPSHOT_KEY, canLeaveDemo, clearDemoSnapshot, enterDemo, leaveDemo, loadDemoSnapshot, saveDemoSnapshot } from "./demo";
import { STORAGE_KEY } from "./store";
import { createInitialState, createItem, fastForwardDemo } from "./progress";
import { seededRandom } from "./testutil";
import type { KeyValueStorage } from "./store";

function fakeStorage(): KeyValueStorage & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
    removeItem: (k) => void data.delete(k),
  };
}
const fresh = () => createInitialState(seededRandom(5));

describe("demo snapshot", () => {
  it("uses its own key, different from the state key", () => {
    expect(DEMO_SNAPSHOT_KEY).not.toBe(STORAGE_KEY);
  });
  it("saves and loads a validated snapshot", () => {
    const st = fakeStorage();
    const s = createItem(fresh(), "learn:m1");
    expect(saveDemoSnapshot(s, st)).toBe(true);
    expect(loadDemoSnapshot(st)).toEqual(s);
    clearDemoSnapshot(st);
    expect(loadDemoSnapshot(st)).toBeNull();
  });
  it("absent, corrupt or invalid snapshot loads as null", () => {
    const st = fakeStorage();
    expect(loadDemoSnapshot(st)).toBeNull();
    st.setItem(DEMO_SNAPSHOT_KEY, "{not json");
    expect(loadDemoSnapshot(st)).toBeNull();
    st.setItem(DEMO_SNAPSHOT_KEY, JSON.stringify({ version: 4, profile: 1 }));
    expect(loadDemoSnapshot(st)).toBeNull();
    st.setItem(DEMO_SNAPSHOT_KEY, "x".repeat(300_000));
    expect(loadDemoSnapshot(st)).toBeNull();
  });
  it("storage that throws is harmless", () => {
    const bad: KeyValueStorage = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
      removeItem: () => {
        throw new Error("blocked");
      },
    };
    expect(saveDemoSnapshot(fresh(), bad)).toBe(false);
    expect(loadDemoSnapshot(bad)).toBeNull();
    expect(() => clearDemoSnapshot(bad)).not.toThrow();
  });
});

describe("enterDemo / leaveDemo", () => {
  it("enterDemo snapshots the pre-demo state and fast-forwards", () => {
    const st = fakeStorage();
    const before = createItem(fresh(), "learn:m1");
    const after = enterDemo(before, st);
    expect(after.demo.fastForwarded).toBe(true);
    expect(after.results.m1?.score).toBe(90);
    expect(after.stamps).toEqual(["player_one", "1", "2", "3"]);
    expect(loadDemoSnapshot(st)).toEqual(before);
  });
  it("leaveDemo restores the snapshot and clears it", () => {
    const st = fakeStorage();
    const before = fresh();
    const after = enterDemo(before, st);
    expect(after.demo.fastForwarded).toBe(true);
    const restored = leaveDemo(after, st);
    expect(restored).toEqual(before);
    expect(loadDemoSnapshot(st)).toBeNull();
  });
  it("a second enterDemo keeps the original snapshot (never snapshots a demo state)", () => {
    const st = fakeStorage();
    const before = fresh();
    const once = enterDemo(before, st);
    enterDemo(once, st);
    expect(loadDemoSnapshot(st)).toEqual(before);
  });
  it("leaveDemo without a valid snapshot returns the state unchanged", () => {
    const st = fakeStorage();
    const s = fastForwardDemo(fresh());
    expect(leaveDemo(s, st)).toBe(s);
  });
  it("a snapshot of another player is ignored (reset in between)", () => {
    const st = fakeStorage();
    enterDemo(fresh(), st);
    const other = fastForwardDemo(createInitialState(seededRandom(99)));
    expect(leaveDemo(other, st)).toBe(other);
  });
});

describe("canLeaveDemo and failed snapshot saves", () => {
  it("is true only with a valid snapshot of the same player", () => {
    const st = fakeStorage();
    const before = fresh();
    const after = enterDemo(before, st);
    expect(canLeaveDemo(after, st)).toBe(true);
    expect(canLeaveDemo(fastForwardDemo(createInitialState(seededRandom(99))), st)).toBe(false);
    expect(canLeaveDemo(before, st)).toBe(false); // not a demo state
    clearDemoSnapshot(st);
    expect(canLeaveDemo(after, st)).toBe(false);
  });
  it("a failed save clears any older snapshot", () => {
    const st = fakeStorage();
    enterDemo(fresh(), st);
    expect(loadDemoSnapshot(st)).not.toBeNull();
    const failing: KeyValueStorage = { getItem: st.getItem, removeItem: st.removeItem, setItem: () => { throw new Error("quota"); } };
    expect(saveDemoSnapshot(createItem(fresh(), "learn:m1"), failing)).toBe(false);
    expect(loadDemoSnapshot(st)).toBeNull();
  });
});
