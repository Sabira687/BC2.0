import { describe, expect, it } from "vitest";
import { COACH_RESTING_MESSAGE, tooManyMessagesText } from "@/lib/chatMessages";
import { chatLimits, createChatGuard, isCoachRestingStatus } from "./chatGuard";

describe("chatLimits", () => {
  it("has defaults", () => {
    expect(chatLimits({})).toEqual({ perIpMinute: 40, perIpDay: 800, globalMinute: 120, globalDay: 3000, model: "claude-opus-5-5" });
  });
  it("overrides from env, defensively", () => {
    const l = chatLimits({ CHAT_PER_IP_MINUTE: "10", CHAT_GLOBAL_DAY: "50", CHAT_MODEL: "m-x", CHAT_PER_IP_DAY: "5", CHAT_GLOBAL_MINUTE: "7" });
    expect(l).toMatchObject({ perIpMinute: 10, globalDay: 50, model: "m-x", perIpDay: 5, globalMinute: 7 });
    const bad = chatLimits({ CHAT_PER_IP_MINUTE: "abc", CHAT_GLOBAL_DAY: "-3", CHAT_PER_IP_DAY: "0", CHAT_MODEL: "  " });
    expect(bad).toMatchObject({ perIpMinute: 40, globalDay: 3000, perIpDay: 800, model: "claude-opus-5-5" });
  });
});

describe("createChatGuard", () => {
  const limits = chatLimits({});
  it("lets 30 requests a minute from one IP pass (a class behind one NAT), blocks the 41st", () => {
    const g = createChatGuard(limits);
    for (let i = 0; i < 30; i++) expect(g.check("1.1.1.1", 1000 + i).ok).toBe(true);
    for (let i = 30; i < 40; i++) expect(g.check("1.1.1.1", 1000 + i).ok).toBe(true);
    const r = g.check("1.1.1.1", 1100);
    expect(r).toMatchObject({ ok: false, status: 429, scope: "ip" });
    expect(r.ok === false && r.status === 429 && r.retryAfterSec).toBeGreaterThan(0);
  });
  it("answers 503 with the resting text once globalDay is exhausted", () => {
    const g = createChatGuard(chatLimits({ CHAT_GLOBAL_DAY: "3", CHAT_GLOBAL_MINUTE: "100" }));
    for (let i = 0; i < 3; i++) expect(g.check(`ip${i}`, 1000 + i).ok).toBe(true);
    expect(g.check("ip9", 2000)).toEqual({ ok: false, status: 503, error: COACH_RESTING_MESSAGE });
  });
  it("global per-minute brake is a 429", () => {
    const g = createChatGuard(chatLimits({ CHAT_GLOBAL_MINUTE: "2" }));
    g.check("a", 1);
    g.check("b", 2);
    expect(g.check("c", 3)).toMatchObject({ ok: false, status: 429, scope: "global" });
  });
});

describe("guard rule mapping", () => {
  it("day budget close to expiring is still a 503, not a short 429", () => {
    const g = createChatGuard(chatLimits({ CHAT_GLOBAL_DAY: "2", CHAT_GLOBAL_MINUTE: "100" }));
    g.check("a", 0);
    g.check("b", 1);
    const near = 24 * 3_600_000 - 5_000; // oldest hit expires in 5 s
    expect(g.check("c", near)).toEqual({ ok: false, status: 503, error: COACH_RESTING_MESSAGE });
  });
  it("a global rejection does not spend the player's own budget", () => {
    const g = createChatGuard(chatLimits({ CHAT_GLOBAL_MINUTE: "1", CHAT_PER_IP_MINUTE: "2" }));
    expect(g.check("me", 0).ok).toBe(true);
    for (let i = 0; i < 5; i++) expect(g.check("me", 10 + i)).toMatchObject({ status: 429 });
    expect(g.check("me", 61_000).ok).toBe(true);
    expect(g.check("me", 122_000).ok).toBe(true);
  });
});

describe("tooManyMessagesText", () => {
  it("reads naturally for long waits", () => {
    expect(tooManyMessagesText(30)).toBe("Too many messages right now — try again in 30 s");
    expect(tooManyMessagesText(600)).toContain("10 min");
    expect(tooManyMessagesText(7200)).toContain("2 h");
    expect(tooManyMessagesText(86_000)).toContain("tomorrow");
  });
});

describe("isCoachRestingStatus", () => {
  it("maps key, quota and overload failures", () => {
    for (const s of [401, 403, 429, 529]) expect(isCoachRestingStatus(s, "")).toBe(true);
    expect(isCoachRestingStatus(400, "Your credit balance is too low")).toBe(true);
    expect(isCoachRestingStatus(500, "overloaded_error")).toBe(true);
    expect(isCoachRestingStatus(400, "spend limit reached")).toBe(true);
    expect(isCoachRestingStatus(400, "bad schema")).toBe(false);
    expect(isCoachRestingStatus(undefined, "")).toBe(false);
  });
});
