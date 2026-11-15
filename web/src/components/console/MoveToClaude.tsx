"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./console.module.css";

const FOCUSABLE = 'a[href], button:not(:disabled), [tabindex]:not([tabindex="-1"])';

/** Opens a modal (portal to body) that explains how to continue the current card in the player's own AI. */
export function MoveToClaude({ text, buttonClassName }: { text: string | null; buttonClassName?: string }) {
  const [open, setOpen] = useState(false);
  const [copy, setCopy] = useState<"copied" | "failed" | null>(null);
  const opener = useRef<HTMLButtonElement>(null);
  const box = useRef<HTMLDivElement>(null);

  function close() {
    setOpen(false);
    setCopy(null);
    opener.current?.focus();
  }

  async function copyItem() {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopy("copied");
    } catch {
      setCopy("failed");
    }
  }

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    box.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Escape") {
      e.stopPropagation();
      close();
      return;
    }
    if (e.key !== "Tab") return;
    const items = Array.from(box.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []);
    if (items.length === 0) return;
    const first = items[0]!;
    const lastEl = items[items.length - 1]!;
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      lastEl.focus();
    } else if (!e.shiftKey && document.activeElement === lastEl) {
      e.preventDefault();
      first.focus();
    }
  }

  return (
    <div>
      <button ref={opener} type="button" className={buttonClassName} onClick={() => setOpen(true)} disabled={!text}>
        Continue in your own AI
      </button>
      {!text && (
        <small>
          {" "}
          Create a card in the <Link href="/collection">collection</Link> first.
        </small>
      )}
      {open &&
        createPortal(
          <div className={styles.modalBackdrop} onMouseDown={(e) => e.target === e.currentTarget && close()}>
            <div ref={box} className={styles.modalBox} role="dialog" aria-modal="true" aria-labelledby="own-ai-title" onKeyDown={onKeyDown}>
              <h2 id="own-ai-title">Continue in your own AI</h2>
              <ol>
                <li>Copy the item.</li>
                <li>Paste it into a new chat in your AI.</li>
                <li>
                  Look for <strong>▶ ITEM ACTIVATED</strong>.
                </li>
              </ol>
              <div className={styles.modalActions}>
                <button type="button" onClick={copyItem}>
                  COPY ITEM
                </button>
                <Link href="/guide">Open the guide</Link>
                <button type="button" className="secondary" onClick={close}>
                  Close
                </button>
              </div>
              <div role="status">
                {copy === "copied" && <p>Copied.</p>}
                {copy === "failed" && <p>Couldn&apos;t copy automatically. Copy it from its card page in the collection.</p>}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
