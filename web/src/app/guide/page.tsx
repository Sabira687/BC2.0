import Link from "next/link";
import { GuideVisual } from "@/components/GuideVisual";
import { GUIDE_CHECKLIST, GUIDE_CONNECTOR, GUIDE_STEPS, GUIDE_WAYS } from "@/lib/content";
import styles from "@/components/Guide.module.css";

export const metadata = { title: "Guide" };

export default function GuidePage() {
  return (
    <div className={styles.layout}>
      <div className={styles.main}>
        <div className="kicker">04 / GUIDE</div>
        <h1 className={styles.h1}>Use your items anywhere</h1>
        <p className="muted" style={{ maxWidth: 640 }}>
          The platform keeps your collection. The learning happens inside your AI. Here&apos;s how to get set up, once, in about three minutes.
        </p>
        <ol className={styles.steps}>
          {GUIDE_STEPS.map((s) => (
            <li key={s.n} className={styles.step}>
              <div className={styles.n} aria-hidden="true">{s.n}</div>
              <div className={styles.text}>
                <div className="kicker" style={{ fontSize: 10.5 }}>{s.tag}</div>
                <h2 className={styles.stepTitle}>{s.title}</h2>
                <p>{s.text}</p>
              </div>
              <div className={styles.visual}><GuideVisual kind={s.visual} /></div>
            </li>
          ))}
        </ol>
      </div>
      <aside className={styles.side}>
        <div className={`${styles.panel} cutPanel`}>
          <div className="kicker" style={{ color: "var(--learn)" }}>TWO WAYS TO LEARN</div>
          {GUIDE_WAYS.map((w) => (
            <div key={w.name} className={styles.way}>
              <strong>{w.name}</strong> {w.recommended && <span className={styles.rec}>RECOMMENDED</span>}
              <p>{w.note}</p>
            </div>
          ))}
          <div className={styles.links}>
            <Link href="/collection" className={`${styles.btn} cut`}>Collection</Link>
            <Link href="/console" className={`${styles.btn} ${styles.ghost} cut`}>Console</Link>
          </div>
        </div>
        <div className={styles.check}>
          <div className="kicker" style={{ fontSize: 11 }}>SETUP CHECKLIST</div>
          <ul>{GUIDE_CHECKLIST.map((c) => <li key={c}>[ ] {c}</li>)}</ul>
        </div>
        <div className={styles.premium}>
          <div className="kicker" style={{ color: "#b45309", fontSize: 11 }}>{GUIDE_CONNECTOR.kicker}</div>
          <h3>{GUIDE_CONNECTOR.title}</h3>
          <p>{GUIDE_CONNECTOR.text}</p>
        </div>
      </aside>
    </div>
  );
}
