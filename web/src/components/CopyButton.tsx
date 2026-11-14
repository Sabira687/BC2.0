"use client";
import { useEffect, useRef, useState } from "react";

/** Copies `text`; if the clipboard API fails, selects the element `selectTargetId` so the user can copy by hand. */
export function CopyButton({ text, selectTargetId, label = "Copy", className }: { text: string; selectTargetId?: string; label?: string; className?: string }) {
  const [status, setStatus] = useState<"idle" | "copied" | "manual">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  async function copy() {
    if (timer.current) clearTimeout(timer.current);
    try {
      await navigator.clipboard.writeText(text);
      setStatus("copied");
      timer.current = setTimeout(() => setStatus("idle"), 2000);
    } catch {
      const el = selectTargetId ? document.getElementById(selectTargetId) : null;
      // The text may sit inside a closed <details>: open it first, or the selection would be invisible.
      const details = el?.closest("details");
      if (details) details.open = true;
      const selection = window.getSelection();
      if (el && selection) {
        const range = document.createRange();
        range.selectNodeContents(el);
        selection.removeAllRanges();
        selection.addRange(range);
      }
      setStatus("manual");
    }
  }

  return (
    <>
      <button type="button" className={className} onClick={copy}>
        {label}
      </button>{" "}
      {status === "copied" && <span role="status">Copied</span>}
      {status === "manual" && <span role="status">Couldn&apos;t copy automatically — the text is selected, press Ctrl/Cmd+C.</span>}
    </>
  );
}
