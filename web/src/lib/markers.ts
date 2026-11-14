/**
 * Chat display helpers (pure): split Claude's marker lines into events, find which card is active,
 * and build the mini-card view. Marker rules mirror capture.ts (same cleaning and technique matching).
 */
import type { ChatMessage } from "./chat";
import type { AppState, ItemKind, ModuleId } from "./types";
import { albumOf } from "./album";
import { cleanLine, techniqueByName } from "./capture";
import { getModule, itemFor, moduleOfItemName, type Rarity } from "./content";
import { itemKindOf, lastStatus } from "./console";
import { HELP_TITLE, itemSummary } from "./generator";
import { START_BY_LEVEL } from "./program";
import { testStars } from "./scoring";

export type MarkerKind = "activated" | "pass" | "stamp" | "help" | "test";
export type MarkerSegment = { type: "text"; text: string } | { type: "event"; kind: MarkerKind; text: string };

const SCAN_CHARS = 8000;
const MAX_LINE = 400;
const SEP = "[·•|:\\-–—]";
const ACTIVATION_RE = new RegExp(`^item\\s*activated\\s*${SEP}?\\s*(learn|test|help)\\b\\s*${SEP}?\\s*(.*)$`, "i");
/** Deliberately stricter than capture's CHECK_RE: a display event needs a separator, stars or the line end, so prose like "Check passed! Nice." stays text. */
const PASS_RE = new RegExp(`^check\\s*passed\\s*(?:${SEP}|[★⭐☆]|$)`, "i");
const STAMP_RE = new RegExp(`^stamp\\s*earned\\s*${SEP}?\\s*(.+)$`, "i");
const HELP_USED_RE = /^help\s*used\b(?:\s*[·•|:\-–—].{0,40})?\W*$/i;
/** Only the summary line counts (stars or a score after the separator); the frame title " TEST COMPLETE · PROVING LOCK" does not. */
const TEST_COMPLETE_RE = new RegExp(`^test\\s*complete\\s*${SEP}\\s*(?:[★⭐☆]|\\d{1,3}\\s*/\\s*\\d{1,3})`, "i");

function eventKind(line: string): MarkerKind | null {
  const act = ACTIVATION_RE.exec(line);
  if (act) {
    const k = act[1]!.toLowerCase();
    return k === "learn" ? "activated" : (k as "test" | "help");
  }
  if (PASS_RE.test(line)) return "pass";
  const st = STAMP_RE.exec(line);
  if (st) return techniqueByName(st[1]!) ? "stamp" : null;
  if (HELP_USED_RE.test(line)) return "help";
  if (TEST_COMPLETE_RE.test(line)) return "test";
  return null;
}

/** The marker kind of one raw line (same rules as splitMarkers), or null. */
export function lineMarker(raw: string): MarkerKind | null {
  if (typeof raw !== "string" || raw.length > MAX_LINE) return null;
  const line = cleanLine(raw);
  return line === "" ? null : eventKind(line);
}

