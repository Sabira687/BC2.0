import { describe, expect, it } from "vitest";
import { SAMPLE_WORK_CHAT, helpUsedIn, markHelpUsed, startsWithSample, workChatHint } from "./workchat";
import { validateChatBody } from "./chat";
import { createInitialState, questsDone } from "./progress";
import { generateHelp } from "./generator";
import { seededRandom } from "./testutil";

describe("work chat", () => {
  const s = createInitialState(seededRandom(5));
  const help = { role: "user" as const, content: generateHelp(s).text };

  it("sample chat follows spec/03 §8 and is a valid request once Help is appended", () => {
    expect(SAMPLE_WORK_CHAT.filter((m) => m.role === "user").map((m) => m.content)).toEqual(["write me a report", "no, shorter", "no, more formal"]);
    expect(validateChatBody({ messages: [...SAMPLE_WORK_CHAT, help] }).ok).toBe(true);
    expect(startsWithSample([...SAMPLE_WORK_CHAT, help])).toBe(true);
    expect(startsWithSample(SAMPLE_WORK_CHAT.slice(0, 2))).toBe(false);
  });

  it("hints: 2 steps on an empty chat, Use Help on a chat, done after Help", () => {
    const empty = workChatHint([]);
    expect(empty.steps).toEqual(["Load a sample work chat", "Press Use Help"]);
    expect(empty.actions).toEqual(["load_sample", "use_help"]);
    expect(empty.note).toMatch(/once/);
    expect(workChatHint([...SAMPLE_WORK_CHAT]).actions).toEqual(["use_help"]);
    expect(helpUsedIn([...SAMPLE_WORK_CHAT, help])).toBe(true);
    expect(workChatHint([...SAMPLE_WORK_CHAT, help]).todo).toMatch(/Waiting/);
    expect(workChatHint([...SAMPLE_WORK_CHAT, help, { role: "assistant", content: "⚡ PRO MOVE: …" }]).actions).toEqual([]);
    expect(workChatHint([], true).todo).toMatch(/replying/);
  });

  it("using Help completes the Help quest, once", () => {
    expect(questsDone(s)[3]).toBe(false);
    const used = markHelpUsed(s);
    expect(questsDone(used)[3]).toBe(true);
    expect(used.helpUsed).toBe(true);
    expect(markHelpUsed(used)).toBe(used);
    const already = markHelpUsed({ ...s, created: ["help"] });
    expect(already.created).toEqual(["help"]);
    expect(already.helpUsed).toBe(true);
  });
});
