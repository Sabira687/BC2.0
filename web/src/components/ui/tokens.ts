/**
 * Pure helpers for the v4 design system (kind -> color/shape, difficulty -> ink, stars -> text).
 * UI components import from here; no React in this file so it is unit-testable.
 */
export type CardKind = "learn" | "test" | "help";
export type StampDifficulty = "start" | "easy" | "medium" | "hard";
export type EventKind = "activated" | "pass" | "stamp" | "help" | "test";

export interface KindMeta {
  label: string; // LEARN / TEST / HELP
  shape: string; // ■ ▲ ●
  color: string; // main type color
  frame: string; // frame gradient (150deg light -> main -> dark)
  glow: string; // illustration window glow
  clip: string; // clip-path of the big shape in the illustration window
  tint: string; // light tint for chips
  dark: string; // dark text on tint
}

export const KIND_META: Record<CardKind, KindMeta> = {
  learn: {
    label: "LEARN",
    shape: "■",
    color: "#2563EB",
    frame: "linear-gradient(150deg, #60A5FA 0%, #2563EB 45%, #1E3A8A 100%)",
    glow: "rgba(96,165,250,0.55)",
    clip: "inset(0)",
    tint: "#EFF6FF",
    dark: "#1E3A8A",
  },
  test: {
    label: "TEST",
    shape: "▲",
    color: "#A21CAF",
    frame: "linear-gradient(150deg, #E879F9 0%, #A21CAF 45%, #581C87 100%)",
    glow: "rgba(232,121,249,0.5)",
    clip: "polygon(50% 0, 100% 100%, 0 100%)",
    tint: "#FDF4FF",
    dark: "#581C87",
  },
  help: {
    label: "HELP",
    shape: "●",
    color: "#15803D",
    frame: "linear-gradient(150deg, #4ADE80 0%, #15803D 45%, #14532D 100%)",
    glow: "rgba(74,222,128,0.45)",
    clip: "circle(50% at 50% 50%)",
    tint: "#F0FDF4",
    dark: "#14532D",
  },
};

export const HOLO_GRADIENT = "linear-gradient(125deg, #7DD3FC 0%, #F0ABFC 25%, #FDE68A 50%, #86EFAC 75%, #7DD3FC 100%)";

export const STAR_COLOR = "#E2A300";
export const STAR_EMPTY = "#C9C1B0";

/** Stamp inks by difficulty: start gray, easy green, medium yellow, hard red. Dark variants, text contrast >= 4.5:1 on white and on paper (#F4F0E8). Mirrored in the --ink-* CSS vars (app/globals.css). */
export const DIFFICULTY_INK: Record<StampDifficulty, { ink: string; label: string }> = {
  start: { ink: "#475569", label: "START" },
  easy: { ink: "#166534", label: "EASY" },
  medium: { ink: "#854D0E", label: "MEDIUM" },
  hard: { ink: "#B91C1C", label: "HARD" },
};

/** Accepts "Easy" | "easy" (the lib/album Difficulty type) and returns the lowercase key. */
export function difficultyKey(d: string): StampDifficulty {
  const k = d.toLowerCase();
  return k === "start" || k === "medium" || k === "hard" ? k : "easy";
}

/** Clamp to an integer in [0, max]. */
export function clampStars(value: number, max = 3): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(max, Math.floor(value)));
}

/** Plain-text twin of the star row, e.g. "2 of 3 stars". */
export function starsText(value: number, max = 3): string {
  const v = clampStars(value, max);
  return `${v} of ${max} ${max === 1 && v === 1 ? "star" : "stars"}`;
}

/** Colors for the event lines (white plaque + colored left bar). */
export const EVENT_COLOR: Record<EventKind, { bar: string; glyph: string }> = {
  activated: { bar: "#2563EB", glyph: "▶" },
  pass: { bar: "#15803D", glyph: "✅" },
  stamp: { bar: "#0F766E", glyph: "◉" },
  help: { bar: "#15803D", glyph: "●" },
  test: { bar: "#A21CAF", glyph: "▲" },
};

/** Deterministic small rotation for a stamp, from its code (so it is stable across renders). */
export function stampRotation(code: string): number {
  let h = 0;
  for (let i = 0; i < code.length; i++) h = (h * 31 + code.charCodeAt(i)) | 0;
  const steps = [-9, -6, -4, 4, 6, 9];
  return steps[Math.abs(h) % steps.length] ?? -4;
}
