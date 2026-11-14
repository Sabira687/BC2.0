import type { ReactNode } from "react";
import { ItemArt } from "@/components/ui/ItemArt";
import type { ChatMessage } from "@/lib/chat";
import { displayText } from "@/lib/console";
import { DATA_OPEN } from "@/lib/encode";
import { activeCard, pastedCard } from "@/lib/markers";
import { classifyReply } from "@/lib/terminal";
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
function ClaudeText({ text, kind }: { text: string; kind: ItemKind | null }) {
  const lines = classifyReply(displayText(text));
  return (
    <div className={styles.reply} data-kind={kind ?? undefined}>
      {lines.map((l, i) => (
        <div key={i} className={styles.tl} data-marker={l.marker}>
          {l.spans.length === 0 ? "\u00a0" : l.spans.map((s, j) => (s.tone === "plain" ? <span key={j}>{s.text}</span> : <span key={j} className={styles[`t_${s.tone}`]}>{s.text}</span>))}
        </div>
      ))}
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
}: {
  messages: readonly ChatMessage[];
  streaming: string | null;
  emptyTitle: string;
  emptyText: string;
  /** The first n messages are the pre-written sample chat. */
  sampleCount?: number;
  /** Prompt name for the player's rows (lowercase). */
  name?: string;
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
              <ClaudeText text={m.content} kind={activeCard(messages.slice(0, i + 1))?.kind ?? null} />
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
