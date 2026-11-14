"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAigo } from "@/lib/client/useAigo";
import type { ApplyResult } from "@/lib/progress";
import { ResultView } from "./ResultView";
import styles from "./Result.module.css";

function safeDecode(raw: string): string {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

/** Applies the result code from /result/<code> exactly once, then drops it from the address bar. */
export function ResultFromUrl() {
  const params = useParams<{ code: string }>();
  const { actions } = useAigo();
  const applied = useRef(false);
  const [result, setResult] = useState<ApplyResult | null>(null);

  const raw = params.code;
  useEffect(() => {
    if (applied.current) return;
    applied.current = true;
    const code = typeof raw === "string" ? safeDecode(raw) : "";
    setResult(actions.applyResultCode(code));
    window.history.replaceState(null, "", "/progress");
  }, [actions, raw]);

  return (
    <div className={styles.page}>
      <Link href="/progress" className={styles.back}>
        ◂ BACK TO PROGRESS
      </Link>
      <h1 className="visuallyHidden">Test result</h1>
      {result ? <ResultView result={result} /> : <p>Reading your result…</p>}
    </div>
  );
}
