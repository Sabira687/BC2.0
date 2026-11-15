"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ACHIEVEMENTS, setBadge, setBadgeSteps, type ApplyResult } from "@/lib/progress";
import { RESULT_ERROR_MESSAGES } from "@/lib/resultcode";
import { resultLine } from "@/lib/generator";
import { getModule, itemFor } from "@/lib/content";
import { difficultyOf } from "@/lib/album";
import { techniqueInfo } from "@/lib/progressview";
import { litStarsAt, nextSkillCta, practiceDetail, readingDelayMs, resultChips, resultSummary, starTimeline, taskChecks, testCompleteFrame } from "@/lib/resultview";
import type { Stars as StarCount } from "@/lib/types";
import { Stamp, Stars } from "@/components/ui";
import { ItemArt } from "@/components/ui/ItemArt";
import { markResultSeen } from "@/lib/demoPath";
import { itemTitle } from "./itemInfo";
import styles from "./Result.module.css";

/** Big stars that light up one by one (350 ms each); reduced motion lights them all at once. */
function StarReveal({ stars }: { stars: StarCount }) {
  const [lit, setLit] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  function play() {
    timers.current.forEach(clearTimeout);
    const reduced = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const timeline = starTimeline(stars, !!reduced);
    setLit(litStarsAt(timeline, 0));
    timers.current = timeline.filter((t) => t > 0).map((t) => setTimeout(() => setLit(litStarsAt(timeline, t)), t));
  }

  useEffect(() => {
    play();
    return () => timers.current.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stars]);

  return (
    <>
      <div className={styles.scoreRow}>
        <span className={styles.star} role="img" aria-label={`${stars} of 3 stars`}>
          <Stars value={lit} size={40} />
        </span>
      </div>
      <button type="button" className={styles.replay} onClick={play}>
        REPLAY STARS
      </button>
    </>
  );
}

/** One line of the printed frame, coloured like the terminal (rules, ✓/✗ marks, score, stars). */
function FrameLine({ line }: { line: string }) {
  if (line.startsWith("━")) return <span className={styles.tRule}>{line + "\n"}</span>;
  if (line.startsWith("─")) return <span className={styles.tDim}>{line + "\n"}</span>;
  if (line.startsWith(" TEST COMPLETE")) return <span className={styles.tTitle}>{line + "\n"}</span>;
  if (line.startsWith(" SCORE")) {
    const i = line.indexOf("★") >= 0 ? line.indexOf("★") : line.indexOf("☆");
    return (
      <span className={styles.tTitle}>
        {line.slice(0, i)}
        <span className={styles.tStar}>{line.slice(i)}</span>
        {"\n"}
      </span>
    );
  }
  const m = /^(.*?)([✓✗])(.*)$/.exec(line);
  if (m) return <span>{m[1]}<span className={m[2] === "✓" ? styles.tOk : styles.tBad}>{m[2]}</span>{m[3] + "\n"}</span>;
  return <span>{line + "\n"}</span>;
}

const prefersReduced = () => typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** "READING CODE_" for about 0.9 s, then the result; reduced motion shows the result at once. */
function useReadingDone(key: unknown): boolean {
  const [doneKey, setDoneKey] = useState<unknown>(() => (readingDelayMs(prefersReduced()) === 0 ? key : undefined));
  useEffect(() => {
    const ms = readingDelayMs(prefersReduced());
    if (ms === 0) return;
    const t = setTimeout(() => setDoneKey(key), ms);
    return () => clearTimeout(t);
  }, [key]);
  return doneKey === key || readingDelayMs(prefersReduced()) === 0;
}

