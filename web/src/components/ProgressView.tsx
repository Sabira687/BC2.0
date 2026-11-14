"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useAigo } from "@/lib/client/useAigo";
import { programOf } from "@/lib/progress";
import { canLeaveDemo } from "@/lib/demo";
import { PRICE_USD_PER_MONTH } from "@/lib/generator";
import { stampPassport, whatYouCanDo } from "@/lib/progressview";
import { setSky, skyNeighbours } from "@/lib/sky";
import { Stamp } from "@/components/ui";
import { ResultView } from "./ResultView";
import { demoResultView } from "@/lib/resultview";
import { ResultCodeForm } from "./ResultCodeForm";
import { SkySvg } from "./SkySvg";
import styles from "./Progress.module.css";

export function ProgressView() {
  const { state, actions } = useAigo();
  // A stored pre-demo snapshot is only read from storage when the state changes.
  const canGoBack = useMemo(() => (state ? canLeaveDemo(state) : false), [state]);
  const [showResult, setShowResult] = useState(false);
  if (!state) return <p>Loading…</p>;

  const program = programOf(state);
  const sky = setSky(state);
  const pass = stampPassport(state);
  const can = whatYouCanDo(state);
  const ff = state.demo.fastForwarded;
  const demoResult = ff ? demoResultView(state) : null;

  function onReset() {
    if (window.confirm("Reset all progress? Your cards and results will be removed. This cannot be undone.")) actions.reset();
  }

  return (
    <div className={styles.page}>
      <section className={styles.head}>
        <div>
          <div className="kicker">04 / Progress · {state.profile.name}</div>
          <h1>Your progress</h1>
          <p>What you&apos;ve proven with Claude so far. Nothing expires, and there are no streaks to keep.</p>
        </div>
        <div className={styles.plaque} data-demo="true">
          <p>
            <strong>DEMO ONLY · Fast-forward John</strong>
            <br />
            {ff
              ? "You are looking at John after Set 01. It was filled in through the same result-code path a real test uses."
              : "See John after he finishes Set 01: stars, stamps and the set badge."}
          </p>
          {!ff && (
            <button type="button" className="cut" onClick={actions.fastForwardDemo}>
              Fast-forward John
            </button>
          )}
          {ff && canGoBack && <p>Back to now returns to the moment before the demo; anything you did after it is undone.</p>}
          {demoResult && (
            <button type="button" className="cut" onClick={() => setShowResult((v) => !v)} aria-expanded={showResult}>
              {showResult ? "Hide John's test result" : "See John's test result"}
            </button>
          )}
          {ff && canGoBack && (
            <button type="button" className="cut" onClick={actions.backToNow}>
              Back to now
            </button>
          )}
        </div>
      </section>

      {demoResult && showResult && <ResultView result={demoResult} />}

      <section aria-label="Skill sky" className={`${styles.sky} cutPanel`}>
        <div className={styles.skyHead}>
          <div>
            <div className="kicker" style={{ color: "#6AF7FF" }}>A / Skill sky</div>
            <h2>Every star is a step you proved</h2>
          </div>
          <p>Set 01 is the demo. Sets 02–07 open at launch; Premium adds more constellations.</p>
        </div>
        <SkySvg sky={sky} neighbours={skyNeighbours(state)} />
        <div className={styles.skyFoot}>
          <div>
            <div className={styles.skyName}>The Clear Ask</div>
            <div className={styles.bar} role="img" aria-label={`${sky.lit} of ${sky.stars.length} stars lit`}>
              <span className={styles.barLabel}>SET 01</span>
              <span className={styles.barCells}>
                {sky.stars.map((s) => (
                  <span key={s.id} className={s.lit ? styles.cellOn : styles.cellOff} />
                ))}
              </span>
              <span className={styles.barCount}>{sky.complete ? `${sky.countText} · SET BADGE` : `${sky.countText} STARS`}</span>
            </div>
          </div>
          <div className={styles.skyNote}>
            {sky.next ? (
              <>
                <span className={styles.noteNext}>NEXT STAR · {sky.next.label.toUpperCase()}</span>
                <br />
                Do it in the console, with your own work.
              </>
            ) : (
              <>
                <span className={styles.noteDone}>CONSTELLATION COMPLETE</span>
                <br />
                Next at launch: Iterate or Show, Don&apos;t Tell.
              </>
            )}
          </div>
        </div>
      </section>

      <div className={styles.cols}>
        <section aria-label="Stamp passport" className={styles.passport}>
          <div className={styles.passStub} aria-hidden="true">
            <span>{pass.spine}</span>
          </div>
          <div className={styles.passBody}>
            <div className={styles.passHead}>
              <div>
                <div className={styles.passKicker}>AIGO SKILL PASSPORT · COLLECT ALL {pass.total} STAMPS</div>
                <h2>One stamp for each skill Claude checked</h2>
              </div>
              <div className={styles.passCount} aria-label={`${pass.earned} of ${pass.total} stamps`}>
                {pass.earned}
                <small>/{pass.total}</small>
              </div>
            </div>
            <div className={styles.grid}>
              {pass.slots.map((s) => (
                <div key={s.code} className={styles.slot} data-earned={s.earned ? "true" : "false"} data-difficulty={s.difficulty}>
                  <div className={`${styles.ring} ${styles[`ring_${s.difficulty}`]}`}>
                    <Stamp code={s.code} name={s.name} difficulty={s.difficulty} topLabel={s.difficulty === "start" ? "GIFT" : undefined} earned={s.earned} size={84} />
                  </div>
                  <div className={styles.slotName} data-earned={s.earned ? "true" : "false"}>{s.name}</div>
                </div>
              ))}
            </div>
            <div className={styles.legend}>
              <span><i className={styles.ring_start} /> start</span>
              <span><i className={styles.ring_easy} /> easy</span>
              <span><i className={styles.ring_medium} /> medium</span>
              <span><i className={styles.ring_hard} /> hard</span>
              <span className={styles.legendNote}>{pass.caption}</span>
            </div>
          </div>
        </section>

        <section aria-label="What you can do now" className={`${styles.can} cutPanel`}>
          <div className={styles.canKicker}>WHAT YOU CAN DO NOW</div>
          <p className="muted" style={{ margin: "6px 0 0" }}>Only skills Claude checked on your own work.</p>
          {can.length > 0 ? (
            <ul className={styles.canList}>
              {can.map((c) => (
                <li key={c.key}>
                  <span className={styles.tick} aria-hidden="true">✓</span>
                  <div>
                    <div className={styles.canText}>{c.text}</div>
                    <div className={styles.canDetail}>{c.detail}</div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.empty}>Nothing yet. Finish a lesson or a test and your first skill shows up here.</p>
          )}
        </section>
      </div>

      <section aria-label="Add a result code" className={styles.codeBox}>
        <div className={styles.codeIntro}>
          <strong>Took a test in your own Claude?</strong>
          <p>Paste the result code from the end of the test. Your stars and stamps come back here.</p>
        </div>
        <div className={styles.codeForm}>
          <ResultCodeForm key={state.secrets.playerId} applyResultCode={actions.applyResultCode} />
        </div>
      </section>

      <section className={styles.foot}>
        <span>
          Player ID {state.secrets.playerId} · Project: {program.project.title}
        </span>
        <span>
          {state.subscription.active ? "Premium is active (test mode)." : `Demo: Set 01. Sets 02–07 are free at launch; Premium ($${PRICE_USD_PER_MONTH}/month) adds the advanced paths.`}{" "}
          <Link href="/pro">{state.subscription.active ? "Manage" : "See Premium"}</Link>
        </span>
        <Link href="/start">Edit answers</Link>
        <Link href="/console">Start your lesson with Claude</Link>
        <button type="button" className="secondary" onClick={onReset}>
          Reset progress
        </button>
      </section>
    </div>
  );
}
