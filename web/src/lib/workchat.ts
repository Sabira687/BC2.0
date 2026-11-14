/**
 * Work chat (console tab 2): a plain chat with Claude for real work, where
 * the HELP item can be tried. Pure helpers; no React.
 */
import type { AppState } from "./types";
import type { ChatMessage } from "./chat";
import { itemKindOf } from "./console";

/**
 * Sample work chat from spec/03 §8 (demo data): a vague ask and two
 * "no, …" corrections. The assistant replies are pre-written seed text;
 * the HELP answer that follows comes live from Claude.
 */
export const SAMPLE_WORK_CHAT: readonly ChatMessage[] = [
  { role: "user", content: "write me a report" },
  {
    role: "assistant",
    content:
      "Sure! Here's a general report outline you can adapt:\n\n**Report**\n1. Introduction: purpose and scope\n2. Background: the situation so far\n3. Findings: what you found\n4. Recommendations: what should happen next\n5. Conclusion: a short wrap-up\n\nTell me the topic and I can fill it in.",
  },
  { role: "user", content: "no, shorter" },
  {
    role: "assistant",
    content: "Here's a shorter version:\n\n**Report**\n- Purpose: …\n- Key findings: …\n- Next steps: …",
  },
  { role: "user", content: "no, more formal" },
  {
    role: "assistant",
    content:
      "Certainly. Here is a more formal version:\n\n**Report Summary**\nPurpose: This report sets out …\nFindings: The review identified …\nRecommendations: It is recommended that …\n\nPlease share the subject so I can complete it.",
  },
];

/** True when the conversation starts with the sample chat (to label it as demo data). */
export function startsWithSample(messages: readonly ChatMessage[]): boolean {
  return SAMPLE_WORK_CHAT.every((m, i) => messages[i]?.role === m.role && messages[i]?.content === m.content);
}

/** Help was pasted into this chat (Help works once per chat). */
export function helpUsedIn(messages: readonly ChatMessage[]): boolean {
  return messages.some((m) => m.role === "user" && itemKindOf(m.content) === "help");
}

export type WorkChatAction = "load_sample" | "use_help";

export interface WorkChatHint {
  todo: string;
  steps?: string[];
  actions: WorkChatAction[];
  note?: string;
}

/** Hint panel content for the Work chat tab. */
export function workChatHint(messages: readonly ChatMessage[], pending = false): WorkChatHint {
  const note = "Help works once, on what already happened in the chat.";
  if (pending) return { todo: "Claude is replying…", actions: [] };
  if (helpUsedIn(messages)) {
    const answered = messages[messages.length - 1]?.role === "assistant";
    return answered
      ? { todo: "That was your Help tip. Help is off again: keep chatting as usual, or press Start over to try once more.", actions: [] }
      : { todo: "Waiting for Claude's tip…", actions: [] };
  }
  if (messages.length === 0) {
    return {
      todo: "Try Help in 2 steps:",
      steps: ["Load a sample work chat", "Press Use Help"],
      actions: ["load_sample", "use_help"],
      note,
    };
  }
  return { todo: "When the chat isn't going well, press Use Help to get one tip on it.", actions: ["use_help"], note };
}

/**
 * Using Help in the Work chat also counts as having the HELP item
 * (quest "Create your Help item") and sets helpUsed. Idempotent.
 */
export function markHelpUsed(state: AppState): AppState {
  if (state.created.includes("help") && state.helpUsed) return state;
  return {
    ...state,
    created: state.created.includes("help") ? state.created : [...state.created, "help"],
    helpUsed: true,
  };
}
