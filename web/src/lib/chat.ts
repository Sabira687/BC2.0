/**
 * Console chat: shared limits and request validation (used by the client to
 * pre-check and by the /api/chat route to enforce). Pure, no Node/browser APIs.
 */

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

/** One pasted message: a LEARN item is ~25 KB, so this leaves room. */
export const MAX_MESSAGE_CHARS = 40_000;
/** Whole conversation sent per request. */
export const MAX_TOTAL_CHARS = 250_000;
export const MAX_MESSAGES = 80;
/** Raw request body cap (JSON overhead included). */
export const MAX_BODY_BYTES = 400_000;

export type ChatValidation = { ok: true; messages: ChatMessage[] } | { ok: false; error: string };

/**
 * Validate an untrusted request body. Only role/content strings survive;
 * any other field is dropped. Conversation must start and end with the user.
 */
export function validateChatBody(body: unknown): ChatValidation {
  if (typeof body !== "object" || body === null) return { ok: false, error: "Body must be a JSON object." };
  const raw = (body as Record<string, unknown>).messages;
  if (!Array.isArray(raw) || raw.length === 0) return { ok: false, error: "messages must be a non-empty array." };
  if (raw.length > MAX_MESSAGES) return { ok: false, error: `This conversation is too long (max ${MAX_MESSAGES} messages). Start a new one.` };
  const messages: ChatMessage[] = [];
  let total = 0;
  for (const m of raw) {
    if (typeof m !== "object" || m === null) return { ok: false, error: "Invalid message." };
    const { role, content } = m as Record<string, unknown>;
    if (role !== "user" && role !== "assistant") return { ok: false, error: "Invalid message role." };
    if (typeof content !== "string" || content.trim() === "") return { ok: false, error: "Messages must be non-empty text." };
    if (content.length > MAX_MESSAGE_CHARS) return { ok: false, error: `A message is too long (max ${MAX_MESSAGE_CHARS.toLocaleString("en-US")} characters).` };
    total += content.length;
    messages.push({ role, content });
  }
  if (total > MAX_TOTAL_CHARS) return { ok: false, error: "This conversation is too long. Start a new conversation." };
  if (messages[0]?.role !== "user" || messages[messages.length - 1]?.role !== "user") {
    return { ok: false, error: "The conversation must start and end with your message." };
  }
  return { ok: true, messages };
}

/**
 * System prompt for the console: as close to a plain Claude chat as possible,
 * so that items behave the same here and in claude.ai. Item text arrives as a
 * normal user message.
 */
export const CONSOLE_SYSTEM_PROMPT = [
  "You are Claude, an AI assistant made by Anthropic.",
  "You are chatting with a user in the AIGO practice console, a plain chat window: there is no web search, no file upload, no Projects and no Artifacts here.",
  "Reply in plain text with light Markdown (bold, lists, short code blocks). Keep replies focused.",
].join("\n");
