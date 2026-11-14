"use client";
/**
 * <DemoPath /> — floating terminal plate "QUICK DEMO · n/5" with the five demo steps.
 * Collapses to a pill (kept in localStorage, validated). Not shown on the landing or the Start form.
 * Steps are derived in lib/demoPath.ts; this component only renders and stores the preferences.
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAigo } from "@/lib/client/useAigo";
import { DEMO_PATH_EVENT, DEMO_PATH_KEY, demoPath, demoPathDone, panelOpen, readDemoPathPrefs, writeDemoPathPrefs, type DemoPathPrefs } from "@/lib/demoPath";
import styles from "./DemoPath.module.css";

export function DemoPath() {
  const pathname = usePathname() ?? "/";
  const { state } = useAigo();
  const [prefs, setPrefs] = useState<DemoPathPrefs | null>(null);

  useEffect(() => {
    // Read after hydration so the server render and first client render agree.
    setPrefs(readDemoPathPrefs());
    const sync = () => setPrefs(readDemoPathPrefs());
    window.addEventListener(DEMO_PATH_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(DEMO_PATH_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const onCollection = pathname === "/collection" || pathname.startsWith("/collection/");
  const open = prefs ? panelOpen(prefs, pathname) : false;
  const toggle = useCallback(() => {
    const old = readDemoPathPrefs();
    writeDemoPathPrefs({ ...old, collapsed: open });
  }, [open]);

  // Leaving /collection ends the first-visit auto-open.
  const wasOnCollection = useRef(false);
  useEffect(() => {
    if (wasOnCollection.current && !onCollection) {
      const old = readDemoPathPrefs();
      if (!old.introduced) writeDemoPathPrefs({ ...old, introduced: true });
    }
    wasOnCollection.current = onCollection;
    if (!onCollection) return;
    // A full page load away from /collection (no client navigation) ends it too.
    const end = () => {
      const old = readDemoPathPrefs();
      if (!old.introduced) window.localStorage.setItem(DEMO_PATH_KEY, JSON.stringify({ ...old, introduced: true }));
    };
    window.addEventListener("pagehide", end);
    return () => window.removeEventListener("pagehide", end);
  }, [onCollection]);

  if (!state || !prefs || pathname === "/" || pathname === "/start") return null;

  const seen = { result: prefs.resultSeen };
  const steps = demoPath(state, seen);
  const n = demoPathDone(state, seen);

  return (
    <aside className={styles.dock} data-route={pathname.startsWith("/console") ? "console" : "page"} data-open={open} aria-label="Quick demo">
      <button type="button" className={styles.head} aria-expanded={open} aria-controls="demo-path-list" onClick={toggle}>
        <span className={styles.title}>QUICK DEMO · {n}/5</span>
        <span className={styles.chev} aria-hidden="true">{open ? "–" : "+"}</span>
      </button>
      {open && (
        <ol id="demo-path-list" className={styles.list}>
          {steps.map((s, i) => (
            <li key={s.id} className={styles.step} data-done={s.done}>
              <span className={styles.mark} aria-hidden="true">{s.done ? "✓" : String(i + 1)}</span>
              <Link href={s.href}>
                {s.label}
                {s.done && <span className={styles.visuallyHidden}> (done)</span>}
              </Link>
            </li>
          ))}
        </ol>
      )}
    </aside>
  );
}