/** Presentational: what a TEST result code did (or why it was not accepted). */
export function ResultView({ result }: { result: ApplyResult }) {
  const read = useReadingDone(result.ok ? result.result.at : null);
  const shown = result.ok;
  useEffect(() => {
    if (shown) markResultSeen();
  }, [shown]);
  if (!result.ok) {
    const fine = result.error === "already_counted";
    return (
      <p role={fine ? "status" : "alert"} className={`${styles.msg} ${fine ? styles.msgFine : ""}`}>
        {RESULT_ERROR_MESSAGES[result.error]}
      </p>
    );
  }

  const { result: r, newStamps, previousBest, isBest, cleared, unlocked, newAchievements, state } = result;
  const module = r.module;
  const number = module.slice(1).padStart(2, "0");
  const title = getModule(module).title;
  const badge = setBadge(state, module);
  const steps = setBadgeSteps(state, module);
  const holo = (state.results[module]?.stars ?? 0) === 3;
  const checks = taskChecks(module, r.tasks);
  const practice = practiceDetail(module, r.tasks);
  const cta = nextSkillCta(module, cleared);
  const chips = resultChips(result);
  const frame = testCompleteFrame(module, r.tasks, r.score, r.stars);
  const learnStars = state.learnStars[module] ?? 0;
  const bestStars = state.results[module]?.stars ?? 0;

  return (
    <div data-holo={holo ? "true" : undefined} className={styles.page}>
      <div className={styles.twoUp}>
        <section aria-label="In your AI chat" className={styles.chatCol}>
          <div className={styles.colKicker}>1 · IN YOUR AI CHAT</div>
          <pre className={styles.term} role="img" aria-label={`TEST COMPLETE frame as printed by Claude: ${r.score} out of 100, ${r.stars} of 3 stars`}>
            {frame.lines.map((l, i) => (
              <FrameLine key={i} line={l} />
            ))}
            {"\n"}
            <span className={styles.tMarker}>{frame.marker}</span>
            {"\n"}
            <span className={styles.tDim}>→ paste the result code on your AIGO Progress page</span>
          </pre>
          <div className={styles.colNote}>Rebuilt from your result code: the stars, each task&apos;s result and your stamps.</div>
        </section>
        <section aria-label="On the site" className={`${styles.siteCol} cutPanel`}>
          <div className={styles.colKickerLight}>2 · ON AIGO, AFTER YOU PASTE IT</div>
          <div className={styles.siteTop}>
            <div className={styles.lockWrap} aria-hidden="true">
              <div className={`${styles.lockGlow} ${holo ? styles.lockGlowHolo : ""}`} />
              <div className={styles.lockArt}>
                <ItemArt kind="test" />
              </div>
            </div>
            {!read ? (
              <div className={styles.reading} role="status">
                READING CODE<span className={styles.cursor}>_</span>
              </div>
            ) : (
            <div className={styles.siteText}>
              <div className={styles.siteEyebrow}>
                ▲ {itemFor(module, "test").name.toUpperCase()}
                {holo ? " · NOW HOLOGRAPHIC" : ""} · SET {number} · {title.toUpperCase()}
              </div>
              <div className={styles.score}>
                {r.score}
                <small>/100</small>
              </div>
              <StarReveal stars={r.stars} />
              <p className={styles.lead} role="status">
                {r.score} / 100 · {resultSummary(r.score)}
              </p>
              <div className={styles.tiers}>
                <span className={`${styles.tier} ${r.stars === 1 ? styles.tierOn : ""}`}>★ 50+</span>
                <span className={`${styles.tier} ${r.stars === 2 ? styles.tierOn : ""}`}>★★ 70+ · SKILL COUNTED</span>
                <span className={`${styles.tier} ${r.stars === 3 ? styles.tierOn : ""}`}>★★★ 90+ · HOLOGRAPHIC</span>
              </div>
            </div>
            )}
          </div>
          {read && (
            <div className={styles.chips}>
              {chips.map((c) => (
                <span key={c.text} className={`${styles.chip} ${c.tone === "gold" ? styles.chipGold : c.tone === "green" ? styles.chipGreen : styles.chipBlue}`}>{c.text}</span>
              ))}
              <span className={`${styles.chip} ${styles.chipBlue}`}>✓ MADE FOR {state.profile.name.toUpperCase()}&apos;S ITEMS</span>
            </div>
          )}
          {!isBest && previousBest && <p className={styles.siteNote}>Your best result is kept: {resultLine(previousBest)}.</p>}
        </section>
      </div>

      <div className={styles.cols}>
        <section aria-label="What Claude checked" className={`${styles.sheet} ${styles.checks}`}>
          <div className="label">What Claude checked</div>
          <ol className={styles.checkList}>
            {checks.map((c) => (
              <li key={c.n} className={styles.check}>
                <span className={styles.num}>{c.n}</span>
                <div className={styles.checkBody}>
                  <div className={styles.checkTitle}>
                    {c.title} <span className={styles.tag}>{c.type}</span>
                  </div>
                  <div className={styles.line}>{c.line}</div>
                </div>
                <span className={`${styles.pts} ${c.ok ? styles.good : styles.bad}`}>
                  {c.mark} {c.points} / {c.max}
                  {c.label ? <span className="visuallyHidden"> ({c.label})</span> : null}
                </span>
              </li>
            ))}
          </ol>
          {practice && (
            <div className={styles.practice}>
              <strong>One thing to practice:</strong> {practice.text}
              {practice.lesson && (
                <>
                  {" "}
                  <Link href="/console">{practice.lesson.label}</Link> teaches it.
                </>
              )}
            </div>
          )}
        </section>

        <div className={styles.side}>
          <section aria-label="Stamps confirmed by this test" className={styles.sheet}>
            <div className="label">Stamps confirmed by this test</div>
            {newStamps.length > 0 ? (
              <>
                <div className={styles.stampRow}>
                  {newStamps.map((code) => (
                    <Stamp key={code} code={code} name={techniqueInfo(code).short} difficulty={difficultyOf(code)} earned size={80} fresh />
                  ))}
                </div>
                <p className={styles.note}>
                  New: <strong>{newStamps.map((c) => techniqueInfo(c).short).join(", ")}</strong>
                </p>
              </>
            ) : (
              <p className={styles.note}>No new stamps this time.</p>
            )}
          </section>

          {badge.earned && (
            <section aria-label="Set complete" className={styles.complete}>
              <div className={`${styles.shield} ${badge.holo ? "" : styles.shieldPlain}`} aria-hidden="true">
                <div className={styles.shieldIn}>
                  <span>SET {number}</span>
                  <span>{"★".repeat(bestStars)}</span>
                </div>
              </div>
              <div>
                <div className={styles.completeLabel}>SET COMPLETE</div>
                <div className={styles.completeTitle}>
                  Set {number} badge{badge.holo ? ", holographic" : ""}
                </div>
                <div className={styles.completeSteps}>
                  {steps.steps[0] ? "✓" : "·"} Learn {"★".repeat(learnStars)}
                  <br />
                  {steps.steps[1] ? "✓" : "·"} Test {"★".repeat(bestStars)}
                  <br />
                  {steps.steps[2] ? "✓" : "·"} Help used
                </div>
              </div>
            </section>
          )}
        </div>
      </div>

      {(unlocked.length > 0 || newAchievements.length > 0 || !cleared) && (
        <section className={styles.sheet} aria-label="What changed">
          {!cleared && <p>Not cleared yet (70 needed). Go through the set&apos;s LEARN card again, then retake the TEST.</p>}
          {cleared && unlocked.length > 0 && <p>Set cleared! The next card is unlocked.</p>}
          {unlocked.length > 0 && (
            <>
              <p className="label">You got a new card</p>
              <ul className={styles.extra}>
                {unlocked.map((id) => (
                  <li key={id}>
                    {itemTitle(id)}
                    {" "}
                    — create it in the <Link href="/collection">collection</Link>
                  </li>
                ))}
              </ul>
            </>
          )}
          {newAchievements.length > 0 && (
            <>
              <p className="label">Milestone reached</p>
              <ul className={styles.extra}>
                {newAchievements.map((a) => (
                  <li key={a}>
                    {ACHIEVEMENTS[a].title} — {ACHIEVEMENTS[a].description}
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}

      <section aria-label="Your next skill" className={styles.next}>
        <div className={styles.nextText}>
          <div className={styles.nextEyebrow}>Your next skill</div>
          <div className={styles.nextTitle}>{cta.title}</div>
          <div className={styles.nextSub}>{cta.sub}</div>
        </div>
        <Link href="/collection" className="button">
          Back to collection
        </Link>
        <Link href="/pro" className="button-secondary">
          See Premium
        </Link>
      </section>
    </div>
  );
}
