import { describe, expect, it } from "vitest";
import { findResultCode, hintFor, itemKindOf, parseStatus } from "./console";
import { activateSubscription, createInitialState, createItem } from "./progress";
import { STEP_LABELS, fillPlaceholders, generateHelp, generateLearn, generateTest, type ItemContext } from "./generator";
import { buildProgram } from "./program";
import { encodeResultCode } from "./resultcode";
import { getModule, getTest } from "./content";
import { STEPS, type LessonId } from "./types";
import { lessonPosition } from "./labels";
import { CONSOLE_SYSTEM_PROMPT, MAX_MESSAGES, MAX_MESSAGE_CHARS, validateChatBody, type ChatMessage } from "./chat";
import { CONVERSATION_KEY, clearConversation, loadConversation, saveConversation, validateConversation } from "./conversation";
import { RateLimiter, clientIp } from "./server/rateLimit";
import { MemoryStorage, seededRandom, throwingStorage } from "./testutil";

const APP = "http://localhost:3000";
const s = createItem(createItem(createInitialState(seededRandom(2)), "learn:m1"), "test:m1");
const ctx: ItemContext = { profile: s.profile, secrets: s.secrets, appUrl: APP };
const pid = s.secrets.playerId;
const program = buildProgram(s.profile);
const f = (x: string) => fillPlaceholders(x, program.project, s.profile);

const user = (content: string): ChatMessage => ({ role: "user", content });
const reply = (content: string): ChatMessage => ({ role: "assistant", content });
const learn = user(generateLearn(ctx, "m1").text);
const test = user(generateTest(ctx, "m1").text);
const help = user(generateHelp(ctx).text);
const learnLine = (lesson: string, step: number, name = STEP_LABELS[STEPS[Math.max(step - 1, 0)]!]) =>
  `▮ LEARN · ${pid} · ${lessonPosition(lesson as LessonId)} ${getModule("m1").lessons?.find((l) => l.id === lesson)?.title ?? "X"} · step ${step}/7 ${step === 0 ? "Start" : name}`;
const testLine = (task: number, score = 0) => `▮ TEST · ${pid} · Set 01 · task ${task}/5 · score ${score}/100`;

describe("parseStatus (new Set/Lesson format)", () => {
  it("reads LEARN lessons and the final", () => {
    expect(parseStatus("▮ LEARN · P7K3Q · Set 01 · Lesson 1.2 Ask for the Shape · step 4/7 Your turn")).toEqual({ kind: "learn", playerId: "P7K3Q", lesson: "m1.2", module: "m1", step: 4 });
    expect(parseStatus("▮ LEARN · P7K3Q · Set 01 · Final Weekly Report · step 0/7 Start")).toEqual({ kind: "learn", playerId: "P7K3Q", lesson: "m1.boss", module: "m1", step: 0 });
    expect(parseStatus("▮ LEARN · P7K3Q · Set 02 · Lesson 2.3 Pick and Polish · step 1/7 Mission")).toMatchObject({ lesson: "m2.3", module: "m2" });
  });
  it("reads TEST", () => {
    expect(parseStatus("▮ TEST · P7K3Q · Set 01 · task 4/5 · score 30/100")).toEqual({ kind: "test", playerId: "P7K3Q", module: "m1", task: 4, score: 30 });
    expect(parseStatus("▮ TEST · P7K3Q · Set 03 · task 0/5")).toMatchObject({ module: "m3", task: 0, score: 0 });
  });
  it("framed, prefixed, bold and backticked lines", () => {
    expect(parseStatus("│ ▮ LEARN · P7K3Q · Set 01 · Lesson 1.1 The Brief Formula · step 4/7 Your turn")).toMatchObject({ lesson: "m1.1", step: 4 });
    expect(parseStatus("`▮ TEST · P7K3Q · Set 01 · task 2/5 · score 10/100`")).toMatchObject({ task: 2, score: 10 });
    expect(parseStatus("**▮ LEARN · p7k3q · set 01 · lesson 1.3 X · step 5/7 Solo**")).toMatchObject({ lesson: "m1.3", step: 5 });
  });
  it("mixed old and new: the last line wins", () => {
    expect(parseStatus("▮ LEARN · P7K3Q · m1.1 X · step 1/7 Mission\n▮ LEARN · P7K3Q · Set 01 · Lesson 1.2 Y · step 2/7 Brief")).toMatchObject({ lesson: "m1.2", step: 2 });
    expect(parseStatus("▮ LEARN · P7K3Q · Set 01 · Lesson 1.2 Y · step 2/7 Brief\n▮ TEST · P7K3Q · m1 · task 3/5 · score 20/100")).toMatchObject({ kind: "test", task: 3 });
  });
  it("rejects bad new-format values", () => {
    for (const bad of ["▮ LEARN · P7K3Q · Set 01 · Lesson 1.4 X · step 1/7", "▮ LEARN · P7K3Q · Set 09 · Lesson 9.1 X · step 1/7", "▮ LEARN · P7K3Q · Set 01 · Lesson 2.1 X · step 1/7", "▮ TEST · P7K3Q · Set 00 · task 1/5", "▮ TEST · P7K3Q · Set 01 · task 6/5"])
      expect(parseStatus(bad), bad).toBeNull();
  });
  it("displayText hides new-format lines, plain and framed", async () => {
    const { displayText } = await import("./console");
    expect(displayText("Hi\n▮ LEARN · P7K3Q · Set 01 · Lesson 1.1 X · step 4/7 Your turn")).toBe("Hi");
    expect(displayText("Hi\n│ ▮ TEST · P7K3Q · Set 01 · task 1/5 · score 0/100\n")).toBe("Hi");
  });
});

