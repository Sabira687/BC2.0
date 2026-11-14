import { describe, expect, it } from "vitest";
import type { ChatMessage } from "./chat";
import { displayText, lastStatus, parseStatus } from "./console";
import { REPLAY_HELP, REPLAY_HELP_HISTORY, REPLAY_LEARN_L11, REPLAY_LEARN_L11_USER } from "./content/replays";
import { captureFromAssistant, applyCaptured } from "./capture";
import {
  REPLAY_ENDED_NOTICE,
  clearReplayed,
  countsProgress,
  dropReplayedConversation,
  markReplayed,
  pickReplay,
  replayReply,
  replayRequested,
  shouldReplay,
} from "./replay";
import { saveConversation, loadConversation } from "./conversation";
import { createInitialState } from "./progress";
import { DATA_OPEN } from "./encode";
import { seededRandom } from "./testutil";

const learnCard: ChatMessage = { role: "user", content: `AIGO ░ LEARN\n${DATA_OPEN}` };
const helpCard: ChatMessage = { role: "user", content: `AIGO ░ HELP\n${DATA_OPEN}` };
const u = (content: string): ChatMessage => ({ role: "user", content });
const a = (content: string): ChatMessage => ({ role: "assistant", content });

describe("shouldReplay", () => {
  it("replays for 503, any 5xx, network errors and 429", () => {
    for (const s of [503, 500, 502, 529, 599, "network"] as const) expect(shouldReplay(s)).toBe(true);
    expect(shouldReplay(429, "global")).toBe(true);
  });
  it("a per-IP 429 (or one without scope) keeps its own message", () => {
    expect(shouldReplay(429, "ip")).toBe(false);
    expect(shouldReplay(429)).toBe(false);
  });
  it("does not replay for client errors or success", () => {
    for (const s of [400, 403, 404, 413, 200, 499] as const) expect(shouldReplay(s)).toBe(false);
  });
});

describe("replayRequested", () => {
  it("is on only for replay=1", () => {
    expect(replayRequested("?replay=1")).toBe(true);
    expect(replayRequested("?a=2&replay=1")).toBe(true);
    expect(replayRequested("?replay=0")).toBe(false);
    expect(replayRequested("")).toBe(false);
  });
});

describe("recordings", () => {
  it("lesson 1.1 has 7 real replies from activation to step 7/7", () => {
    expect(REPLAY_LEARN_L11).toHaveLength(7);
    expect(REPLAY_LEARN_L11[0]!.startsWith("▶ ITEM ACTIVATED · LEARN · Three-Tooth Key")).toBe(true);
    expect(REPLAY_LEARN_L11.map((r) => (parseStatus(r) as { step: number }).step)).toEqual([0, 2, 3, 4, 5, 6, 7]);
    for (const r of REPLAY_LEARN_L11) expect(displayText(r)).not.toMatch(/▮ LEARN/);
  });
  it("help recording starts with the HELP activation and keeps the history", () => {
    expect(REPLAY_HELP[0]!.startsWith("▶ ITEM ACTIVATED · HELP")).toBe(true);
    expect(REPLAY_HELP_HISTORY.map((m) => m.role)).toEqual(["user", "assistant", "user", "assistant", "user", "assistant"]);
  });
});

describe("replayReply", () => {
  it("picks by turn and clamps", () => {
    expect(replayReply(REPLAY_LEARN_L11, 0)).toBe(REPLAY_LEARN_L11[0]);
    expect(replayReply(REPLAY_LEARN_L11, 3)).toBe(REPLAY_LEARN_L11[3]);
    expect(replayReply(REPLAY_LEARN_L11, 99)).toBe(REPLAY_LEARN_L11[6]);
    expect(replayReply(REPLAY_LEARN_L11, -4)).toBe(REPLAY_LEARN_L11[0]);
    expect(replayReply([], 0)).toBe("");
  });
});

