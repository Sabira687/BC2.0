"use client";
/**
 * React binding for the AIGO state. The only place that touches React;
 * all rules live in the pure modules (progress.ts, generator.ts, …).
 *
 * State is shared across components and tabs through a tiny external store
 * (useSyncExternalStore + the "storage" event).
 */
import { useCallback, useMemo, useSyncExternalStore } from "react";
import type { AppState, ItemId, ModuleId, Profile } from "../types";
import { STORAGE_KEY, loadState, resetState, saveState } from "../store";
import {
  activateSubscription,
  applyResultCode,
  cancelSubscription,
  createItem,
  kindOf,
  markCollectionViewed,
  moduleOfItem,
  openSet,
  programOf,
  updateProfile,
  type ApplyResult,
} from "../progress";
import { generateHelp, generateLearn, generateTest, moduleIsLocked } from "../generator";
import { markHelpUsed } from "../workchat";
import { clearDemoSnapshot, enterDemo, leaveDemo } from "../demo";
import { applyCaptured, captureFromAssistant, gainOf, type Captured } from "../capture";
import type { Status } from "../console";

let current: AppState | null = null;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function get(): AppState {
  if (!current) current = loadState();
  return current;
}

function set(next: AppState) {
  if (next === current) return;
  current = next;
  saveState(next);
  emit();
}

function onStorage(e: StorageEvent) {
  // Another tab changed (or cleared) the state: reload and re-validate it.
  if (e.key === null || e.key === STORAGE_KEY) {
    current = loadState();
    emit();
  }
}

function subscribe(listener: () => void) {
  if (listeners.size === 0) window.addEventListener("storage", onStorage);
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener("storage", onStorage);
  };
}

// Server render has no state: components render a neutral shell until hydrated.
const getServer = (): AppState | null => null;

export function useAigo() {
  const state = useSyncExternalStore<AppState | null>(subscribe, get, getServer);

  const actions = useMemo(
    () => ({
      createItem: (id: ItemId) => set(createItem(get(), id)),
      openSet: (module: ModuleId) => set(openSet(get(), module)),
      viewCollection: () => set(markCollectionViewed(get())),
      updateProfile: (profile: Profile) => set(updateProfile(get(), profile)),
      applyResultCode: (code: string): ApplyResult => {
        const result = applyResultCode(get(), code);
        if (result.ok) set(result.state);
        return result;
      },
      /** Help was used in the Work chat: counts as having the HELP item. */
      helpUsed: () => set(markHelpUsed(get())),
      /** Read the marker lines of a finished Claude reply, update stars, stamps and help, and return what is newly gained. */
      captureReply: (text: string, status: Status | null): Captured => {
        const before = get();
        const c = captureFromAssistant(text, status);
        const after = applyCaptured(before, c);
        if (after !== before) set(after);
        return gainOf(before, after, c);
      },
      /** Demo only: fill John's Set 01 progress through the real result-code path. */
      fastForwardDemo: () => set(enterDemo(get())),
      /** Demo only: restore the state from before the fast-forward (no-op without a valid snapshot). */
      backToNow: () => set(leaveDemo(get())),
      /** Demo upgrade: no payment is taken. */
      subscribe: () => set(activateSubscription(get())),
      unsubscribe: () => set(cancelSubscription(get())),
      reset: () => {
        clearDemoSnapshot();
        current = resetState();
        emit();
      },
    }),
    [],
  );

  // Generated once per state change, not on every render (the console
  // re-renders on each keystroke; a LEARN item is ~25 KB of text + base64).
  const texts = useMemo((): Map<ItemId, string> => {
    const out = new Map<ItemId, string>();
    if (!state) return out;
    const appUrl = typeof window !== "undefined" ? window.location.origin : "";
    const program = programOf(state);
    const ctx = { profile: state.profile, secrets: state.secrets, results: state.results, subscribed: state.subscription.active, appUrl };
    for (const id of state.created) {
      const kind = kindOf(id);
      const module = moduleOfItem(id);
      if (kind === "help") out.set(id, generateHelp(state).text);
      else if (module && !moduleIsLocked(program, module)) {
        try {
          out.set(id, kind === "learn" ? generateLearn(ctx, module).text : generateTest(ctx, module).text);
        } catch {
          // no content for this item (e.g. a test that is not written yet)
        }
      }
    }
    return out;
  }, [state]);

  /** Pasteable text of a created item, or null (not created, or behind the paywall). */
  const itemText = useCallback((id: ItemId): string | null => texts.get(id) ?? null, [texts]);

  /** The player's HELP item text, available in the Work chat even before it is created. */
  const helpText = useMemo(() => (state ? generateHelp(state).text : null), [state]);

  return { state, actions, itemText, helpText };
}
