import type { KeyboardEvent, ReactNode, Ref } from "react";
import type { ItemKind } from "@/lib/types";
import styles from "./console.module.css";

/**
 * Message box: Enter sends, Shift+Enter adds a new line. When a card is active the border takes its color
 * (LEARN blue, TEST violet, HELP green) with a soft glow that plays once on activation (`glowKey` changes).
 */
export function Composer({
  value,
  onChange,
  onSend,
  onStop,
  busy,
  textareaRef,
  kind = null,
  chip = null,
  glowKey,
  label = "Your answer",
  placeholder = "Write your answer here. Press Enter to send (Shift+Enter for a new line).",
  extra,
  name = "you",
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  onStop: () => void;
  busy: boolean;
  textareaRef: Ref<HTMLTextAreaElement>;
  /** Kind of the active card (border color), or null. */
  kind?: ItemKind | null;
  /** "■ LEARN · The Clear Ask is active", or null. */
  chip?: string | null;
  /** Changes when a new card is activated: replays the one-time glow. */
  glowKey?: string;
  label?: string;
  placeholder?: string;
  /** Extra button next to Send (e.g. Use Help card). */
  extra?: ReactNode;
  /** Prompt name ("john"). */
  name?: string;
}) {
  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      if (!busy) onSend();
    }
  }

  return (
    <div className={styles.composer} data-kind={kind ?? undefined}>
      {chip && (
        <p className={styles.activeChip} role="status">
          {chip}
        </p>
      )}
      <div className={styles.composerRow}>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>{label}</span>
          <span className={styles.textareaWrap}>
            <span className={styles.prompt} aria-hidden="true">
              {name} ›
            </span>
            <textarea
              id="console-input"
              ref={textareaRef}
              rows={3}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={placeholder}
              spellCheck
            />
            {kind && <span key={glowKey} className={styles.glowRing} aria-hidden="true" />}
          </span>
        </label>
        <div className={styles.composerButtons}>
          {extra}
          {busy ? (
            <button type="button" onClick={onStop}>
              STOP
            </button>
          ) : (
            <button type="button" onClick={onSend} disabled={value.trim() === ""}>
              SEND ↵
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
