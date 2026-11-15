import { getModule } from "@/lib/content";
import { kindOf, moduleOfItem } from "@/lib/progress";
import type { ItemId, ItemKind } from "@/lib/types";

/** Static copy for the three live item types (placeholder text until the final design). */
export const ITEM_INFO: Record<ItemKind, { title: string; description: string; howTo: string }> = {
  learn: {
    title: "LEARN",
    description: "Lessons on one set: your AI teaches you a new skill on real tasks from your own work.",
    howTo:
      "Copy the card and paste it into a new chat in your own AI: it activates and teaches you a new skill. Or try it quickly in the lesson here on the site (press “Load my Learn card”). When the set is done, take its TEST.",
  },
  test: {
    title: "TEST",
    description: "3 questions + 2 practical tasks on one set. You get a score out of 100, stars and a RESULT CODE.",
    howTo:
      "After the set's LEARN, copy the card and paste it into a new chat in your own Claude (or try it in the lesson here). It ends with a RESULT CODE: add it on the Progress page.",
  },
  help: {
    title: "HELP",
    description: "One-shot advice: Claude looks at where you are and suggests the best next move.",
    howTo: "Copy the card and paste it mid-task in your own Claude. It activates, helps once, then the chat goes on as usual.",
  },
};

export const LIVE_KINDS: readonly ItemKind[] = ["learn", "test", "help"];

export function isItemKind(value: string): value is ItemKind {
  return (LIVE_KINDS as readonly string[]).includes(value);
}

/** Short label, e.g. "LEARN · Module 1" or "HELP". */
export function itemLabel(id: ItemId): string {
  const module = moduleOfItem(id);
  const kind = ITEM_INFO[kindOf(id)].title;
  return module ? `${kind} · Set ${module.slice(1)}` : kind;
}

/** Full title, e.g. "LEARN · Set 1 — The Clear Ask". */
export function itemTitle(id: ItemId): string {
  const module = moduleOfItem(id);
  return module ? `${itemLabel(id)} — ${getModule(module).title}` : itemLabel(id);
}
