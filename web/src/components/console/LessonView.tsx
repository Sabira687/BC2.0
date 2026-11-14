"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import { useAigo } from "@/lib/client/useAigo";
import { hintFor, itemKindOf, lastStatus } from "@/lib/console";
import { captureNotices, gainFor } from "@/lib/notices";
import type { Captured } from "@/lib/capture";
import { activeCardView } from "@/lib/markers";
import { START_BY_LEVEL } from "@/lib/program";
import { promptName } from "@/lib/terminal";
import { itemId, kindOf, type ApplyResult } from "@/lib/progress";
import type { ItemId } from "@/lib/types";
import { ActiveCardPanel } from "./ActiveCardPanel";
import { ChatError } from "./ChatError";
import { ReplayNotice, ReplayPlaque } from "./ReplayPlaque";
import { Composer } from "./Composer";
import { HintPanel } from "./HintPanel";
import { InsertItemButton } from "./InsertItemButton";
import { MessageList } from "./MessageList";
import { MoveToClaude } from "./MoveToClaude";
import { StatusBar } from "./StatusBar";
import { useConsoleChat } from "./useConsoleChat";
import styles from "./console.module.css";

/** Lesson tab: chat feed + composer on the left; the active card, its stars and the hint on the right. */
export function LessonView() {
  const { state, actions, itemText } = useAigo();
  // What the last reply newly gave the player, keyed to the conversation length it was captured at
  // (component state only, so a reload shows no reward notices; it vanishes when the conversation changes).
  const [gainEntry, setGainEntry] = useState<{ gain: Captured; at: number } | null>(null);
  const chat = useConsoleChat(undefined, (msgs) => {
    const reply = msgs[msgs.length - 1];
    if (reply?.role === "assistant") setGainEntry({ gain: actions.captureReply(reply.content, lastStatus(msgs)), at: msgs.length });
  });
  const [input, setInput] = useState("");
  const [applied, setApplied] = useState<{ code: string; result: ApplyResult } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  if (!state || chat.messages === null) return <p>Loading…</p>;
  const messages = chat.messages;

  const gain = chat.busy ? null : gainFor(gainEntry, messages.length);
  const hint = hintFor(state, messages, chat.busy);
  const notices = gain ? captureNotices(gain) : [];
  const view = activeCardView(state, messages);
  const last = messages[messages.length - 1];
  const canRetry = !chat.busy && last?.role === "user";
  const start = START_BY_LEVEL[state.profile.level];
  const name = promptName(state.profile.name);

  let lastInserted: string | null = null;
  for (let i = messages.length - 1; i >= 0 && lastInserted === null; i--) {
    const m = messages[i];
    if (m && m.role === "user" && itemKindOf(m.content) !== null) lastInserted = m.content;
  }
  const insertable = state.created.filter((id) => itemText(id) !== null);
  const anyLearn = insertable.find((id) => kindOf(id) === "learn");
  const learnText = itemText(itemId("learn", start)) ?? (anyLearn ? itemText(anyLearn) : null);

  const insert = (text: string) => {
    setGainEntry(null);
    return chat.send(text);
  };
  const insertButton = (id: ItemId) => <InsertItemButton key={id} id={id} text={itemText(id)} busy={chat.busy} onInsert={insert} />;
  const testModule = hint.status?.module ?? start;

  function onSend() {
    if (chat.send(input)) {
      setInput("");
      setGainEntry(null);
    }
  }

  function onNewConversation() {
    if (window.confirm("Start over? This clears the conversation on this page.")) {
      chat.reset();
      setApplied(null);
      setGainEntry(null);
    }
  }

  function onFill(answer: string) {
    setInput(answer);
    textareaRef.current?.focus();
  }

  function onApplyResult(code: string) {
    setApplied({ code, result: actions.applyResultCode(code) });
  }

  const loaded = messages.some((m) => m.role === "user" && (itemKindOf(m.content) === "learn" || itemKindOf(m.content) === "test"));
  const learnId = itemId("learn", start);
  const claudeState = chat.busy ? "Claude is writing…" : chat.error ? "Claude couldn't answer. Try again below." : "Claude is ready";

  return (
    <>
      <section className={styles.panel} aria-label="Lesson chat">
        <div className={styles.panelHead}>
          <span className={styles.dots} aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <h1 className={styles.panelTitle}>Your lesson with Claude</h1>
          <StatusBar messages={messages} />
          <p className={styles.panelNote} role="status">
            {claudeState}
          </p>
          <div className={styles.headRight}>
            <MoveToClaude text={lastInserted ?? learnText} buttonClassName={styles.linkButton} />
          </div>
        </div>
        <div className={styles.toolbar}>
          {!loaded && itemText(learnId) !== null && (
            <button type="button" disabled={chat.busy} onClick={() => insert(itemText(learnId)!)}>
              Load my Learn card
            </button>
          )}
          {insertable.filter((id) => id !== learnId).map(insertButton)}
          {insertable.length === 0 && (
            <span>
              No cards yet: get them in your <Link href="/collection">collection</Link>.
            </span>
          )}
          <button type="button" className="secondary" onClick={onNewConversation}>
            Start over
          </button>
        </div>
        {chat.replay && <ReplayPlaque onTryLive={chat.leaveReplay} />}
        {chat.notice && <ReplayNotice text={chat.notice} />}
        <MessageList
          name={name}
          messages={messages}
          streaming={chat.streaming}
          emptyTitle="Your lesson starts here"
          emptyText="Load your Learn card to start. Claude will greet you here."
        />
        {chat.error && <ChatError error={chat.error} canRetry={canRetry} onRetry={chat.retry} />}
        <Composer
          name={name}
          value={input}
          onChange={setInput}
          onSend={onSend}
          onStop={chat.stop}
          busy={chat.busy}
          textareaRef={textareaRef}
          kind={view.active ? view.kind : null}
          chip={view.chip}
          glowKey={`${view.kind}:${view.module}`}
          placeholder="Type your answer, or use the hint on the right"
        />
      </section>

      <aside className={styles.side} aria-label="Your card and hints">
        {notices.length > 0 && (
          <ul className={styles.srOnly} aria-label="Progress captured" role="status">
            {notices.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        )}
        <ActiveCardPanel view={view} newStamps={gain?.stamps ?? []} label={view.active ? "Active card" : "Your card"} />
        <HintPanel
          hint={hint}
          busy={chat.busy}
          insertLearn={insertButton(itemId("learn", start))}
          insertTest={insertButton(itemId("test", testModule))}
          onFill={onFill}
          onApplyResult={onApplyResult}
          applied={applied && applied.code === hint.resultCode ? applied.result : null}
        />
      </aside>
    </>
  );
}