describe("parseStatus (old m1 format, stored transcripts)", () => {
  it("reads the canonical LEARN line", () => {
    expect(parseStatus("text\n`▮ LEARN · P7K3Q · m1.2 Ask for the Shape · step 4/7 Your turn`")).toEqual({
      kind: "learn",
      playerId: "P7K3Q",
      lesson: "m1.2",
      module: "m1",
      step: 4,
    });
  });
  it("reads the canonical TEST line", () => {
    expect(parseStatus("Right!\n`▮ TEST · P7K3Q · m1 · task 4/5 · score 30/100`")).toEqual({
      kind: "test",
      playerId: "P7K3Q",
      module: "m1",
      task: 4,
      score: 30,
    });
  });
  it("tolerates other glyphs, spacing and case", () => {
    expect(parseStatus("◮ learn·p7k3q·M1.BOSS Weekly Report · Step 6 / 7 Check")).toEqual({ kind: "learn", playerId: "P7K3Q", lesson: "m1.boss", module: "m1", step: 6 });
    expect(parseStatus("◆ test·p7k3q·M1 · Task 2 / 5 · Score 10/100")).toEqual({ kind: "test", playerId: "P7K3Q", module: "m1", task: 2, score: 10 });
    expect(parseStatus("▮ TEST · P7K3Q · m1 · task 0/5")).toMatchObject({ kind: "test", task: 0, score: 0 });
    expect(parseStatus("**▮ LEARN · P7K3Q · m2.3 Pick and Polish · step 0/7 Start**")).toMatchObject({ lesson: "m2.3", module: "m2", step: 0 });
  });
  it("the last line wins", () => {
    const l = "▮ LEARN · P7K3Q · m1.1 X · step 1/7 Mission";
    const t = "▮ TEST · P7K3Q · m1 · task 3/5 · score 20/100";
    expect(parseStatus(`${l}\n...\n${t}`)).toMatchObject({ kind: "test", task: 3 });
    expect(parseStatus(`${t}\n...\n${l}`)).toMatchObject({ kind: "learn", step: 1 });
    expect(parseStatus(`${l}\n▮ LEARN · P7K3Q · m1.3 Y · step 5/7 Solo`)).toMatchObject({ lesson: "m1.3", step: 5 });
    expect(parseStatus(`${t}\n▮ TEST · P7K3Q · m1 · task 5/5 · score 65/100`)).toMatchObject({ task: 5, score: 65 });
  });
  it("returns null without a status line or with bad values", () => {
    for (const bad of [
      "hello",
      "",
      "▮ LEARN · P7K3Q · m1.1 X · step 9/7",
      "▮ LEARN · P7K3Q · m9.1 X · step 1/7",
      "▮ LEARN · P7K3Q · m1.4 X · step 1/7",
      "▮ LEARN · P7K · m1.1 X · step 1/7",
      "▮ TEST · P7K3Q · m1 · task 6/5 · score 0/100",
      "▮ TEST · P7K3Q · m0 · task 1/5 · score 0/100",
    ]) {
      expect(parseStatus(bad), bad).toBeNull();
    }
  });
});

