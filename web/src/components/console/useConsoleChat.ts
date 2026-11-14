"use client";
/**
 * Console chat session: holds the conversation, streams replies from
 * /api/chat and persists completed turns. Rules (limits, validation,
 * storage format) live in src/lib/chat.ts and src/lib/conversation.ts.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { MAX_MESSAGE_CHARS, validateChatBody, type ChatMessage } from "@/lib/chat";
import {
  REPLAY_ENDED_NOTICE,
  countsProgress,
  clearReplayed,
  dropReplayedConversation,
  markReplayed,
  pickReplay,
  replayRequested,
  shouldReplay,
} from "@/lib/replay";
import { CONVERSATION_KEY, clearConversation, loadConversation, saveConversation } from "@/lib/conversation";

function localStore(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function errorFrom(data: unknown): string | null {
  if (typeof data === "object" && data !== null) {
    const e = (data as Record<string, unknown>).error;
    if (typeof e === "string" && e.trim() !== "") return e;
  }
  return null;
}

function scopeFrom(data: unknown): string | null {
  if (typeof data === "object" && data !== null) {
    const v = (data as Record<string, unknown>).scope;
    if (v === "ip" || v === "global") return v;
  }
  return null;
}

export function useConsoleChat(storageKey: string = CONVERSATION_KEY, onAssistantDone?: (messages: ChatMessage[]) => void) {
  /** null until loaded from storage (client only). */
  const [messages, setMessages] = useState<ChatMessage[] | null>(null);
  /** Text of the reply being streamed, or null when idle. */
  const [streaming, setStreaming] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  /** Replay mode: recorded replies instead of the live coach (`?replay=1`, or after a failed live call). */
  const [replay, setReplay] = useState(false);
  const replayRef = useRef(false);
  /** One-line notice shown after a replayed conversation was dropped. */
  const [notice, setNotice] = useState<string | null>(null);

  const messagesRef = useRef<ChatMessage[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  /** Bumped by reset(): a reply from an older conversation must not be committed. */
  const generation = useRef(0);
  const doneRef = useRef(onAssistantDone);
  doneRef.current = onAssistantDone;

  const commit = useCallback((next: ChatMessage[]) => {
    messagesRef.current = next;
    setMessages(next);
  }, []);

  useEffect(() => {
    if (replayRequested(window.location.search)) {
      replayRef.current = true;
      setReplay(true);
    } else if (dropReplayedConversation(storageKey, localStore())) {
      setNotice(REPLAY_ENDED_NOTICE);
    }
    commit(loadConversation(undefined, storageKey));
    return () => abortRef.current?.abort();
  }, [commit, storageKey]);

  const run = useCallback(
    async (next: ChatMessage[]) => {
      const gen = generation.current;
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setStreaming("");
      let acc = "";
      let failure: string | null = null;
      /** HTTP status or "network" of a failed live call (decides whether to fall back to replay). */
      let failStatus: number | "network" | null = null;
      let failScope: string | null = null;
      let replayed = replayRef.current;
      try {
        if (replayed) {
          // A short pause so the recorded reply doesn't look instant; Stop still works.
          await new Promise<void>((resolve) => setTimeout(resolve, 400));
          if (!ctrl.signal.aborted) acc = pickReplay(next);
        } else {
          const res = await fetch("/api/chat", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ messages: next }),
            signal: ctrl.signal,
          });
          if (!res.ok || !res.body) {
            let data: unknown = null;
            try {
              data = await res.json();
            } catch {
              // not JSON
            }
            failStatus = res.status;
            failScope = scopeFrom(data);
            failure = errorFrom(data) ?? `Couldn't reach Claude (error ${res.status}). Please try again.`;
          } else {
            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            for (;;) {
              const { done, value } = await reader.read();
              if (done) break;
              acc += decoder.decode(value, { stream: true });
              if (gen === generation.current) setStreaming(acc);
            }
            acc += decoder.decode();
          }
        }
      } catch {
        if (!ctrl.signal.aborted) {
          failStatus = "network";
          failure = "Network error. Check your connection and send again.";
        }
      }

      // The live coach is down: continue on the recording, honestly labelled (nothing counts as progress).
      if (!replayed && failStatus !== null && acc.trim() === "" && !ctrl.signal.aborted && shouldReplay(failStatus, failScope)) {
        replayRef.current = true;
        replayed = true;
        failure = null;
        acc = pickReplay(next);
        if (gen === generation.current) setReplay(true);
      }

      if (gen !== generation.current) return; // conversation was reset meanwhile
      abortRef.current = null;
      setStreaming(null);
      if (acc.trim() !== "") {
        let reply = ctrl.signal.aborted ? `${acc}\n\n[Stopped.]` : acc;
        if (reply.length > MAX_MESSAGE_CHARS) reply = reply.slice(0, MAX_MESSAGE_CHARS);
        const done: ChatMessage[] = [...next, { role: "assistant", content: reply }];
        if (replayed) markReplayed(storageKey, localStore());
        commit(done);
        saveConversation(done, undefined, storageKey);
        // Only a reply that finished streaming cleanly counts (not errors or stops).
        if (failure === null && !ctrl.signal.aborted && countsProgress(replayed)) doneRef.current?.(done);
      } else {
        // Keep the user's message so they can retry.
        saveConversation(next, undefined, storageKey);
        if (failure === null && !ctrl.signal.aborted) failure = "Claude sent an empty reply. Try again.";
      }
      setError(failure);
    },
    [commit, storageKey],
  );

  /** Adds a user message and starts the reply. Returns false (and sets `error`) if it can't be sent. */
  const send = useCallback(
    (text: string): boolean => {
      if (abortRef.current) return false;
      const content = text.trim();
      if (content === "") return false;
      const next: ChatMessage[] = [...messagesRef.current, { role: "user", content }];
      const check = validateChatBody({ messages: next });
      if (!check.ok) {
        setError(check.error);
        return false;
      }
      setError(null);
      setNotice(null);
      commit(next);
      void run(next);
      return true;
    },
    [commit, run],
  );

  /** Resend when the last message is the user's (after an error or a stop). */
  const retry = useCallback(() => {
    const current = messagesRef.current;
    if (abortRef.current || current[current.length - 1]?.role !== "user") return;
    setError(null);
    void run(current);
  }, [run]);

  /** Back to the live coach ("Try live again"); drops `?replay=1` from the address. */
  const leaveReplay = useCallback(() => {
    replayRef.current = false;
    setReplay(false);
    setError(null);
    const url = new URL(window.location.href);
    if (url.searchParams.has("replay")) {
      url.searchParams.delete("replay");
      window.history.replaceState(null, "", url.pathname + url.search + url.hash);
    }
    // Live Claude must not continue on a history that holds recorded replies.
    if (dropReplayedConversation(storageKey, localStore())) {
      generation.current++;
      abortRef.current?.abort();
      abortRef.current = null;
      setStreaming(null);
      commit([]);
      setNotice(REPLAY_ENDED_NOTICE);
    }
  }, [commit, storageKey]);

  const stop = useCallback(() => abortRef.current?.abort(), []);

  const reset = useCallback(() => {
    generation.current++;
    abortRef.current?.abort();
    abortRef.current = null;
    setStreaming(null);
    setError(null);
    clearConversation(undefined, storageKey);
    clearReplayed(storageKey, localStore());
    commit([]);
  }, [commit, storageKey]);

  /** Replace the history without asking Claude (e.g. a sample chat). Ignored while a reply streams. */
  const seed = useCallback(
    (history: ChatMessage[]) => {
      if (abortRef.current) return;
      generation.current++;
      setError(null);
      commit(history);
      saveConversation(history, undefined, storageKey);
      if (replayRef.current) markReplayed(storageKey, localStore());
    },
    [commit, storageKey],
  );

  return {
    messages,
    streaming,
    busy: streaming !== null,
    error,
    replay,
    notice,
    leaveReplay,
    send,
    retry,
    stop,
    reset,
    seed,
  };
}
