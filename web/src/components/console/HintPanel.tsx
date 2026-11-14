import type { ReactNode } from "react";
import { PLAIN_CHECKLIST, type ConsoleHint } from "@/lib/console";
import type { ApplyResult } from "@/lib/progress";
import { CopyButton } from "../CopyButton";
import { ResultView } from "../ResultView";
import styles from "./console.module.css";

/** The result code needs no button once it is counted (now or earlier). */
function isCounted(r: ApplyResult | null): boolean {
  return r !== null && (r.ok || r.error === "already_counted");
}

/** Show the plain-words checklist while the player writes a request. */
function showChecklist(hint: ConsoleHint): boolean {
  const s = hint.status;
  if (!s) return false;
  return s.kind === "learn" ? s.step >= 4 && s.step <= 6 : s.task >= 4;
}

/** Helper beside the chat: what to do now, a ready answer, and console actions. */
export function HintPanel({
  hint,
  busy,
  insertLearn,
  insertTest,
  onFill,
  onApplyResult,
  applied,
}: {
  hint: ConsoleHint;
  busy: boolean;
  /** Rendered insert button (or a link to the collection) for the LEARN / TEST item the hint points to. */
  insertLearn: ReactNode;
  insertTest: ReactNode;
  onFill: (answer: string) => void;
  onApplyResult: (code: string) => void;
  /** Result of applying the code shown in the hint, if any. */
  applied: ApplyResult | null;
}) {
  const code = hint.resultCode;
  return (
    <section className={styles.sideCard} data-kind={hint.status?.kind === "test" ? "test" : "learn"} aria-labelledby="hint-title">
      <h2 id="hint-title" className={styles.eyebrow} data-kind="learn" style={{ margin: 0, fontWeight: 400 }}>
        Not sure what to write?
      </h2>
      <p className={styles.hintLead}>{hint.todo}</p>

      {hint.answer && (
        <div>
          <p className={`${styles.answer} ${styles.text}`} id="hint-answer">
            {hint.answer}
          </p>
          <div className={styles.hintButtons}>
            <button type="button" className={styles.useAnswer} onClick={() => hint.answer && onFill(hint.answer)} disabled={busy}>
              Use this answer
            </button>
            <CopyButton text={hint.answer} selectTargetId="hint-answer" />
          </div>
          <p className={styles.hintNote}>Then press Send. Claude checks it for real.</p>
        </div>
      )}

      {showChecklist(hint) && (
        <div className={styles.checklist}>
          <div className={styles.eyebrow}>Your answer passes if it says</div>
          <ul>
            {PLAIN_CHECKLIST.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
      )}

      {hint.action === "insert_learn" && <p className={styles.hintAction}>{insertLearn}</p>}
      {hint.action === "insert_test" && <p className={styles.hintAction}>{insertTest}</p>}

      {hint.action === "apply_result" && code && (
        <div className={styles.hintAction}>
          {!isCounted(applied) && (
            <button type="button" onClick={() => onApplyResult(code)}>
              Add my result to my collection
            </button>
          )}
          {applied && <ResultView result={applied} />}
        </div>
      )}
    </section>
  );
}
