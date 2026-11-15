import type { ReactNode } from "react";
import styles from "./PageFooter.module.css";

/** Shared page footer: dark night strip, mono meta line, optional note, and tidy links/buttons (44px tap targets). */
export function PageFooter({ meta, note, children }: { meta: string; note?: string; children?: ReactNode }) {
  return (
    <footer className={styles.footer}>
      <div className={styles.meta}>{meta}</div>
      {note && <p className={styles.note}>{note}</p>}
      {children && <nav className={styles.actions} aria-label="Page links">{children}</nav>}
    </footer>
  );
}