describe("findResultCode / itemKindOf", () => {
  const code = encodeResultCode(s.secrets, "m1", ["right", "right", "wrong", "pass", "rewrite"], ["1", "2"]);
  const short = encodeResultCode(s.secrets, "m1", ["right", "right", "wrong", "pass", "fail"]);
  it("finds the last code in a reply", () => {
    expect(findResultCode(`RESULT CODE: ${code}\nSee your result: ${APP}/result/${code}`)).toBe(code);
    expect(findResultCode(`old ${short}\nRESULT CODE: ${code}`)).toBe(code);
    expect(findResultCode(`RESULT CODE: ${short}`)).toBe(short);
    expect(findResultCode(`result code: ${code.toLowerCase()}`)).toBe(code);
  });
  it("ignores things that are not a code", () => {
    expect(findResultCode("SV1-ABCDE-XYZ")).toBeNull();
    expect(findResultCode(`RESULT CODE: SV1-${pid}-<tokens>`)).toBeNull();
    expect(findResultCode("nothing")).toBeNull();
  });
  it("recognises items by their header", () => {
    expect(itemKindOf(learn.content)).toBe("learn");
    expect(itemKindOf(test.content)).toBe("test");
    expect(itemKindOf(help.content)).toBe("help");
    expect(itemKindOf("AIGO ░ LEARN but no data block")).toBeNull();
    expect(itemKindOf("write me a report")).toBeNull();
  });
});

describe("hintFor: general", () => {
  it("no item → insert LEARN", () => {
    expect(hintFor(s, []).action).toBe("insert_learn");
    expect(hintFor(s, [user("hi"), reply("Hello!")]).action).toBe("insert_learn");
  });
  it("HELP-only chat: HELP is one-shot, offers LEARN", () => {
    const h = hintFor(s, [user("write me a report"), reply("ok"), help, reply("⚡ PRO MOVE: …")]);
    expect(h.todo).toMatch(/Help/);
    expect(h.action).toBe("insert_learn");
  });
  it("pending → waiting", () => {
    expect(hintFor(s, [learn], true).todo).toMatch(/replying/);
    expect(hintFor(s, [], true).action).toBeUndefined();
  });
  it("last message from the user → Retry", () => {
    expect(hintFor(s, [learn]).todo).toMatch(/Retry/);
    expect(hintFor(s, [learn, reply(`BOOT\n${learnLine("m1.1", 0)}`), user("Yes")]).todo).toMatch(/Retry/);
  });
  it("no status line → answer in your own words", () => {
    const h = hintFor(s, [learn, reply("just text")]);
    expect(h.todo).toMatch(/own words/);
    expect(h.action).toBeUndefined();
  });
});

