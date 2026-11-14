import type { ProMove } from "@/lib/types";

/** HELP "situation → Pro move" table for chat (spec/03 §6). */
export const PRO_MOVES: readonly ProMove[] = [
  {
    situation: "The user sends a vague request with no context, such as \"write me a report\".",
    move: "Use the brief formula: context + goal + format in one message.",
    how: "Rewrite the ask as: \"I'm the [role] at [workplace]. Write [what] for [who] so that [goal]. Format: [length, structure, tone].\"",
    why: "Claude stops guessing, so the first answer is usually the one you keep.",
    technique: "1",
  },
  {
    situation: "The chat is a string of corrections: \"no, not like that\", \"shorter\", \"more formal\".",
    move: "Send one message with an example of what you want.",
    how: "Paste a text you like and write: \"Match the length, tone and structure of this example:\" followed by the example.",
    why: "One example says more than five corrections, and it ends the back-and-forth.",
    technique: "6",
  },
  {
    situation: "The user copies the answer out and rewrites parts of it by hand.",
    move: "Ask the AI to edit the specific part instead.",
    how: "\"Keep everything else exactly as it is. Rewrite only the second paragraph so it sounds less formal.\"",
    why: "You keep what already works and fix the rest in seconds, without starting over.",
    technique: "4",
  },
  {
    situation: "Facts, numbers or links from the answer are being used without checking.",
    move: "Ask for sources, then verify them yourself.",
    how: "\"For every fact and number above, say where it comes from and mark anything you are not sure about.\" Then open the sources and check the key ones.",
    why: "AI can sound confident and still be wrong; a quick check protects your name.",
    technique: "9",
  },
  {
    situation: "The user repeats the same rules (role, tone, format) at the start of every chat.",
    move: "Create a Project with standing instructions (in real Claude).",
    how: "On claude.ai open Projects in the sidebar, create a new project, and paste the rules into its project instructions. Start new chats inside that project.",
    why: "Every chat in the project follows the rules without you typing them again.",
    technique: "B",
  },
  {
    situation: "A long text is pasted in pieces across several messages.",
    move: "Paste it whole in one message, or upload the file.",
    how: "Paste the full text in a single message, or on claude.ai click the + button to attach the document, then ask your question.",
    why: "Claude sees the whole thing at once, so nothing gets lost between pieces.",
    technique: "3",
  },
  {
    situation: "The user needs the same kind of document again and again, such as a weekly report.",
    move: "Make it an Artifact (in real Claude).",
    how: "On claude.ai ask: \"Create a reusable weekly report template as an artifact, with sections Done, Next and Blockers.\" It opens beside the chat, where you can update, copy or download it.",
    why: "The document lives in one place you can reuse, instead of being rebuilt in every chat.",
    technique: "C",
  },
];
