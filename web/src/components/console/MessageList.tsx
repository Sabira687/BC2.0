import type { KeyboardEvent, ReactNode } from "react";
import { ItemArt } from "@/components/ui/ItemArt";
import type { ChatMessage } from "@/lib/chat";
import { displayText } from "@/lib/console";
import { DATA_OPEN } from "@/lib/encode";
import { activeCard, pastedCard } from "@/lib/markers";
import { classifyReply, parseChoices, yourTurnFrame } from "@/lib/terminal";
import type { ItemKind } from "@/lib/types";
import styles from "./console.module.css";

const SHAPE = { learn: "■", test: "▲", help: "●" } as const;
const WORD = { learn: "LEARN", test: "TEST", help: "HELP" } as const;

function UserRow({ message, name }: { message: ChatMessage; name: string }) {
  const card = message.content.includes(DATA_OPEN) ? pastedCard(message.content) : null;
  return (
    <div className={styles.row} data-who="user">
      <span className={styles.who}>{name} ›</span>
      <div className={styles.rowBody}>
        {card ? (
          <details className={styles.pasted}>
            <summary>
              <span className={styles.itemChip} data-kind={card.kind}>
                <span className={styles.itemArt}>
                  <ItemArt kind={card.kind} />
                </span>
                <span>
                  <span className={styles.itemMark}>
                    {SHAPE[card.kind]} {WORD[card.kind]}
                  </span>
                  <span className={styles.itemName} style={{ display: "block" }}>
                    {card.title}
                  </span>
                  <span className={styles.itemNote}>
                    item pasted · hidden instructions inside · <u>view</u>
                  </span>
                </span>
              </span>
            </summary>
            <p className={styles.text}>{message.content}</p>
          </details>
        ) : message.content.includes(DATA_OPEN) ? (
          <details className={styles.pasted}>
            <summary className={styles.itemNote}>
              card pasted · hidden instructions inside · <u>view</u>
            </summary>
            <p className={styles.text}>{message.content}</p>
          </details>
        ) : (
          <p className={styles.text}>{message.content}</p>
        )}
      </div>
    </div>
  );
}

/** Claude's text as a terminal block: frames, marks, stars and marker lines coloured by lib/terminal. */
function ClaudeText({ text, kind, interactive, disabled, onChoose, onUseTemplate }: { text: string; kind: ItemKind | null; interactive?: boolean; disabled?: boolean; onChoose?: (key: string) => void; onUseTemplate?: (template: string) => void }) {
  const shown = displayText(text);
  const lines = classifyReply(shown);
  const frame = interactive && onUseTemplate ? yourTurnFrame(shown) : null;
  const choices = interactive && onChoose ? parseChoices(shown) : [];
  return (
    <div className={styles.reply} data-kind={kind ?? undefined}>
      {lines.map((l, i) => {
        const inFrame = frame !== null && i >= frame.from && i <= frame.to && l.spans[0]?.tone === "frame";
        return (
          <div
            key={i}
            className={inFrame ? `${styles.tl} ${styles.tplLine}` : styles.tl}
            data-marker={l.marker}
            {...(inFrame
              ? {
                  role: "button",
                  tabIndex: 0,
                  title: "Click to put this template in your answer box",
                  onClick: () => onUseTemplate!(frame.template),
                  onKeyDown: (e: KeyboardEvent<HTMLDivElement>) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onUseTemplate!(frame.template);
                    }
                  },
                }
              : {})}
          >
            {l.spans.length === 0 ? "\u00a0" : l.spans.map((s, j) => (s.tone === "plain" ? <span key={j}>{s.text}</span> : <span key={j} className={styles[`t_${s.tone}`]}>{s.text}</span>))}
          </div>
        );
      })}
      {choices.length > 0 && (
        <div className={styles.choices} role="group" aria-label="Quick replies">
          {choices.map((c) => (
            <button key={c.key} type="button" className={styles.choiceChip} disabled={disabled} onClick={() => onChoose!(c.key)}>
              <b>{c.key}</b> {c.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ClaudeRow({ children, sample }: { children: ReactNode; sample?: boolean }) {
  return (
    <div className={styles.row} data-who="claude">
      <span className={styles.who}>claude ›</span>
      <div className={styles.rowBody}>
        {children}
        {sample && <span className={styles.sampleNote}>sample reply</span>}
      </div>
    </div>
  );
}

/**
 * The chat as a feed: your messages right, Claude's left with an avatar. A fixed-height area that scrolls inside
 * and sticks to the bottom (flex column-reverse with an inner flex:none block).
 */
export function MessageList({
  messages,
  streaming,
  emptyTitle,
  emptyText,
  sampleCount = 0,
  name = "you",
  onChoose,
  onUseTemplate,
}: {
  messages: readonly ChatMessage[];
  streaming: string | null;
  emptyTitle: string;
  emptyText: string;
  /** The first n messages are the pre-written sample chat. */
  sampleCount?: number;
  /** Prompt name for the player's rows (lowercase). */
  name?: string;
  /** Clicking a [1]/[2] chip sends that key as the next message. */
  onChoose?: (key: string) => void;
  /** Clicking the YOUR TURN frame passes its template to the input. */
  onUseTemplate?: (template: string) => void;
}) {
  return (
    <div className={styles.feed}>
      <div className={styles.feedInner}>
        <div className={styles.log} role="log" aria-label="Conversation" aria-live="polite">
        {sampleCount > 0 && <span className={styles.sampleTag}>SAMPLE CHAT · DEMO DATA</span>}
        {messages.length === 0 && streaming === null && (
          <div className={styles.empty}>
            <div className={styles.emptyTitle}>{emptyTitle}</div>
            <p>{emptyText}</p>
          </div>
        )}
        {messages.map((m, i) =>
          m.role === "user" ? (
            <UserRow key={i} message={m} name={name} />
          ) : (
            <ClaudeRow key={i} sample={i < sampleCount}>
              <ClaudeText text={m.content} kind={activeCard(messages.slice(0, i + 1))?.kind ?? null} interactive={i === messages.length - 1 && streaming === null} disabled={streaming !== null} onChoose={onChoose} onUseTemplate={onUseTemplate} />
            </ClaudeRow>
          ),
        )}
        </div>
        {/* Outside the live region: chunks are not announced piecemeal; the finished reply joins the log. */}
        {streaming !== null && (
          <ClaudeRow>{streaming === "" ? <span className={styles.pending}>Claude is writing…</span> : <ClaudeText text={streaming} kind={activeCard(messages)?.kind ?? null} />}</ClaudeRow>
        )}
      </div>
    </div>
  );
}