/** Claude's text as text blocks and marker events (▶ ITEM ACTIVATED, ✅ CHECK PASSED, STAMP EARNED, HELP USED, TEST COMPLETE). */
export function splitMarkers(text: string): MarkerSegment[] {
  if (typeof text !== "string" || text === "") return [];
  const out: MarkerSegment[] = [];
  let buf: string[] = [];
  const flush = () => {
    const t = buf.join("\n").replace(/^(?:[ \t]*\n)+/, "").replace(/(?:\n[ \t]*)+$/, "");
    if (t.trim() !== "") out.push({ type: "text", text: t });
    buf = [];
  };
  let fenced = false;
  for (const raw of text.split(/\r?\n/)) {
    if (/^\s*```/.test(raw)) {
      fenced = !fenced;
      buf.push(raw);
      continue;
    }
    const line = fenced || raw.length > MAX_LINE ? "" : cleanLine(raw);
    const kind = line === "" ? null : eventKind(line);
    if (kind) {
      flush();
      out.push({ type: "event", kind, text: line });
    } else buf.push(raw);
  }
  flush();
  return out;
}

export interface Activation {
  kind: ItemKind;
  /** Card title printed after the kind, or null (older HELP line, or none). */
  title: string | null;
}

/** The last "ITEM ACTIVATED · KIND · Title" line in a reply, or null. */
export function parseActivation(text: string): Activation | null {
  if (typeof text !== "string") return null;
  let found: Activation | null = null;
  for (const raw of text.slice(-SCAN_CHARS).split(/\r?\n/)) {
    if (raw.length > MAX_LINE) continue;
    const m = ACTIVATION_RE.exec(cleanLine(raw));
    if (m) found = { kind: m[1]!.toLowerCase() as ItemKind, title: m[2]!.trim() === "" ? null : m[2]!.trim() };
  }
  return found;
}

export interface ActiveCard {
  kind: ItemKind;
  title: string | null;
  module: ModuleId | null;
  /** Index of the message that made it active (changes when a new card is activated). */
  at: number;
}

function headerModule(content: string): ModuleId | null {
  const m = /AIGO ░ (?:LEARN|TEST) · SET (\d{2})/.exec(content);
  return m ? (`m${Number(m[1])}` as ModuleId) : null;
}

/** The card the conversation is on: Claude's last activation line, else the last pasted item header. */
export function activeCard(messages: readonly ChatMessage[]): ActiveCard | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i]!;
    if (m.role === "user") {
      const kind = itemKindOf(m.content);
      if (kind) return { kind, title: null, module: headerModule(m.content), at: i };
      continue;
    }
    const act = parseActivation(m.content);
    if (!act) continue;
    let module: ModuleId | null = act.kind === "help" || !act.title ? null : moduleOfItemName(act.title);
    if (!module && act.kind !== "help") {
      for (let j = i - 1; j >= 0 && !module; j--) if (messages[j]!.role === "user" && itemKindOf(messages[j]!.content)) module = headerModule(messages[j]!.content);
    }
    return { kind: act.kind, title: act.title, module, at: i };
  }
  return null;
}

const SHAPE: Record<ItemKind, string> = { learn: "■", test: "▲", help: "●" };

/** "■ LEARN · The Clear Ask is active" */
export function activeChip(kind: ItemKind, title: string): string {
  return `${SHAPE[kind]} ${kind.toUpperCase()} · ${title} is active`;
}

export interface ActiveCardView {
  kind: ItemKind;
  module: ModuleId;
  /** Item name, e.g. "Three-Tooth Key" (the set title while the item is not written). */
  title: string;
  /** Set title shown above the item name, e.g. "THE CLEAR ASK". */
  overline: string;
  rarity: Rarity;
  /** The item has its own illustration. */
  art: boolean;
  flavor: string;
  /** undefined for HELP (no stars). */
  stars?: number;
  setLabel: string;
  properties: string;
  /** A card is active in the conversation (false = showing the default LEARN card). */
  active: boolean;
  chip: string | null;
  at: number | null;
}

const PROPERTIES: Record<ItemKind, string> = { learn: "Learn · 3 lessons", test: "Test · 5 tasks", help: "Help · ~1 min" };

/** Mini-card view of one card (kind + set). Stars come straight from the state, so they update as capture applies them. */
export function cardView(state: AppState, kind: ItemKind, opts: { module?: ModuleId; title?: string | null } = {}): ActiveCardView {
  const start = START_BY_LEVEL[state.profile.level];
  const module = kind === "help" ? start : (opts.module ?? start);
  const item = itemFor(module, kind);
  const title = opts.title ?? item.name;
  const set = albumOf(state).find((s) => s.module === module);
  const stars = kind === "help" ? undefined : kind === "learn" ? (state.learnStars[module] ?? 0) : (state.results[module] ? testStars(state.results[module]!.score) : 0);
  return {
    kind,
    module,
    title,
    overline: getModule(module).title.toUpperCase(),
    rarity: item.rarity,
    art: item.written,
    flavor: itemSummary(state.profile, kind === "help" ? null : module, kind).flavor,
    stars,
    setLabel: set ? `S${set.number} · ${set.counter.replace(/\s/g, "")}` : `S${module.slice(1).padStart(2, "0")}`,
    properties: PROPERTIES[kind],
    active: false,
    chip: null,
    at: null,
  };
}

/** What the right-hand mini card shows for this conversation: the active card, else the start LEARN card. */
export function activeCardView(state: AppState, messages: readonly ChatMessage[]): ActiveCardView {
  const ac = activeCard(messages);
  const kind = ac?.kind ?? "learn";
  const v = cardView(state, kind, { module: ac?.module ?? lastStatus(messages)?.module ?? undefined, title: ac?.title });
  return ac ? { ...v, active: true, chip: activeChip(kind, v.title), at: ac.at } : v;
}

/** Claude printed HELP USED in this conversation (Help was counted from the line itself). */
export function helpUsedSeen(messages: readonly ChatMessage[]): boolean {
  return messages.some((m) => m.role === "assistant" && splitMarkers(m.content).some((s) => s.type === "event" && s.kind === "help" && HELP_USED_RE.test(s.text)));
}

/** Label of a pasted item message, e.g. { kind: "learn", title: "Three-Tooth Key" } (the title comes from the set number in its header). */
export function pastedCard(content: string): { kind: ItemKind; title: string } | null {
  const kind = itemKindOf(content);
  if (!kind) return null;
  if (kind === "help") return { kind, title: HELP_TITLE };
  const module = headerModule(content);
  return { kind, title: module ? itemFor(module, kind).name : kind === "learn" ? "Learn card" : "Test card" };
}
