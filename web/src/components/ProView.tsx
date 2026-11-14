"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui";
import { useAigo } from "@/lib/client/useAigo";
import { CONFIRM_MS, PAYMENT_TEXT, initialPhase, nextPhase, type PaymentPhase } from "@/lib/payment";
import { PATH_TILES, PLAN_COLUMNS, PROMISES, planTicketTitle } from "@/lib/marketing";
import { PRICE_USD_PER_MONTH } from "@/lib/generator";
import styles from "./Premium.module.css";

/** Premium page: three columns (demo / Free / Premium), the two paths, and a simulated test-mode checkout. */
export function ProView() {
  const { state } = useAigo();
  if (!state) return <p>Loading…</p>;
  return <PremiumInner subscribed={state.subscription.active} />;
}

function LockedCard({ set, size }: { set: number; size: number }) {
  return <Card kind="locked" state="closed" setLabel={`S${String(set).padStart(2, "0")}`} size={size} rarity="legendary" />;
}

function PremiumInner({ subscribed }: { subscribed: boolean }) {
  const { actions } = useAigo();
  const [phase, setPhase] = useState<PaymentPhase>(() => initialPhase(subscribed));
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  function pay() {
    if (phase !== "idle") return;
    setPhase(nextPhase(phase, "pay"));
    timer.current = setTimeout(() => {
      actions.subscribe(); // simulated: no card, no charge
      setPhase((p) => nextPhase(p, "confirmed"));
    }, CONFIRM_MS);
  }
  function cancel() {
    if (timer.current) clearTimeout(timer.current);
    actions.unsubscribe();
    setPhase(nextPhase(phase, "cancel"));
  }

  return (
    <>
      <section className={styles.hero}>
        <div>
          <div className="kicker">05 / Premium · ${PRICE_USD_PER_MONTH} a month</div>
          <h1>Go further.<br />${PRICE_USD_PER_MONTH} a month.</h1>
        </div>
        <p>
          Free gives you the core path: 7 skills, 21 cards. Premium adds the AIGO Connector, two advanced paths and new cards every month.
          Everything you earn stays yours either way.
        </p>
      </section>

      <div className={styles.tickets}>
        {PLAN_COLUMNS.map((c, i) => (
          <section key={c.label} aria-label={planTicketTitle(c)} className={`${styles.ticket} lift`} data-plan={i === 0 ? "demo" : i === 1 ? "free" : "premium"}>
            <div className={`${styles.strip} ${i === 0 ? styles.stripDemo : i === 1 ? styles.stripFree : styles.stripPremium}`} aria-hidden="true" />
            <div className={styles.ticketBody}>
              <div className={styles.tag}>{c.label}</div>
              <div className={styles.colHead}>{c.heading}</div>
              <div className={styles.price}>
                {c.price ?? "LIVE"}
                <small>{i === 0 ? " NOW" : i === 1 ? " / FOREVER" : " / MONTH"}</small>
              </div>
              <ul className={styles.rows}>
                {c.rows.map((r) => (
                  <li key={r.title}>
                    {r.title}
                    {r.why && <div className={styles.why}>{i === 0 ? r.why : `WHY IT'S REAL · ${r.why}`}</div>}
                  </li>
                ))}
              </ul>
              {c.footnote && <div className={styles.foot}>{c.footnote}</div>}
            </div>
            <div className={styles.stub} aria-hidden="true">
              <span>{i === 0 ? "DEMO · FREE PLAN" : i === 1 ? "FREE FOREVER" : "CANCEL ANYTIME"}</span>
            </div>
          </section>
        ))}
      </div>

      <section className={styles.paths} aria-label="Premium paths">
        {PATH_TILES.map((p) => (
          <div key={p.title} className={styles.path}>
            <div className={styles.pathHead}>
              <h2>{p.title}</h2>
              <span className={styles.legend}>★ LEGENDARY · {p.sets}</span>
            </div>
            <div className={styles.tiles}>
              {p.skills.map((s, i) => (
                <div key={s} className={styles.tile}>
                  <LockedCard set={p.first + i} size={96} />
                  {s}
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className={`${styles.checkout} cutPanel`} aria-label="Test checkout">
        <div className={styles.checkoutText}>
          <div className={styles.admit}>ADMIT ONE · PREMIUM · TEST MODE</div>
          <p>This demo runs on the Free plan. The checkout below is simulated in test mode: no card, no charge.</p>
        </div>
        {phase === "idle" && (
          <div className={styles.actions}>
            <button type="button" className={`${styles.buy} cut`} onClick={pay}>
              {PAYMENT_TEXT.idle}
            </button>
            <span className={styles.testBadge}>{PAYMENT_TEXT.badge}</span>
          </div>
        )}
        {phase === "confirming" && (
          <div className={styles.confirming} role="status">
            {PAYMENT_TEXT.confirming.replace(/_$/, "")}
            <span className={styles.cursor} aria-hidden="true">_</span>
          </div>
        )}
        {phase === "active" && (
          <div className={styles.active} role="status">
            <strong>{PAYMENT_TEXT.active}</strong>
            <p>{PAYMENT_TEXT.activeNote}</p>
            <p>
              Look at your <Link href="/collection">collection</Link> or <Link href="/progress">progress</Link>.
            </p>
            <button type="button" className={`${styles.cancel} cut`} onClick={cancel}>
              Cancel (test mode)
            </button>
          </div>
        )}
      </section>

      <section className={styles.promises}>
        {PROMISES.map((p) => (
          <div key={p.title} className={styles.promise}>
            <strong>{p.title}</strong>
            <span>{p.text}</span>
          </div>
        ))}
      </section>
    </>
  );
}
