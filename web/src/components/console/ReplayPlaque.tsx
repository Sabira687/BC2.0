import Link from "next/link";
import { REPLAY_PLAQUE_LINK, REPLAY_PLAQUE_TEXT } from "@/lib/replay";
import styles from "./console.module.css";

/** Honest label above the chat while recorded replies are played back instead of the live coach. */
export function ReplayPlaque({ onTryLive }: { onTryLive: () => void }) {
  return (
    <div className={styles.replayPlaque} role="status" data-testid="replay-plaque">
      <p>
        {REPLAY_PLAQUE_TEXT} <Link href="/guide">▸ {REPLAY_PLAQUE_LINK}</Link>
      </p>
      <button type="button" className="secondary" onClick={onTryLive}>
        Try live again
      </button>
    </div>
  );
}

/** One line after a replayed conversation was dropped. */
export function ReplayNotice({ text }: { text: string }) {
  return (
    <p className={styles.replayNotice} role="status">
      {text}
    </p>
  );
}
