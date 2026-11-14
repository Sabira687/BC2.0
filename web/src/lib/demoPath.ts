/**
 * Quick demo path: which of the five guided steps are done, derived from the app state.
 * Plus the validated preferences (collapsed panel, result seen) kept in the browser.
 */
import type { AppState } from "./types";

export const DEMO_PATH_KEY = "aigo:demo-path:v1";
const MAX_PREFS_BYTES = 1000;

export type DemoStepId = "items" | "lesson" | "help" | "forward" | "result";
export interface DemoStep {
  id: DemoStepId;
  label: string;
  href: string;
  done: boolean;
}

export function demoPath(state: AppState, seen: { result: boolean }): DemoStep[] {
  return [
    { id: "items", label: "Make your items", href: "/start", done: state.created.length > 0 },
    { id: "lesson", label: "Pass lesson 1.1 in the console", href: "/console", done: (state.learnStars.m1 ?? 0) >= 1 },
    { id: "help", label: "Use the Compass in Work chat", href: "/console?tab=work", done: state.helpUsed },
    { id: "forward", label: "Fast-forward John", href: "/progress", done: state.demo.fastForwarded },
    { id: "result", label: "See the test result", href: "/progress", done: seen.result },
  ];
}

export function demoPathDone(state: AppState, seen: { result: boolean }): number {
  return demoPath(state, seen).filter((s) => s.done).length;
}

export interface DemoPathPrefs {
  /** The visitor's own choice; null = never toggled (the default applies). */
  collapsed: boolean | null;
  resultSeen: boolean;
  /** The first-visit auto-open on /collection already happened. */
  introduced: boolean;
}

/** Default: a pill. Auto-opens only while on /collection before the visitor has toggled it or left that page once. */
export function panelOpen(prefs: DemoPathPrefs, pathname: string): boolean {
  if (prefs.collapsed !== null) return !prefs.collapsed;
  return !prefs.introduced && (pathname === "/collection" || pathname.startsWith("/collection/"));
}

export function parseDemoPathPrefs(raw: string | null): DemoPathPrefs {
  const out: DemoPathPrefs = { collapsed: null, resultSeen: false, introduced: false };
  if (raw === null || raw.length > MAX_PREFS_BYTES) return out;
  try {
    const v: unknown = JSON.parse(raw);
    if (typeof v !== "object" || v === null || Array.isArray(v)) return out;
    const o = v as Record<string, unknown>;
    if (typeof o.collapsed === "boolean") out.collapsed = o.collapsed;
    if (typeof o.resultSeen === "boolean") out.resultSeen = o.resultSeen;
    if (typeof o.introduced === "boolean") out.introduced = o.introduced;
  } catch {
    // keep defaults
  }
  return out;
}

/** Fired on window when the stored prefs change in this tab (the "storage" event covers other tabs). */
export const DEMO_PATH_EVENT = "aigo:demo-path-changed";

export function readDemoPathPrefs(): DemoPathPrefs {
  try {
    return parseDemoPathPrefs(window.localStorage.getItem(DEMO_PATH_KEY));
  } catch {
    return parseDemoPathPrefs(null);
  }
}

export function writeDemoPathPrefs(p: DemoPathPrefs): void {
  try {
    window.localStorage.setItem(DEMO_PATH_KEY, JSON.stringify(p));
  } catch {
    // storage refused: the panel just forgets
  }
  try {
    window.dispatchEvent(new Event(DEMO_PATH_EVENT));
  } catch {
    // no window
  }
}

/** A real test result was shown (step 5). Keeps the other stored preferences. */
export function markResultSeen(): void {
  const prefs = readDemoPathPrefs();
  if (prefs.resultSeen) return;
  writeDemoPathPrefs({ ...prefs, resultSeen: true });
}

/** Console tab from the query string: only "work" selects the Work chat; anything else is the lesson. */
export function consoleTabFromParam(v: string | null | undefined): "lesson" | "work" {
  return v === "work" ? "work" : "lesson";
}
