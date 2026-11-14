"use client";
import { useState, type FormEvent } from "react";
import type { ApplyResult } from "@/lib/progress";
import { ResultView } from "./ResultView";

/** Paste a TEST result code (SV1-…) and add it to progress. */
export function ResultCodeForm({ applyResultCode }: { applyResultCode: (code: string) => ApplyResult }) {
  const [code, setCode] = useState("");
  const [result, setResult] = useState<ApplyResult | null>(null);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const r = applyResultCode(code);
    setResult(r);
    if (r.ok) setCode("");
  }

  return (
    <form onSubmit={onSubmit}>
      <label>
        Result code{" "}
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="SV1-…"
          autoComplete="off"
          spellCheck={false}
        />
      </label>{" "}
      <button type="submit">Add result</button>
      {result && <ResultView result={result} />}
    </form>
  );
}