describe("hintFor: LEARN", () => {
  const lessons = getModule("m1").lessons ?? [];
  it("step 0 → start", () => {
    const h = hintFor(s, [learn, reply(`BOOT\n${learnLine("m1.1", 0)}`)]);
    expect(h.answer).toMatch(/start/i);
    expect(h.status).toMatchObject({ kind: "learn", step: 0 });
  });

  it("each step of each m1 lesson → the library hint for that step", () => {
    expect(lessons).toHaveLength(4);
    for (const lesson of lessons) {
      STEPS.forEach((key, i) => {
        const step = i + 1;
        const h = hintFor(s, [learn, reply(`...\n${learnLine(lesson.id, step)}`)]);
        const lib = lesson.hints[key];
        expect(h.todo, `${lesson.id} ${key}`).toBe(f(lib.todo));
        expect(h.answer, `${lesson.id} ${key}`).toBe(lib.answer ? f(lib.answer) : undefined);
        expect(h.answer ?? "").not.toMatch(/\{[a-zA-Z]+\}|___/);
        expect(h.status).toMatchObject({ kind: "learn", lesson: lesson.id, step });
      });
    }
  });

  it("repeated answer and Claude stays on the step → Continue to <next>", () => {
    const line = learnLine("m1.1", 4);
    const first = hintFor(s, [learn, reply(`...\n${line}`)]);
    expect(first.answer).toBeTruthy();
    const h = hintFor(s, [learn, reply(`...\n${line}`), user(first.answer!), reply(`Here's what your prompt produces…\n${line}`)]);
    expect(h.answer).toBe("Continue to Solo.");
    expect(h.todo).toMatch(/Solo/);
    // at Solo the next step is Check
    const soloLine = learnLine("m1.2", 5);
    const solo = hintFor(s, [learn, reply(soloLine)]).answer!;
    expect(hintFor(s, [learn, reply(soloLine), user(solo), reply(`Answer…\n${soloLine}`)]).answer).toBe("Continue to Check.");
  });

  it("failed check (✘) → the fixed Solo prompt", () => {
    for (const lesson of lessons) {
      const h = hintFor(s, [learn, reply(`✅ Check\n- ✘ Context: missing\n${learnLine(lesson.id, 6)}`)]);
      expect(h.todo).toMatch(/missing/);
      expect(h.answer).toBe(f(lesson.hints.solo.answer!));
    }
    const ok = hintFor(s, [learn, reply(`✅ Check\n- ✔ Context\n${learnLine("m1.1", 6)}`)]);
    expect(ok.todo).not.toMatch(/missing/);
    expect(ok.answer).toBe(f(lessons[0]!.hints.check.answer!));
  });

  it("m1.boss step 7 → insert_test; other lessons' Clear do not", () => {
    const boss = hintFor(s, [learn, reply(`🏁 Module clear!\n${learnLine("m1.boss", 7)}`)]);
    expect(boss.action).toBe("insert_test");
    expect(boss.answer).toBe(f(lessons[3]!.hints.clear.answer!));
    expect(hintFor(s, [learn, reply(learnLine("m1.3", 7))]).action).toBeUndefined();
  });

  it("an outline module falls back to generic hints", () => {
    const st = activateSubscription(s);
    const h = hintFor(st, [learn, reply(`▮ LEARN · ${pid} · m2.1 Fix, Don't Restart · step 1/7 Mission`)]);
    expect(h.todo.length).toBeGreaterThan(0);
    expect(h.answer).toBeTruthy();
    expect(h.action).toBeUndefined();
  });
});

describe("hintFor: TEST", () => {
  const t = getTest("m1")!;
  it("task 0 → start", () => {
    const h = hintFor(s, [test, reply(`BOOT\n${testLine(0)}`)]);
    expect(h.answer).toMatch(/start/i);
    expect(h.status).toMatchObject({ kind: "test", task: 0 });
  });

  it("tasks 1–3 → the correct option", () => {
    t.questions.forEach((q, i) => {
      const h = hintFor(s, [test, reply(`Question…\n${testLine(i + 1, i * 10)}`)]);
      expect(h.answer).toBe(f(q.options[q.answer]!));
      expect(h.todo).toBe(f(q.hint.todo));
    });
  });

  it("tasks 4–5 → the full passing prompt", () => {
    t.practical.forEach((p, i) => {
      const h = hintFor(s, [test, reply(`Task…\n${testLine(i + 4, 30)}`)]);
      expect(h.todo).toBe(f(p.hint.todo));
      expect(h.answer).toBe(f(p.hint.answer!));
      expect(h.answer).not.toMatch(/\{[a-zA-Z]+\}/);
    });
  });

  it("task 4 failed with a rewrite offered → rewrite todo with the full answer", () => {
    const h = hintFor(s, [test, reply(`- ✘ Format: missing\nYou have one rewrite.\n${testLine(4, 30)}`)]);
    expect(h.todo).toMatch(/rewrite/);
    expect(h.answer).toBe(f(t.practical[0].hint.answer!));
    // ✘ alone (no rewrite offer) keeps the normal todo
    expect(hintFor(s, [test, reply(`✘ wrong\n${testLine(4, 20)}`)]).todo).toBe(f(t.practical[0].hint.todo));
  });

  it("result code in the reply → apply_result", () => {
    const code = encodeResultCode(s.secrets, "m1", ["right", "right", "right", "pass", "rewrite"], ["1", "2", "3"]);
    const screen = `TEST COMPLETE 100/100\nRANK: GOLD\nRESULT CODE: ${code}\nSee your result: ${APP}/result/${code}`;
    const h = hintFor(s, [test, reply(testLine(5, 65)), user("my prompt"), reply(screen)]);
    expect(h.action).toBe("apply_result");
    expect(h.todo).toMatch(/stars/);
    expect(h.todo).not.toMatch(/rank/i);
    expect(h.resultCode).toBe(code);
  });
});

