import { describe, expect, it } from "vitest";
import { classifyLine, classifyReply, promptName } from "./terminal";
import { splitMarkers } from "./markers";
import { captureFromAssistant } from "./capture";

const tones = (l: ReturnType<typeof classifyLine>) => l.spans.map((s) => `${s.tone}:${s.text}`);

describe("classifyLine", () => {
  it("colours frame lines and keeps their text", () => {
    expect(classifyLine("┌─ YOUR TURN ────").spans.every((s) => s.tone === "frame")).toBe(true);
    expect(classifyLine("└────────").spans[0]!.tone).toBe("frame");
    expect(classifyLine("━━━━━━━━").spans[0]!.tone).toBe("frame");
    expect(classifyLine("────────").spans[0]!.tone).toBe("frame");
  });
  it("frame side bar then content classified", () => {
    const l = classifyLine("│ [✓] format       3 bullets");
    expect(l.spans[0]).toEqual({ text: "│ ", tone: "frame" });
    expect(l.spans[1]).toEqual({ text: "[✓]", tone: "pass" });
    expect(l.spans.map((s) => s.text).join("")).toBe("│ [✓] format       3 bullets");
  });
  it("fail mark and blanks", () => {
    expect(classifyLine("│ [✗] comes first").spans[1]!.tone).toBe("fail");
    const b = classifyLine("│ Turn these notes into ___. Format: ___.");
    expect(b.spans.filter((s) => s.tone === "blank").map((s) => s.text)).toEqual(["___", "___"]);
  });
  it("progress bar blocks", () => {
    const l = classifyLine(" LESSON 1.2 · ASK FOR THE SHAPE        step 4/7  ████░░░");
    expect(l.spans.find((s) => s.tone === "bar")!.text).toBe("████");
    expect(l.spans.find((s) => s.tone === "barOff")!.text).toBe("░░░");
    expect(l.spans[0]!.tone).toBe("bold");
    expect(l.spans.map((s) => s.text).join("")).toBe(" LESSON 1.2 · ASK FOR THE SHAPE        step 4/7  ████░░░");
  });
  it("marker lines", () => {
    expect(classifyLine("▶ ITEM ACTIVATED · LEARN · Three-Tooth Key").marker).toBe("activated");
    const pass = classifyLine("✅ CHECK PASSED · ★★☆");
    expect(pass.marker).toBe("pass");
    expect(pass.spans.find((s) => s.text === "★★")!.tone).toBe("star");
    expect(pass.spans.find((s) => s.text === "☆")!.tone).toBe("starOff");
    expect(classifyLine("✦ STAMP EARNED · Explicit output format").marker).toBe("stamp");
    expect(classifyLine("HELP USED · back to normal chat").marker).toBe("help");
    expect(classifyLine("TEST COMPLETE · ★★★ · 90/100").marker).toBe("test");
    expect(classifyLine("RESULT CODE: SV1-ABC").marker).toBeUndefined();
  });
  it("test frame title and score are not markers", () => {
    expect(classifyLine(" TEST COMPLETE · PROVING LOCK").marker).toBeUndefined();
    expect(classifyLine(" SCORE  90/100                     ★★★").marker).toBeUndefined();
    expect(classifyLine(" SCORE  90/100   ★★★").spans.find((s) => s.tone === "star")).toBeTruthy();
    expect(classifyLine(" 3  Why paste your own material    ✗  0/10").spans.some((s) => s.tone === "fail")).toBe(true);
  });
  it("choices and inline bold", () => {
    expect(classifyLine("[1] next lesson    [2] more practice").spans.filter((s) => s.tone === "key").length).toBe(2);
    expect(tones(classifyLine("say **hi** now"))).toEqual(["plain:say ", "bold:hi", "plain: now"]);
  });
  it("never loses text", () => {
    for (const t of ["", "plain", "│ x ✓ 10/10", "   ", "★☆ ___ █░"]) {
      expect(classifyLine(t).spans.map((s) => s.text).join("")).toBe(t.replace(/\*\*/g, ""));
    }
  });
});

describe("classifyReply", () => {
  const reply = [
    "▶ ITEM ACTIVATED · LEARN · Three-Tooth Key",
    "┌─ CHECK ──────",
    "│ [✓] format  ok",
    "└──────────────",
    "✅ CHECK PASSED · ★★☆",
    "✦ STAMP EARNED · Explicit output format",
    "```",
    "✅ CHECK PASSED · ★★☆",
    "```",
  ].join("\n");
  it("one entry per line, markers not styled inside code fences", () => {
    const out = classifyReply(reply);
    expect(out.length).toBe(9);
    expect(out[7]!.marker).toBeUndefined();
  });
  it("marker lines agree with splitMarkers and capture", () => {
    const text = reply.split("```")[0]!;
    const ev = splitMarkers(text).filter((s) => s.type === "event").length;
    expect(classifyReply(text).filter((l) => l.marker).length).toBe(ev);
  });
  it("HELP USED back-to-normal-chat is still captured; frame title is not a test result", () => {
    expect(captureFromAssistant("HELP USED · back to normal chat", null).helpUsed).toBe(true);
    expect(splitMarkers(" TEST COMPLETE · PROVING LOCK\n").some((s) => s.type === "event")).toBe(false);
  });
});

describe("promptName", () => {
  it("lowercases the first word, with a fallback", () => {
    expect(promptName("John Smith")).toBe("john");
    expect(promptName("  ")).toBe("you");
    expect(promptName(undefined)).toBe("you");
  });
});

import { firstBlank, parseChoices, yourTurnFrame } from "./terminal";
describe("choices and template", () => {
  it("parses choice lines", () => {
    expect(parseChoices("Done!\n[1] next lesson    [2] more practice")).toEqual([
      { key: "1", label: "next lesson" },
      { key: "2", label: "more practice" },
    ]);
    expect(parseChoices("│ [1] start now [2] not yet  ")).toEqual([
      { key: "1", label: "start now" },
      { key: "2", label: "not yet" },
    ]);
    expect(parseChoices("[1] only one\nplain text [1] no")).toEqual([]);
    expect(parseChoices("")).toEqual([]);
  });
  it("extracts the template", () => {
    const t = "Your turn.\n\n┌─ YOUR TURN ───────\n│ \"I'm the ___ at ___.\n│ Format: ___.\"\n└───────\nGuide";
    const f = yourTurnFrame(t)!;
    expect(f.template).toBe("\"I'm the ___ at ___.\nFormat: ___.\"");
    expect([f.from, f.to]).toEqual([3, 4]);
    expect(yourTurnFrame("no frame")).toBeNull();
    expect(firstBlank(f.template)).toEqual([9, 12]);
  });
});