describe("pickReplay (lesson)", () => {
  it("answers the LEARN card with the activation", () => {
    expect(pickReplay([learnCard])).toBe(REPLAY_LEARN_L11[0]);
  });
  it("walks the recording as the player sends the recorded answers", () => {
    let msgs: ChatMessage[] = [learnCard, a(REPLAY_LEARN_L11[0]!)];
    for (let i = 1; i < 7; i++) {
      msgs = [...msgs, u(REPLAY_LEARN_L11_USER[i - 1]!)];
      const reply = pickReplay(msgs);
      expect(reply).toBe(REPLAY_LEARN_L11[i]);
      msgs = [...msgs, a(reply)];
    }
    expect(lastStatus(msgs)).toMatchObject({ step: 7 });
  });
  it("advances by status, not by message count, when the player types something else", () => {
    const msgs = [learnCard, a(REPLAY_LEARN_L11[0]!), u("blah"), a("whatever"), u("hello?")];
    const reply = pickReplay(msgs);
    expect(reply).toContain(REPLAY_LEARN_L11[1]!); // status of the last recorded reply is still step 0
    expect(reply.startsWith(REPLAY_LEARN_L11[1]!)).toBe(false); // with a short note in front
    expect(reply).toMatch(/replay/i);
  });
  it("never crashes: empty history, end of the recording, foreign lesson", () => {
    expect(pickReplay([])).toBeTruthy();
    const end = [learnCard, a(REPLAY_LEARN_L11[6]!), u("more")];
    const r = pickReplay(end);
    expect(r).toContain(REPLAY_LEARN_L11[6]!);
    expect(r).toMatch(/end of the recording/i);
    const foreign = [learnCard, a("▮ LEARN · AAAAA · Set 02 · Lesson 2.1 X · step 5/7 Solo"), u("ok")];
    expect(pickReplay(foreign)).toBeTruthy();
  });
});

describe("pickReplay (work chat)", () => {
  it("answers the HELP card with the recorded HELP reply", () => {
    expect(pickReplay([...REPLAY_HELP_HISTORY, helpCard])).toBe(REPLAY_HELP[0]);
    expect(pickReplay([helpCard])).toBe(REPLAY_HELP[0]);
  });
  it("answers a free message in the work chat with a short honest note", () => {
    const r = pickReplay([...REPLAY_HELP_HISTORY, u("write me a memo")]);
    expect(r).toMatch(/replay/i);
    expect(r).not.toContain("▶ ITEM ACTIVATED");
  });
});

describe("no progress in replay", () => {
  it("countsProgress is false in replay, true live", () => {
    expect(countsProgress(true)).toBe(false);
    expect(countsProgress(false)).toBe(true);
  });
  it("applying replay replies through the gate leaves the state untouched", () => {
    const state = createInitialState(seededRandom(3));
    let s = state;
    const all = [...REPLAY_LEARN_L11, ...REPLAY_HELP];
    for (const r of all) {
      if (countsProgress(true)) s = applyCaptured(s, captureFromAssistant(r, parseStatus(r)));
    }
    expect(s).toBe(state);
    // sanity: the same replies WOULD count live (so the gate is what protects the player)
    let live = state;
    for (const r of all) live = applyCaptured(live, captureFromAssistant(r, parseStatus(r)));
    expect(live).not.toEqual(state);
  });
});

describe("replayed conversations are dropped when going live", () => {
  const mem = () => {
    const m = new Map<string, string>();
    return {
      getItem: (k: string) => m.get(k) ?? null,
      setItem: (k: string, v: string) => void m.set(k, v),
      removeItem: (k: string) => void m.delete(k),
    };
  };
  it("drops a flagged conversation once and clears the flag", () => {
    const s = mem();
    saveConversation([u("x"), a(REPLAY_LEARN_L11[5]!)], s, "k");
    markReplayed("k", s);
    expect(dropReplayedConversation("k", s)).toBe(true);
    expect(loadConversation(s, "k")).toEqual([]);
    expect(dropReplayedConversation("k", s)).toBe(false);
  });
  it("keeps an unflagged (live) conversation, and ignores a malformed flag", () => {
    const s = mem();
    saveConversation([u("x"), a("live")], s, "k");
    expect(dropReplayedConversation("k", s)).toBe(false);
    s.setItem("k:replayed", "true");
    expect(dropReplayedConversation("k", s)).toBe(false);
    expect(loadConversation(s, "k")).toHaveLength(2);
    markReplayed("k", s);
    clearReplayed("k", s);
    expect(dropReplayedConversation("k", s)).toBe(false);
  });
  it("has a one-line notice", () => {
    expect(REPLAY_ENDED_NOTICE).toBe("Replay ended: starting a fresh live lesson.");
  });
});
