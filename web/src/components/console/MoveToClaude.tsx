"use client";
import Link from "next/link";
import { useState } from "react";

/** Copies a card to the clipboard and explains how to continue on claude.ai. */
export function MoveToClaude({ text, buttonClassName }: { text: string | null; buttonClassName?: string }) {
  const [open, setOpen] = useState(false);
  const [copy, setCopy] = useState<"copied" | "failed" | null>(null);

  async function onClick() {
    if (!text) return;
    setOpen(true);
    try {
      await navigator.clipboard.writeText(text);
      setCopy("copied");
    } catch {
      setCopy("failed");
    }
  }

  return (
    <div>
      <button type="button" className={buttonClassName} onClick={onClick} disabled={!text}>
        Continue in your own Claude
      </button>
      {!text && (
        <small>
          {" "}
          Create a card in the <Link href="/collection">collection</Link> first.
        </small>
      )}
      {open && (
        <div role="status">
          {copy === "copied" && <p>The card is copied.</p>}
          {copy === "failed" && (
            <p>
              Couldn&apos;t copy automatically. Copy it from its card page (open it from the{" "}
              <Link href="/collection">collection</Link>).
            </p>
          )}
          <ol>
            <li>
              Open{" "}
              <a href="https://claude.ai/new" target="_blank" rel="noopener noreferrer">
                claude.ai
              </a>{" "}
              and start a new chat.
            </li>
            <li>Paste the card (Ctrl/Cmd+V) and send it. Claude activates it.</li>
            <li>
              A TEST card ends with a RESULT CODE (SV1-…): open the result link Claude shows, or paste the code on the{" "}
              <Link href="/progress">Progress</Link> page.
            </li>
          </ol>
          <button type="button" onClick={() => setOpen(false)}>
            Close
          </button>
        </div>
      )}
    </div>
  );
}
