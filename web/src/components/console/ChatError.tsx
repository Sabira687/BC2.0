import Link from "next/link";
import { COACH_RESTING_MESSAGE } from "@/lib/chatMessages";
import styles from "./console.module.css";

/** Error line under the chat; the "coach is resting" case gets a plaque pointing to the guide. */
export function ChatError({ error, canRetry, onRetry }: { error: string; canRetry: boolean; onRetry: () => void }) {
  const resting = error === COACH_RESTING_MESSAGE;
  return (
    <p role="alert" className={resting ? `${styles.errorLine} ${styles.restingPlaque}` : styles.errorLine}>
      {error}{" "}
      {resting && (
        <Link href="/guide">How to continue in your own Claude</Link>
      )}{" "}
      {canRetry && !resting && (
        <button type="button" onClick={onRetry}>
          Retry
        </button>
      )}
    </p>
  );
}
