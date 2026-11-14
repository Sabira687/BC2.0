import { describe, expect, it, vi } from "vitest";
import { DEMO_PATH_KEY, panelOpen, consoleTabFromParam, markResultSeen, readDemoPathPrefs, demoPath, demoPathDone, parseDemoPathPrefs } from "./demoPath";
import { createInitialState, createItem, fastForwardDemo, openSet } from "./progress";
import { markHelpUsed } from "./workchat";
import type { AppState } from "./types";

const fresh = (): AppState => createInitialState();
const done = (s: AppState, seen = false) => demoPath(s, { result: seen }).map((x) => x.done);

describe("demoPath", () => {
  it("has five steps with fixed ids and links", () => {
    expect(demoPath(fresh(), { result: false }).map((s) => [s.id, s.href])).toEqual([
      ["items", "/start"],
      ["lesson", "/console"],
      ["help", "/console?tab=work"],
      ["forward", "/progress"],
      ["result", "/progress"],
    ]);
  });
  it("a new player has nothing done", () => {
    expect(done(fresh())).toEqual([false, false, false, false, false]);
    expect(demoPathDone(fresh(), { result: false })).toBe(0);
  });
  it("items step: done once any item is created", () => {
    expect(done(createItem(fresh(), "learn:m1"))[0]).toBe(true);
  });
  it("lesson and help steps follow learnStars.m1 and helpUsed", () => {
    const s = markHelpUsed({ ...fresh(), learnStars: { m1: 1 } });
    expect(done(s)).toEqual([true, true, true, false, false]);
    expect(done({ ...fresh(), learnStars: { m1: 0 } as AppState["learnStars"] })[1]).toBe(false);
  });
  it("forward step is done while the demo snapshot is active", () => {
    expect(done(fastForwardDemo(fresh()))[3]).toBe(true);
  });
  it("result step follows the seen flag", () => {
    expect(done(fresh(), true)[4]).toBe(true);
    expect(demoPathDone(fresh(), { result: true })).toBe(1);
  });
});

describe("parseDemoPathPrefs", () => {
  it("defaults on junk", () => {
    for (const raw of [null, "", "x", "[]", "null", "7", '{"collapsed":"yes"}']) expect(parseDemoPathPrefs(raw)).toEqual({ collapsed: null, resultSeen: false, introduced: false });
  });
  it("reads valid values", () => {
    expect(parseDemoPathPrefs('{"collapsed":true,"resultSeen":true,"introduced":true}')).toEqual({ collapsed: true, resultSeen: true, introduced: true });
  });
  it("rejects oversize input", () => {
    expect(parseDemoPathPrefs("x".repeat(5000))).toEqual({ collapsed: null, resultSeen: false, introduced: false });
  });
  it("key is versioned", () => expect(DEMO_PATH_KEY).toBe("aigo:demo-path:v1"));
});

describe("markResultSeen", () => {
  it("stores the flag and keeps collapsed", () => {
    const store = new Map<string, string>();
    const w = {
      localStorage: { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v) },
      dispatchEvent: () => true,
    };
    vi.stubGlobal("window", w);
    store.set(DEMO_PATH_KEY, '{"collapsed":true,"resultSeen":false}');
    markResultSeen();
    expect(readDemoPathPrefs()).toEqual({ collapsed: true, resultSeen: true, introduced: false });
    vi.unstubAllGlobals();
  });
});

describe("consoleTabFromParam", () => {
  it("only work selects the Work chat", () => {
    expect(consoleTabFromParam("work")).toBe("work");
    for (const v of [null, undefined, "", "lesson", "WORK", "work ", "x"]) expect(consoleTabFromParam(v)).toBe("lesson");
  });
});

describe("demoPath after openSet", () => {
  it("step 1 is done once Set 01 is opened", () => {
    const s = openSet(createInitialState(), "m1");
    expect(demoPath(s, { result: false })[0]).toMatchObject({ id: "items", done: true });
  });
});

describe("panelOpen", () => {
  const base = { collapsed: null, resultSeen: false, introduced: false };
  it("is a pill by default, open only on the first /collection visit", () => {
    expect(panelOpen(base, "/progress")).toBe(false);
    expect(panelOpen(base, "/console")).toBe(false);
    expect(panelOpen(base, "/collection")).toBe(true);
    expect(panelOpen({ ...base, introduced: true }, "/collection")).toBe(false);
  });
  it("the visitor's toggle wins everywhere", () => {
    expect(panelOpen({ ...base, collapsed: false }, "/progress")).toBe(true);
    expect(panelOpen({ ...base, collapsed: true }, "/collection")).toBe(false);
  });
});
