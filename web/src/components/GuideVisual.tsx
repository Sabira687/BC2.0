import type { GuideVisual as Kind } from "@/lib/content";
import styles from "./Guide.module.css";

function Term({ children }: { children: React.ReactNode }) {
  return <div className={styles.term}>{children}</div>;
}

/** Mini illustrations for the Guide steps. Static, decorative text; marker lines match the real ones. */
export function GuideVisual({ kind }: { kind: Kind }) {
  switch (kind) {
    case "claude":
      return (
        <div className={styles.claudeBox} role="img" aria-label="A new Claude chat">
          <div className={styles.mono}>claude.ai · new chat</div>
          <div className={styles.input}>How can I help you today?<span className={styles.caret} /></div>
        </div>
      );
    case "item":
      return (
        <div className={styles.chip} role="img" aria-label="Learn item: Three-Tooth Key">
          <span className={styles.chipArt} aria-hidden="true">🗝</span>
          <span className={styles.chipText}>■ LEARN<br /><b>Three-Tooth Key</b></span>
        </div>
      );
    case "paste":
      return (
        <Term>
          <span className={styles.you}>you › </span>■ AIGO ITEM · LEARN · Three-Tooth Key ⟦item-data v1⟧ …<br />
          <span className={styles.cl}>claude › </span><span className={styles.cyan}>▶ ITEM ACTIVATED · LEARN · Three-Tooth Key</span>
        </Term>
      );
    case "learn":
      return (
        <Term>
          <span className={styles.green}>✅ CHECK PASSED · </span><span className={styles.gold}>★★☆</span><br />
          <span className={styles.lime}>✦ STAMP EARNED · Explicit format</span>
        </Term>
      );
    case "code":
      return (
        <Term>
          <span className={styles.dim}>RESULT CODE  </span><span className={styles.cyan}>SV1-J7Q2-K9MX-4TRA-PL3W</span>
        </Term>
      );
    case "help":
      return (
        <Term>
          <span className={styles.cl}>claude › </span><span className={styles.green}>▶ ITEM ACTIVATED · HELP · Pocket Compass</span>
        </Term>
      );
  }
}
