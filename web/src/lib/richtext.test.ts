import { describe, expect, it } from "vitest";
import { parseInline, toBlocks } from "./richtext";

describe("richtext", () => {
  it("parses bold and code, leaves the rest literal", () => {
    expect(parseInline("A **bold** and `code` <b>x</b>")).toEqual([
      { text: "A " },
      { text: "bold", bold: true },
      { text: " and " },
      { text: "code", code: true },
      { text: " <b>x</b>" },
    ]);
  });
  it("splits paragraphs, lists, numbered lists, quotes and fences", () => {
    const b = toBlocks("🎯 **Mission**\nDo it.\n\n- one\n- two\n\n1. A\n2) B\n\n> quoted\n> more\n\n```\nbox\n```\n## Head");
    expect(b.map((x) => x.type)).toEqual(["p", "ul", "ol", "quote", "pre", "p"]);
    expect(b[1]).toEqual({ type: "ul", items: [[{ text: "one" }], [{ text: "two" }]] });
    expect(b[4]).toEqual({ type: "pre", text: "box" });
    expect(b[5]).toEqual({ type: "p", spans: [{ text: "Head" }] });
  });
  it("is linear on long input", () => {
    const t0 = performance.now();
    toBlocks("- x **y** `z`\n".repeat(3000));
    expect(performance.now() - t0).toBeLessThan(500);
  });
});
