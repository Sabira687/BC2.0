/**
 * Tiny, safe formatter for Claude's replies: turns a few Markdown basics into
 * plain data (paragraphs, bullet/numbered lists, quotes; bold and inline code).
 * The UI renders the result as React text nodes only — never as HTML.
 */

export interface Span {
  text: string;
  bold?: boolean;
  code?: boolean;
}

export type Block =
  | { type: "p"; spans: Span[] }
  | { type: "ul"; items: Span[][] }
  | { type: "ol"; items: Span[][] }
  | { type: "quote"; spans: Span[] }
  | { type: "pre"; text: string };

/** Inline: **bold** and `code`. Anything else stays literal text. */
export function parseInline(line: string): Span[] {
  const spans: Span[] = [];
  const re = /\*\*([^*\n]+)\*\*|`([^`\n]+)`/g;
  let last = 0;
  for (const m of line.matchAll(re)) {
    if (m.index! > last) spans.push({ text: line.slice(last, m.index) });
    if (m[1] !== undefined) spans.push({ text: m[1], bold: true });
    else spans.push({ text: m[2]!, code: true });
    last = m.index! + m[0].length;
  }
  if (last < line.length) spans.push({ text: line.slice(last) });
  return spans;
}

/** Split text into blocks. Bounded work: input is capped at 40k chars upstream. */
export function toBlocks(text: string): Block[] {
  const blocks: Block[] = [];
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  let i = 0;
  while (i < lines.length) {
    const line = lines[i]!;
    if (line.trim() === "") {
      i++;
      continue;
    }
    if (/^\s*```/.test(line)) {
      const body: string[] = [];
      i++;
      while (i < lines.length && !/^\s*```/.test(lines[i]!)) body.push(lines[i++]!);
      i++; // closing fence (if any)
      blocks.push({ type: "pre", text: body.join("\n") });
      continue;
    }
    if (/^\s*[-*•]\s+/.test(line)) {
      const items: Span[][] = [];
      while (i < lines.length && /^\s*[-*•]\s+/.test(lines[i]!)) items.push(parseInline(lines[i++]!.replace(/^\s*[-*•]\s+/, "")));
      blocks.push({ type: "ul", items });
      continue;
    }
    if (/^\s*\d{1,2}[.)]\s+/.test(line)) {
      const items: Span[][] = [];
      while (i < lines.length && /^\s*\d{1,2}[.)]\s+/.test(lines[i]!)) items.push(parseInline(lines[i++]!.replace(/^\s*\d{1,2}[.)]\s+/, "")));
      blocks.push({ type: "ol", items });
      continue;
    }
    if (/^\s*>/.test(line)) {
      const body: string[] = [];
      while (i < lines.length && /^\s*>/.test(lines[i]!)) body.push(lines[i++]!.replace(/^\s*>\s?/, ""));
      blocks.push({ type: "quote", spans: parseInline(body.join("\n")) });
      continue;
    }
    const body: string[] = [];
    while (i < lines.length && lines[i]!.trim() !== "" && !/^\s*(```|[-*•]\s+|\d{1,2}[.)]\s+|>)/.test(lines[i]!)) body.push(lines[i++]!.replace(/^#{1,6}\s+/, ""));
    blocks.push({ type: "p", spans: parseInline(body.join("\n")) });
  }
  return blocks;
}
