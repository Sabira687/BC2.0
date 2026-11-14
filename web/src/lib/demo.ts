/**
 * Demo "Fast-forward John" with a way back: before the demo fills Set 01, the
 * pre-demo state is stored (validated on the way back in) under its own key.
 * "Back to now" restores it and clears the snapshot.
 */
import type { AppState } from "./types";
import { fastForwardDemo } from "./progress";
import { validateState, type KeyValueStorage } from "./store";

export const DEMO_SNAPSHOT_KEY = "aigo:demo-snapshot:v4";
const MAX_SNAPSHOT_BYTES = 200_000;

function browserStorage(): KeyValueStorage | null {
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch {
    return null;
  }
}

/** Returns false when the browser refused to store the snapshot (an older snapshot is then removed, so "Back to now" can never restore a stale state). */
export function saveDemoSnapshot(state: AppState, storage: KeyValueStorage | null = browserStorage()): boolean {
  try {
    storage?.setItem(DEMO_SNAPSHOT_KEY, JSON.stringify(state));
    return storage !== null;
  } catch {
    clearDemoSnapshot(storage);
    return false;
  }
}

/** The stored pre-demo state, validated like any stored state; null when absent or invalid. */
export function loadDemoSnapshot(storage: KeyValueStorage | null = browserStorage()): AppState | null {
  try {
    const raw = storage?.getItem(DEMO_SNAPSHOT_KEY) ?? null;
    if (raw === null || raw.length > MAX_SNAPSHOT_BYTES) return null;
    return validateState(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function clearDemoSnapshot(storage: KeyValueStorage | null = browserStorage()): void {
  try {
    storage?.removeItem(DEMO_SNAPSHOT_KEY);
  } catch {
    // ignore
  }
}

/** Snapshot the state (only when it is not already a demo state), then fast-forward. */
export function enterDemo(state: AppState, storage: KeyValueStorage | null = browserStorage()): AppState {
  if (!state.demo.fastForwarded) saveDemoSnapshot(state, storage);
  return fastForwardDemo(state);
}

/** Restore the pre-demo state and clear the snapshot. No valid snapshot of this player: state unchanged. */
export function leaveDemo(state: AppState, storage: KeyValueStorage | null = browserStorage()): AppState {
  const snap = loadDemoSnapshot(storage);
  if (!snap || snap.secrets.playerId !== state.secrets.playerId) return state;
  clearDemoSnapshot(storage);
  return snap;
}

/** "Back to now" is offered only for a demo state with a valid stored snapshot of the same player. */
export function canLeaveDemo(state: AppState, storage: KeyValueStorage | null = browserStorage()): boolean {
  if (!state.demo.fastForwarded) return false;
  const snap = loadDemoSnapshot(storage);
  return snap !== null && snap.secrets.playerId === state.secrets.playerId;
}