describe("validateChatBody", () => {
  const ok = { messages: [{ role: "user", content: "hi" }] };
  it("accepts a valid body and strips extra fields", () => {
    const r = validateChatBody({ messages: [{ role: "user", content: "hi", extra: 1 }], model: "x" });
    expect(r).toEqual({ ok: true, messages: [{ role: "user", content: "hi" }] });
    expect(validateChatBody(ok).ok).toBe(true);
  });
  it("a packed LEARN item fits in one message", () => {
    expect(validateChatBody({ messages: [learn] }).ok).toBe(true);
    expect(validateChatBody({ messages: [test] }).ok).toBe(true);
  });
  it("rejects bad shapes and oversize input", () => {
    for (const bad of [
      null,
      "x",
      {},
      { messages: [] },
      { messages: [{ role: "system", content: "x" }] },
      { messages: [{ role: "user", content: "" }] },
      { messages: [{ role: "user", content: "   " }] },
      { messages: [{ role: "user", content: 5 }] },
      { messages: [null] },
      { messages: [{ role: "assistant", content: "x" }, { role: "user", content: "y" }] },
      { messages: [{ role: "user", content: "x" }, { role: "assistant", content: "y" }] },
      { messages: [{ role: "user", content: "x".repeat(MAX_MESSAGE_CHARS + 1) }] },
      { messages: Array.from({ length: MAX_MESSAGES + 1 }, () => ({ role: "user", content: "x" })) },
      { messages: Array.from({ length: 10 }, () => ({ role: "user", content: "x".repeat(MAX_MESSAGE_CHARS) })) },
    ]) {
      expect(validateChatBody(bad).ok, JSON.stringify(bad)?.slice(0, 80)).toBe(false);
    }
  });
  // BUG (stale v2 text): chat.ts validateChatBody, total-length error says
  // "This conversation is too long. Save your game and start a new one." — v3 has no saving.
  it("the too-long message does not tell the player to save (v3 has no saving)", () => {
    const r = validateChatBody({ messages: Array.from({ length: 10 }, () => ({ role: "user", content: "x".repeat(MAX_MESSAGE_CHARS) })) });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).not.toMatch(/save/i);
  });
  it("system prompt describes a plain chat", () => {
    expect(CONSOLE_SYSTEM_PROMPT).toMatch(/plain chat/);
  });
});

describe("conversation store", () => {
  it("validation mirrors the limits", () => {
    expect(validateConversation([user("a"), reply("b")])).toHaveLength(2);
    expect(validateConversation([])).toEqual([]);
    expect(validateConversation([{ role: "system", content: "a" }])).toBeNull();
    expect(validateConversation([{ role: "user", content: "x".repeat(MAX_MESSAGE_CHARS + 1) }])).toBeNull();
    expect(validateConversation(Array.from({ length: MAX_MESSAGES + 1 }, () => user("x")))).toBeNull();
    expect(validateConversation("nope")).toBeNull();
  });
  it("save / load / clear round-trip, extra fields dropped", () => {
    const st = new MemoryStorage();
    expect(loadConversation(st)).toEqual([]);
    expect(saveConversation([user("a"), reply("b")], st)).toBe(true);
    expect(loadConversation(st)).toEqual([user("a"), reply("b")]);
    st.setItem(CONVERSATION_KEY, JSON.stringify([{ role: "user", content: "a", x: 1 }]));
    expect(loadConversation(st)).toEqual([user("a")]);
    clearConversation(st);
    expect(st.getItem(CONVERSATION_KEY)).toBeNull();
  });
  it("corrupt or hostile storage → empty, no crash", () => {
    const st = new MemoryStorage();
    st.setItem(CONVERSATION_KEY, "{oops");
    expect(loadConversation(st)).toEqual([]);
    st.setItem(CONVERSATION_KEY, JSON.stringify([{ role: "system", content: "x" }]));
    expect(loadConversation(st)).toEqual([]);
    expect(loadConversation(throwingStorage)).toEqual([]);
    expect(saveConversation([user("a")], throwingStorage)).toBe(false);
    expect(saveConversation([user("a")], null)).toBe(false);
    expect(() => clearConversation(throwingStorage)).not.toThrow();
  });
});

