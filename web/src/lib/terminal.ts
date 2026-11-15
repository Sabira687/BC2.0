/**
 * Terminal view of Claude's replies (pure): every line is split into toned spans so the console can colour the
 * box-drawing frames, checklist marks, progress blocks, stars and marker lines without touching the text itself.
 * Marker detection is shared with markers.ts (same rules as capture); nothing here changes what is captured.
 */
import { lineMarker, type MarkerKind } from "./markers";
import { parseInline } from "./richtext";

export type Tone = "plain" | "bold" | "code" | "frame" | "pass" | "fail" | "stamp" | "star" | "starOff" | "blank" | "bar" | "barOff" | "key" | "dim" | "activated" | "help" | "test";
export interface TermSpan {
  text: string;
  tone: Tone;
}
export interface TermLine {
  spans: TermSpan[];
  /** Set only for real marker lines (the ones capture reads). */
  marker?: MarkerKind;
}

const FRAME_ONLY = /^[\s━─┌└├┐┘┤┬┴┼═]+$/;
const FRAME_START = /^([┌└├]|[━─]{3,})/;
const SIDE_BAR = /^│ ?/;
const TOKEN = /(\[✓\]|\[✗\]|✅|✓|✗|★+|☆+|_{3,}|█+|░+|step\s*\d\s*\/\s*\d|\[\d\])/g;
const HEADER = /^ (?:LESSON|TEST COMPLETE|SCORE|TASK)\b/;
const MARKER_TONE: Record<MarkerKind, Tone> = { activated: "activated", pass: "pass", stamp: "stamp", help: "help", test: "test" };

function tokenTone(t: string): Tone {
  if (t === "[✓]" || t === "✓" || t === "✅") return "pass";
  if (t === "[✗]" || t === "✗") return "fail";
  if (t[0] === "★") return "star";
  if (t[0] === "☆") return "starOff";
  if (t[0] === "_") return "blank";
  if (t[0] === "█") return "bar";
  if (t[0] === "░") return "barOff";
  if (t[0] === "[") return "key";
  return "dim"; // "step n/7"
}

/** Tokens inside a text piece; `base` is the tone of the plain parts (inline **bold** and `code` only on plain tone). */
function tokenize(text: string, base: Tone): TermSpan[] {
  const out: TermSpan[] = [];
  const push = (t: string, tone: Tone) => {
    if (t === "") return;
    if (tone === "plain") {
      for (const s of parseInline(t)) out.push({ text: s.text, tone: s.bold ? "bold" : s.code ? "code" : "plain" });
    } else out.push({ text: t, tone });
  };
  let last = 0;
  for (const m of text.matchAll(TOKEN)) {
    push(text.slice(last, m.index), base);
    // On marker lines the pass mark keeps the line's colour; stars keep their own.
    out.push({ text: m[0], tone: tokenTone(m[0]) });
    last = m.index! + m[0].length;
  }
  push(text.slice(last), base);
  return out;
}

/** One line of Claude's text as toned spans. Concatenating the span texts gives back the line (minus inline ** and `). */
export function classifyLine(line: string, opts: { markers?: boolean } = {}): TermLine {
  const markers = opts.markers !== false;
  if (line === "") return { spans: [] };
  const marker = markers ? lineMarker(line) : null;
  if (marker) return { marker, spans: tokenize(line, MARKER_TONE[marker]) };
  if (FRAME_ONLY.test(line) && /[━─┌└├]/.test(line)) return { spans: [{ text: line, tone: "frame" }] };
  if (FRAME_START.test(line)) return { spans: [{ text: line, tone: "frame" }] };
  const side = SIDE_BAR.exec(line);
  if (side) return { spans: [{ text: side[0], tone: "frame" }, ...tokenize(line.slice(side[0].length), "plain")] };
  return { spans: tokenize(line, HEADER.test(line) ? "bold" : "plain") };
}

/** A whole reply, line by line. Lines inside ``` fences are styled but never as markers (capture ignores them too). */
export function classifyReply(text: string): TermLine[] {
  if (typeof text !== "string" || text === "") return [];
  let fenced = false;
  const out: TermLine[] = [];
  for (const raw of text.split(/\r?\n/)) {
    if (/^\s*```/.test(raw)) {
      fenced = !fenced;
      out.push({ spans: [{ text: raw, tone: "dim" }] });
      continue;
    }
    out.push(classifyLine(raw, { markers: !fenced }));
  }
  return out;
}

/** Prompt name for the terminal: the first word of the profile name, lowercase ("john ›"). */
export function promptName(name: string | undefined | null): string {
  const w = (name ?? "").trim().split(/\s+/)[0] ?? "";
  return w === "" ? "you" : w.toLowerCase();
}

export interface Choice {
  key: string;
  label: string;
}

/** Choice lines like `[1] next lesson    [2] more practice` (optionally inside a │ frame). Needs 2+ choices on a line. */
export function parseChoices(text: string): Choice[] {
  if (typeof text !== "string") return [];
  const out: Choice[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/^[\s│]+/, "");
    if (!/^\[\d\]\s*\S/.test(line)) continue;
    const found: Choice[] = [];
    for (const m of line.matchAll(/\[(\d)\]\s*([^[]*)/g)) {
      const label = m[2]!.replace(/[\s│]+$/, "").trim();
      if (label !== "") found.push({ key: m[1]!, label });
    }
    if (found.length >= 2) out.push(...found);
  }
  return out;
}

/** The "┌─ YOUR TURN" frame: its │ lines (without the prefix) as a template, and the line range they cover. */
export function yourTurnFrame(text: string): { template: string; from: number; to: number } | null {
  if (typeof text !== "string") return null;
  const lines = text.split(/\r?\n/);
  const start = lines.findIndex((l) => /^┌─+\s*YOUR TURN/.test(l));
  if (start < 0) return null;
  const body: string[] = [];
  let from = -1;
  let to = -1;
  for (let i = start + 1; i < lines.length; i++) {
    const l = lines[i]!;
    if (/^[└┌]/.test(l)) break;
    if (!SIDE_BAR.test(l)) continue;
    if (from < 0) from = i;
    to = i;
    body.push(l.replace(SIDE_BAR, ""));
  }
  const template = body.join("\n").trim();
  return template === "" ? null : { template, from, to };
}

/** Selection range of the first `___` blank in a template (or null). */
export function firstBlank(template: string): [number, number] | null {
  const m = /_{3,}/.exec(template);
  return m ? [m.index, m.index + m[0].length] : null;
}
