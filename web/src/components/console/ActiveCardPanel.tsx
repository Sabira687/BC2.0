import { Card, Stamp, Stars, difficultyKey } from "@/components/ui";
import { difficultyOf } from "@/lib/album";
import { getTechnique } from "@/lib/content";
import type { ActiveCardView } from "@/lib/markers";
import type { TechniqueCode } from "@/lib/types";
import styles from "./console.module.css";

/** Right column: the mini card with live stars, and "NEW STAMP" for stamps the last reply newly gave. */
export function ActiveCardPanel({ view, newStamps = [], label, children }: { view: ActiveCardView; newStamps?: readonly TechniqueCode[]; label: string; children?: React.ReactNode }) {
  return (
    <section className={styles.sideCard} data-kind={view.kind} aria-label={label}>
      <div className={styles.cardRow}>
        <Card
          kind={view.kind}
          state={view.kind === "test" && view.stars === 3 ? "holo" : "normal"}
          title={view.title}
          overline={view.overline}
          rarity={view.rarity}
          art={view.art}
          flavor={view.flavor}
          stars={view.stars}
          setLabel={view.setLabel}
          properties={view.properties}
          size={120}
        />
        <div className={styles.cardInfo}>
          <div className={styles.eyebrow}>{label}</div>
          <div className={styles.cardName}>{view.title}</div>
          {view.stars !== undefined && <Stars value={view.stars} size={20} showText />}
          {children}
        </div>
      </div>
      {newStamps.map((code) => {
        const t = getTechnique(code);
        return (
          <div key={code} className={styles.newStamp}>
            <Stamp code={code} name={t.name} difficulty={difficultyKey(difficultyOf(code))} earned size={72} fresh />
            <span className={styles.newStampLabel}>NEW STAMP</span>
          </div>
        );
      })}
    </section>
  );
}
