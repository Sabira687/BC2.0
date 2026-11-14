import Link from "next/link";
import type { ItemId } from "@/lib/types";
import { kindOf, moduleOfItem } from "@/lib/progress";

/** "Load my Learn card" (adds the set number after Set 1). */
export function loadLabel(id: ItemId): string {
  const word = { learn: "Learn", test: "Test", help: "Help" }[kindOf(id)];
  const m = moduleOfItem(id);
  return `Load my ${word} card${m && m !== "m1" ? ` (Set ${m.slice(1)})` : ""}`;
}

/**
 * One-click "Load my Learn card" button (no copy-paste needed). `text` is null when the card can't be
 * inserted (not created yet, or behind the paywall): then a link to the
 * collection is shown instead.
 */
export function InsertItemButton({
  id,
  text,
  busy,
  onInsert,
}: {
  id: ItemId;
  text: string | null;
  busy: boolean;
  onInsert: (text: string) => void;
}) {
  if (text === null) {
    return (
      <span>
        {loadLabel(id)}: <Link href="/collection">get it in your collection first</Link>{" "}
      </span>
    );
  }
  return (
    <span>
      <button type="button" disabled={busy} onClick={() => onInsert(text)}>
        {loadLabel(id)}
      </button>{" "}
    </span>
  );
}
