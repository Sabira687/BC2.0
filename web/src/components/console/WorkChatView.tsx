"use client";
import { useRef, useState } from "react";
import { useAigo } from "@/lib/client/useAigo";
import { WORKCHAT_KEY } from "@/lib/conversation";
import { API_KEY_NOTE, lastStatus } from "@/lib/console";
import { captureNotices, gainFor } from "@/lib/notices";
import type { Captured } from "@/lib/capture";
import { activeCard, cardView, helpUsedSeen } from "@/lib/markers";
import { START_BY_LEVEL } from "@/lib/program";
import { promptName } from "@/lib/terminal";
import { setBadgeSteps } from "@/lib/progress";
import { REPLAY_HELP_HISTORY } from "@/lib/content/replays";
import { SAMPLE_WORK_CHAT, helpUsedIn, startsWithSample, workChatHint } from "@/lib/workchat";
import { ActiveCardPanel } from "./ActiveCardPanel";
import { ChatError } from "./ChatError";
import { ReplayNotice, ReplayPlaque } from "./ReplayPlaque";
import { Composer } from "./Composer";
import { MessageList } from "./MessageList";
import { useConsoleChat } from "./useConsoleChat";
import styles from "./console.module.css";

/** Work chat: a normal chat with Claude for real work, where Help can be tried. */
export function WorkChatView() {
  const { state, actions, helpText } = useAigo();
  // What the last reply newly gave the player, keyed to the conversation length it was captured at.
  const [gainEntry, setGainEntry] = useState<{ gain: Captured; at: number } | null>(null);
  const chat = useConsoleChat(WORKCHAT_KEY, (msgs) => {
    const reply = msgs[msgs.length - 1];
    if (reply?.role === "assistant") setGainEntry({ gain: actions.captureReply(reply.content, lastStatus(msgs)), at: msgs.length });
  });
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  if (!state || chat.messages === null) return <p>Loading…</p>;
  const messages = chat.messages;
  const hint = workChatHint(messages, chat.busy);
  const gain = chat.busy ? null : gainFor(gainEntry, messages.length);
  const notices = gain ? captureNotices(gain) : [];
  const sample = startsWithSample(messages);
  const recordedHistory = chat.replay && REPLAY_HELP_HISTORY.every((m, i) => messages[i]?.role === m.role && messages[i]?.content === m.content);
  const helpUsed = helpUsedIn(messages);
  const helpSeen = helpUsedSeen(messages) && !chat.replay;
  const active = activeCard(messages);
  const last = messages[messages.length - 1];
  const canRetry = !chat.busy && last?.role === "user";
  const start = START_BY_LEVEL[state.profile.level];
  const name = promptName(state.profile.name);
  const badge = setBadgeSteps(state, start);
  const helpCard = cardView(state, "help");

  function onSend() {
    if (chat.send(input)) {
      setInput("");
      setGainEntry(null);
    }
  }

  function loadSample() {
    if (messages.length > 0 && !window.confirm("Replace this chat with the sample work chat?")) return;
    setGainEntry(null);
    chat.seed([...(chat.replay ? REPLAY_HELP_HISTORY : SAMPLE_WORK_CHAT)]);
  }

  function onUseHelp() {
    if (!helpText || helpUsed || messages.length === 0) return;
    setGainEntry(null);
    // In replay nothing counts: no Help use is recorded.
    if (chat.send(helpText) && !chat.replay) actions.helpUsed();
  }

  function onStartOver() {
    if (window.confirm("Start over? This clears the work chat on this page.")) {
      chat.reset();
      setGainEntry(null);
    }
  }

  const loadSampleButton = (
    <button type="button" className="secondary" onClick={loadSample} disabled={chat.busy}>
      Load sample chat
    </button>
  );
  const useHelpButton = (
    <button type="button" className={styles.helpButton} onClick={onUseHelp} disabled={chat.busy || helpUsed || messages.length === 0}>
      ● Use Help card
    </button>
  );

  return (
    <>
      <section className={styles.panel} aria-label="Work chat">
        <div className={styles.panelHead}>
          <span className={styles.dots} aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <h1 className={styles.srOnly}>Work chat with Claude</h1>
          <p className={styles.panelNote}>A normal chat with Claude, like at work. When it isn&apos;t going well, use your Help card.</p>
          <p className={`${styles.panelNote} ${styles.headRight}`} role="status">
            {chat.busy ? "Claude is writing…" : chat.error ? "Claude couldn't answer. Try again below." : "Claude is ready"}
          </p>
        </div>
        <p className={styles.keyNote}>{API_KEY_NOTE}</p>
        <div className={styles.toolbar}>
          {loadSampleButton}
          <button type="button" className="secondary" onClick={onStartOver} disabled={messages.length === 0 && !chat.busy}>
            Start over
          </button>
        </div>
        {chat.replay && <ReplayPlaque onTryLive={chat.leaveReplay} />}
        {chat.notice && <ReplayNotice text={chat.notice} />}
        <MessageList
          name={name}
          messages={messages}
          streaming={chat.streaming}
          emptyTitle="Your work chat is empty"
          emptyText="Type a real task below, or load a sample chat to see the Help card in action."
          sampleCount={sample ? SAMPLE_WORK_CHAT.length : recordedHistory ? REPLAY_HELP_HISTORY.length : 0}
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
          kind={active?.kind === "help" ? "help" : null}
          glowKey="help"
          label="Your message"
          placeholder="Ask Claude anything about your work"
          extra={useHelpButton}
        />
      </section>

      <aside className={styles.side} aria-label="Help card and hints">
        {notices.length > 0 && (
          <ul className={styles.srOnly} aria-label="Progress captured" role="status">
            {notices.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        )}
        <ActiveCardPanel view={helpCard} label="Help card">
          <p className={styles.hintNote}>Works once, on what already happened in the chat. Using it counts toward your Set {start.slice(1).padStart(2, "0")} badge.</p>
        </ActiveCardPanel>

        <section className={styles.sideCard} data-kind="help" aria-labelledby="work-hint-title">
          <h2 id="work-hint-title" className={styles.eyebrow} style={{ margin: 0, fontWeight: 400 }}>
            {helpUsed ? "Not sure what to do?" : "Try Help in two steps"}
          </h2>
          {helpUsed || chat.busy ? (
            <p className={styles.hintLead}>{hint.todo}</p>
          ) : (
            <ol className={styles.steps}>
              <li data-done={messages.length > 0}>Load a sample work chat</li>
              <li data-done={false}>
                Press <strong>Use Help card</strong>
              </li>
            </ol>
          )}
          {!helpUsed && (
            <div className={styles.hintButtons}>
              {loadSampleButton}
              {useHelpButton}
            </div>
          )}
          {hint.note && <p className={styles.hintNote}>{hint.note}</p>}
        </section>

        {helpSeen && (
          <section className={styles.counted} aria-label="Counted automatically">
            <div className={styles.eyebrow}>Counted automatically</div>
            <div className={styles.countedMain}>
              ✓ Help used · Set {start.slice(1).padStart(2, "0")} badge: {badge.done} of {badge.total} steps
            </div>
            <div className={styles.countedNote}>The site saw the HELP USED line. No code to copy.</div>
          </section>
        )}
      </aside>
    </>
  );
}
