/**
 * Replay mode (pure): when the live coach is unavailable, the console plays
 * back recorded real Claude replies, honestly labelled. Nothing played back
 * counts as progress (no stars, stamps or Help).
 */
import type { ChatMessage } from "./chat";
import { clearConversation } from "./conversation";
import type { KeyValueStorage } from "./store";
import { itemKindOf, lastStatus } from "./console";
import { REPLAY_HELP, REPLAY_LEARN_L11, REPLAY_LEARN_L11_USER } from "./content/replays";

/** Plaque shown above the chat while replaying (the link to /guide is rendered by the component). */
export const REPLAY_PLAQUE_TEXT =
  "REPLAY · the live AI is unavailable right now, these are real Claude replies recorded earlier. Progress isn't counted here.";
export const REPLAY_PLAQUE_LINK = "Use your own Claude";

/** Failed live call → play the recording: 503, any 5xx, network error, 429 of the GLOBAL limit (a per-IP 429 keeps its own message). */
export function shouldReplay(status: number | "network", scope?: string | null): boolean {
  if (status === "network") return true;
  if (status === 429) return scope === "global";
  return status >= 500 && status <= 599;
}

/** Notice after the recording was dropped and a fresh live conversation began. */
export const REPLAY_ENDED_NOTICE = "Replay ended: starting a fresh live lesson.";

const replayedKey = (conversationKey: string): string => `${conversationKey}:replayed`;

/** Remember that the stored conversation contains replayed replies (so live Claude never continues on it). */
export function markReplayed(conversationKey: string, s: KeyValueStorage | null): void {
  try {
    s?.setItem(replayedKey(conversationKey), "1");
  } catch {
    // ignore
  }
}

/** Validated read: only the exact value "1" counts. */
export function wasReplayed(conversationKey: string, s: KeyValueStorage | null): boolean {
  try {
    return s?.getItem(replayedKey(conversationKey)) === "1";
  } catch {
    return false;
  }
}

export function clearReplayed(conversationKey: string, s: KeyValueStorage | null): void {
  try {
    s?.removeItem(replayedKey(conversationKey));
  } catch {
    // ignore
  }
}

/**
 * Entering live mode (reload without ?replay=1, or "Try live again"): a conversation that contains replayed
 * replies is dropped, so a live reply can't build on a recorded CHECK PASSED. Returns true if it was dropped.
 */
export function dropReplayedConversation(conversationKey: string, s: KeyValueStorage | null): boolean {
  if (!wasReplayed(conversationKey, s)) return false;
  clearConversation(s, conversationKey);
  clearReplayed(conversationKey, s);
  return true;
}

/** `?replay=1` in a query string. */
export function replayRequested(search: string): boolean {
  try {
    return new URLSearchParams(search).get("replay") === "1";
  } catch {
    return false;
  }
}

/** Nothing played back from a recording is captured as progress. */
export function countsProgress(replay: boolean): boolean {
  return !replay;
}

/** Recorded reply for a turn index (clamped; "" for an empty script). */
export function replayReply(script: readonly string[], turn: number): string {
  if (script.length === 0) return "";
  return script[Math.min(script.length - 1, Math.max(0, Math.trunc(turn) || 0))]!;
}

const note = (text: string): string => `ⓘ Replay: ${text}\n\n`;
const ACCEPTED = new Set([...REPLAY_LEARN_L11_USER, "Ready, let's go.", "Next lesson"].map((t) => t.trim().toLowerCase()));
const FREE_FORM_MIN = 40;

/** Step the recording must continue after: from the latest status line of lesson 1.1 in the chat (else -1). */
function recordedStep(messages: readonly ChatMessage[]): number {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i]!;
    if (m.role !== "assistant") continue;
    const s = lastStatus([m]);
    if (s) return s.kind === "learn" && s.lesson === "m1.1" ? s.step : -1;
  }
  return -1;
}

/**
 * The reply to give in replay for the conversation so far (last message is the player's).
 * Selection follows the status line of the last reply (robust when the player types something else),
 * never throws, and adds a short note when the recording can't follow what the player wrote.
 */
export function pickReplay(messages: readonly ChatMessage[]): string {
  const last = messages[messages.length - 1];
  const text = last?.role === "user" ? last.content : "";
  const kind = itemKindOf(text);
  if (kind === "help") return replayReply(REPLAY_HELP, 0);
  if (kind === "learn") return replayReply(REPLAY_LEARN_L11, 0);

  const step = recordedStep(messages);
  const inLesson = step >= 0 || messages.some((m) => m.role === "user" && itemKindOf(m.content) === "learn");
  if (!inLesson) {
    // Work chat: the recording only covers the Help card.
    return note("this is a recorded session, so I can't answer new questions. Press “Use Help card” to see the recorded tip.");
  }

  const next = REPLAY_LEARN_L11.findIndex((r) => {
    const s = lastStatus([{ role: "assistant", content: r }]);
    return s?.kind === "learn" && s.step > step;
  });
  if (next < 0) {
    return (
      note("that was the end of the recording. Load the card again to replay lesson 1.1.") +
      replayReply(REPLAY_LEARN_L11, REPLAY_LEARN_L11.length - 1) +
      "\n"
    );
  }
  const reply = replayReply(REPLAY_LEARN_L11, next);
  const understood = ACCEPTED.has(text.trim().toLowerCase()) || text.trim().length >= FREE_FORM_MIN;
  if (understood && step >= 0) return reply;
  return note("this is a recording, so your wording isn't read. Here is the next recorded step.") + reply;
}
