/**
 * Automatic capture: reads the marker lines that items tell Claude to print
 * (activation, stars, stamps, help used) and folds them into AppState.
 * Pure and tolerant: unknown text is ignored, nothing here throws.
 */
import type { Status } from "./console";
import { TECHNIQUES, TECHNIQUE_ALIASES } from "./content/techniques";
import { markHelpUsed } from "./workchat";
import { addStamps } from "./progress";
import type { AppState, ItemKind, ModuleId, Stars, TechniqueCode } from "./types";

export type Captured = {
  activated?: ItemKind;
  learnStars?: { module: ModuleId; stars: Stars };
  stamps: TechniqueCode[];
  helpUsed: boolean;
};

const SCAN_CHARS = 8000;
const SEP = "[·•|:\\-–—]";
const ACTIVATED_RE = new RegExp(`^item\\s*activated\\s*${SEP}?\\s*(learn|test|help)\\b`, "i");
const CHECK_RE = /^check\s*passed\b(.*)$/i;
const STAMP_RE = new RegExp(`^stamp\\s*earned\\s*${SEP}?\\s*(.+)$`, "i");
const HELP_USED_RE = /^help\s*used\b(?:\s*[·•|:\-–—].{0,40})?\W*$/i;

/** Drops markdown decoration and anything before the first letter or digit. */
export function cleanLine(line: string): string {
  return line.replace(/[*_`]/g, "").replace(/^[^\p{L}\p{N}]+/u, "").trim();
}

function normalize(name: string): string {
  return name
    .toLowerCase()
    .replace(/[*_`]/g, "")
    .replace(/\s+/g, " ")
    .replace(/[\s.,;:!?)\]]+$/, "")
    .replace(/^[\s([]+/, "")
    .trim();
}

const TECHNIQUE_KEYS: { code: TechniqueCode; keys: string[] }[] = TECHNIQUES.map((t) => {
  const full = normalize(t.name);
  const head = full.includes(":") ? normalize(full.split(":")[0]!) : full;
  const aliases = (TECHNIQUE_ALIASES[t.code] ?? []).map(normalize);
  return { code: t.code, keys: [full, head, ...aliases] };
});

/** The name, then a boundary: end, space, "(", ":" or a dash ("Brief formula (context + goal + format)"). */
const BOUNDARY_RE = /^(?:$|[\s(:\-–—])/;

export function techniqueByName(raw: string): TechniqueCode | null {
  // Trailing emoji / punctuation (✅ 🎉 ! .) are not part of the name.
  const n = normalize(raw.replace(/[^\p{L}\p{N}]+$/u, ""));
  if (n === "") return null;
  const exact = TECHNIQUE_KEYS.find((t) => t.keys.includes(n));
  if (exact) return exact.code;
  let best: { code: TechniqueCode; len: number } | null = null;
  for (const t of TECHNIQUE_KEYS) {
    for (const k of t.keys) {
      if (n.startsWith(k) && BOUNDARY_RE.test(n.slice(k.length)) && (!best || k.length > best.len)) best = { code: t.code, len: k.length };
    }
  }
  return best?.code ?? null;
}

function countStars(s: string): number {
  return Math.min(3, (s.match(/★|⭐/g) ?? []).length);
}

export function captureFromAssistant(text: string, status: Status | null): Captured {
  const out: Captured = { stamps: [], helpUsed: false };
  if (typeof text !== "string" || text === "") return out;
  const found = new Set<TechniqueCode>();
  let maxStars = -1;
  for (const raw of text.slice(-SCAN_CHARS).split(/\r?\n/)) {
    if (raw.length > 400) continue; // marker lines are short
    const line = cleanLine(raw);
    if (line === "") continue;
    const act = ACTIVATED_RE.exec(line);
    if (act) {
      out.activated = act[1]!.toLowerCase() as ItemKind;
      if (out.activated === "help") out.helpUsed = true;
      continue;
    }
    const chk = CHECK_RE.exec(line);
    if (chk) {
      const n = countStars(chk[1]!);
      if (n > 0) maxStars = Math.max(maxStars, n);
      continue;
    }
    const st = STAMP_RE.exec(line);
    if (st) {
      const code = techniqueByName(st[1]!);
      if (code) found.add(code);
      continue;
    }
    if (HELP_USED_RE.test(line)) out.helpUsed = true;
  }
  out.stamps = TECHNIQUES.map((t) => t.code).filter((c) => found.has(c));
  if (maxStars > 0 && status && status.kind === "learn") out.learnStars = { module: status.module, stars: maxStars as Stars };
  return out;
}

/** Monotonic and idempotent; returns the same object when nothing changes. */
export function applyCaptured(state: AppState, c: Captured): AppState {
  let next = state;
  if (c.learnStars) {
    const { module, stars } = c.learnStars;
    if (stars > (next.learnStars[module] ?? 0)) next = { ...next, learnStars: { ...next.learnStars, [module]: stars } };
  }
  const stamps = addStamps(next.stamps, c.stamps);
  if (stamps !== next.stamps) next = { ...next, stamps };
  if (c.helpUsed) next = markHelpUsed(next);
  return next;
}

/** What a reply newly gave the player (diff of the state before/after applying it). Not persisted. */
export function gainOf(before: AppState, after: AppState, c: Captured): Captured {
  const out: Captured = {
    stamps: c.stamps.filter((s) => !before.stamps.includes(s)),
    helpUsed: c.helpUsed && !before.helpUsed && after.helpUsed,
  };
  if (c.activated) out.activated = c.activated;
  if (c.learnStars && (after.learnStars[c.learnStars.module] ?? 0) > (before.learnStars[c.learnStars.module] ?? 0)) out.learnStars = c.learnStars;
  return out;
}
