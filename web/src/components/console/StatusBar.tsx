import type { ChatMessage } from "@/lib/chat";
import { friendlyProgress, lastStatus } from "@/lib/console";
import styles from "./console.module.css";

/**
 * Friendly progress from Claude's last status line, e.g.
 * "Lesson 1.1 · step 4 of 7 — Your turn" with a bar. The raw status line itself stays hidden.
 */
export function StatusBar({ messages }: { messages: readonly ChatMessage[] }) {
  const status = lastStatus(messages);
  if (!status) return null;
  const p = friendlyProgress(status);
  return (
    <div className={styles.progress} role="status">
      <span>
        {p.label}
        {p.detail ? ` — ${p.detail}` : ""}
      </span>
      <span className={styles.progressBar} role="progressbar" aria-label="Progress" aria-valuemin={0} aria-valuemax={p.max} aria-valuenow={p.value}>
        <span className={styles.progressFill} style={{ width: `${p.max > 0 ? Math.round((p.value / p.max) * 100) : 0}%` }} />
      </span>
    </div>
  );
}
