/**
 * <EventLine kind="activated|pass|stamp|help|test" text />
 *  White plaque, colored left bar, mono 13px; mirrors the chat line the AI prints
 *  (e.g. "▶ ITEM ACTIVATED · LEARN · The Clear Ask"). `text` is the full line; a glyph is added unless `glyph={false}`.
 */
import { EVENT_COLOR, type EventKind } from "./tokens";
import styles from "./ui.module.css";

export interface EventLineProps {
  kind: EventKind;
  text: string;
  glyph?: boolean;
  className?: string;
}

export function EventLine({ kind, text, glyph = true, className }: EventLineProps) {
  const m = EVENT_COLOR[kind];
  return (
    <div className={`${styles.event} ${className ?? ""}`} style={{ borderLeftColor: m.bar }}>
      {glyph ? <span aria-hidden="true">{m.glyph} </span> : null}
      {text}
    </div>
  );
}
