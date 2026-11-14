/**
 * Console conversation persistence (localStorage, per browser).
 * Read-back data is untrusted: validated and capped like a chat request.
 */
import { MAX_MESSAGES, MAX_MESSAGE_CHARS, MAX_TOTAL_CHARS, type ChatMessage } from "./chat";
import type { KeyValueStorage } from "./store";

export const CONVERSATION_KEY = "aigo:console:v1";
/** The Work chat tab keeps its own conversation. */
export const WORKCHAT_KEY = "aigo:workchat:v1";

export function validateConversation(v: unknown): ChatMessage[] | null {
  if (!Array.isArray(v) || v.length > MAX_MESSAGES) return null;
  const out: ChatMessage[] = [];
  let total = 0;
  for (const m of v) {
    if (typeof m !== "object" || m === null) return null;
    const { role, content } = m as Record<string, unknown>;
    if ((role !== "user" && role !== "assistant") || typeof content !== "string" || content.length > MAX_MESSAGE_CHARS) return null;
    total += content.length;
    out.push({ role, content });
  }
  return total <= MAX_TOTAL_CHARS ? out : null;
}

function storage(): KeyValueStorage | null {
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch {
    return null;
  }
}

export function loadConversation(s: KeyValueStorage | null = storage(), key: string = CONVERSATION_KEY): ChatMessage[] {
  try {
    const raw = s?.getItem(key);
    if (!raw || raw.length > MAX_TOTAL_CHARS * 2) return [];
    return validateConversation(JSON.parse(raw)) ?? [];
  } catch {
    return [];
  }
}

export function saveConversation(messages: readonly ChatMessage[], s: KeyValueStorage | null = storage(), key: string = CONVERSATION_KEY): boolean {
  try {
    s?.setItem(key, JSON.stringify(messages));
    return s !== null;
  } catch {
    return false;
  }
}

export function clearConversation(s: KeyValueStorage | null = storage(), key: string = CONVERSATION_KEY): void {
  try {
    s?.removeItem(key);
  } catch {
    // ignore
  }
}