describe("RateLimiter", () => {
  it("enforces per-window limits and recovers", () => {
    const rl = new RateLimiter({ rules: [{ windowMs: 1000, max: 2 }] });
    expect(rl.check("a", 0).ok).toBe(true);
    expect(rl.check("a", 10).ok).toBe(true);
    const blocked = rl.check("a", 20);
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) expect(blocked.retryAfterSec).toBeGreaterThanOrEqual(1);
    expect(rl.check("b", 20).ok).toBe(true);
    expect(rl.check("a", 1001).ok).toBe(true);
  });
  it("applies every rule (short burst and long window)", () => {
    const rl = new RateLimiter({ rules: [{ windowMs: 1000, max: 2 }, { windowMs: 60_000, max: 3 }] });
    expect(rl.check("a", 0).ok).toBe(true);
    expect(rl.check("a", 1).ok).toBe(true);
    expect(rl.check("a", 2000).ok).toBe(true);
    const r = rl.check("a", 4000);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.retryAfterSec).toBe(56);
    expect(rl.check("a", 60_001).ok).toBe(true);
  });
  it("bounds the number of tracked keys", () => {
    const rl = new RateLimiter({ rules: [{ windowMs: 1000, max: 1 }], maxKeys: 3 });
    for (const k of ["a", "b", "c", "d"]) rl.check(k, 0);
    expect(rl.check("a", 1).ok).toBe(true); // "a" was evicted
    expect(rl.check("d", 1).ok).toBe(false);
  });
  it("reads the client ip from proxy headers", () => {
    expect(clientIp(new Headers({ "x-forwarded-for": "6.6.6.6, 1.2.3.4" }))).toBe("1.2.3.4"); // spoofed first hop ignored
    expect(clientIp(new Headers({ "x-forwarded-for": "6.6.6.6", "x-real-ip": "1.2.3.4" }))).toBe("1.2.3.4");
    expect(clientIp(new Headers({ "x-real-ip": "5.6.7.8" }))).toBe("5.6.7.8");
    expect(clientIp(new Headers({ "x-real-ip": "x".repeat(200) }))).toHaveLength(64);
    expect(clientIp(new Headers())).toBe("unknown");
  });
});

describe("friendlyProgress", () => {
  it("turns status lines into plain labels with a bar value", async () => {
    const { friendlyProgress, parseStatus } = await import("./console");
    const l = parseStatus("▮ LEARN · P7K3Q · m1.1 The Brief Formula · step 4/7 Your turn")!;
    expect(friendlyProgress(l)).toEqual({ label: "Lesson 1.1 · step 4 of 7", detail: "Your turn", value: 4, max: 7 });
    const b = parseStatus("▮ LEARN · P7K3Q · m1.boss Weekly Report · step 0/7 Start")!;
    expect(friendlyProgress(b).label).toBe("Set 1 · final challenge · getting started");
    const t = parseStatus("▮ TEST · P7K3Q · m1 · task 2/5 · score 10/100")!;
    expect(friendlyProgress(t)).toEqual({ label: "Set 1 test · question 2 of 5", detail: "Score so far: 10", value: 2, max: 5 });
    expect(friendlyProgress(parseStatus("▮ TEST · P7K3Q · m1 · task 4/5 · score 30/100")!).label).toBe("Set 1 test · task 4 of 5");
  });
});

describe("displayText: framed status line", () => {
  it("hides the status line even with a frame bar prefix, keeps the header with the step bar", async () => {
    const { displayText, parseStatus } = await import("./console");
    const t = "━━━\nm1.1 The Brief Formula · step 4/7 ████░░░\n━━━\n│ ▮ LEARN · P7K3Q · m1.1 The Brief Formula · step 4/7 Your turn";
    expect(displayText(t)).toBe("━━━\nm1.1 The Brief Formula · step 4/7 ████░░░\n━━━");
    expect(parseStatus(t)).toMatchObject({ kind: "learn", step: 4 });
  });
});

describe("displayText", () => {
  it("removes the status line and keeps everything else", async () => {
    const { displayText } = await import("./console");
    expect(displayText("Hello\n\n`▮ LEARN · P7K3Q · m1.1 The Brief Formula · step 4/7 Your turn`")).toBe("Hello");
    expect(displayText("Q1?\n1. A\n▮ TEST · P7K3Q · m1 · task 1/5 · score 0/100\n")).toBe("Q1?\n1. A");
    expect(displayText("We LEARN · fast")).toBe("We LEARN · fast");
  });
});
