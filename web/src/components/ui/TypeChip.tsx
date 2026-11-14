/**
 * <TypeChip kind="learn|test|help" text? />
 *  Small chip: shape + label (■ LEARN, ▲ TEST, ● HELP) in the type color. `text` overrides the label.
 */
import { KIND_META, type CardKind } from "./tokens";
import styles from "./ui.module.css";

export interface TypeChipProps {
  kind: CardKind;
  text?: string;
  className?: string;
}

export function TypeChip({ kind, text, className }: TypeChipProps) {
  const m = KIND_META[kind];
  return (
    <span className={`${styles.chip} ${className ?? ""}`} style={{ background: m.tint, borderColor: m.color, color: m.dark }}>
      <span aria-hidden="true">{m.shape}</span> {text ?? m.label}
    </span>
  );
}
