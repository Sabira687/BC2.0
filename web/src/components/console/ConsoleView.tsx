"use client";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { consoleTabFromParam } from "@/lib/demoPath";
import { LessonView } from "./LessonView";
import { WorkChatView } from "./WorkChatView";
import styles from "./console.module.css";

type Tab = "lesson" | "work";
const TABS: { id: Tab; label: string }[] = [
  { id: "lesson", label: "LESSON" },
  { id: "work", label: "WORK CHAT" },
];

/** The page with Claude: LESSON (items) and WORK CHAT (plain chat + Help). The tablist sits above its tabpanel. */
export function ConsoleView() {
  const param = useSearchParams().get("tab");
  const [tab, setTab] = useState<Tab>(() => consoleTabFromParam(param));
  // /console?tab=work (e.g. from the demo list) opens the Work chat, also when already on /console.
  useEffect(() => {
    if (param !== null) setTab(consoleTabFromParam(param));
  }, [param]);
  const refs = useRef<Partial<Record<Tab, HTMLButtonElement | null>>>({});

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const i = TABS.findIndex((t) => t.id === tab);
    let next = -1;
    if (e.key === "ArrowRight") next = (i + 1) % TABS.length;
    else if (e.key === "ArrowLeft") next = (i - 1 + TABS.length) % TABS.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = TABS.length - 1;
    if (next < 0) return;
    e.preventDefault();
    const id = TABS[next]!.id;
    setTab(id);
    refs.current[id]?.focus();
  }

  return (
    <>
      <div role="tablist" aria-label="Lesson or work chat" className={styles.tabs} onKeyDown={onKeyDown}>
        {TABS.map((t) => (
          <button
            key={t.id}
            ref={(el) => {
              refs.current[t.id] = el;
            }}
            type="button"
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls={`panel-${t.id}`}
            tabIndex={tab === t.id ? 0 : -1}
            className={tab === t.id ? styles.tabActive : styles.tab}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className={styles.shell} role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
        {tab === "lesson" ? <LessonView /> : <WorkChatView />}
      </div>
    </>
  );
}
