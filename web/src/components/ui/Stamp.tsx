/**
 * <Stamp code name difficulty earned size=104 />
 *  - code: stamp code ("1".."9","A".."C","P") used for a stable rotation.
 *  - name: technique name (caption for unearned, printed on the seal when earned).
 *  - difficulty: "easy"|"medium"|"hard" (or "Easy"|"Medium"|"Hard" from lib/album) -> ink color.
 *  - earned: serrated rotated seal; otherwise dashed circle "???" with the skill name as caption.
 *  - size: seal diameter px (default 104). Stamping motion is off under prefers-reduced-motion.
 */
import { DIFFICULTY_INK, difficultyKey, stampRotation } from "./tokens";
import styles from "./ui.module.css";

export interface StampProps {
  code: string;
  name: string;
  difficulty: string;
  earned: boolean;
  size?: number;
  /** Play the one-shot "stamping" press when it mounts (use for a just-earned stamp). */
  fresh?: boolean;
  /** Top label printed on the seal; defaults to the difficulty (EASY/MEDIUM/HARD). E.g. "GIFT" for Player One. */
  topLabel?: string;
}

export function Stamp({ code, name, difficulty, earned, size = 104, fresh = false, topLabel }: StampProps) {
  const d = DIFFICULTY_INK[difficultyKey(difficulty)];
  const u = size / 104;
  if (!earned) {
    return (
      <figure className={styles.stampWrap} style={{ width: size }}>
        <div
          role="img"
          aria-label={`Stamp not earned yet: ${name}`}
          className={styles.stampEmpty}
          style={{ width: size, height: size, fontSize: Math.max(10, 12 * u) }}
        >
          ???
        </div>
        <figcaption className={styles.stampCaption}>{name}</figcaption>
      </figure>
    );
  }
  return (
    <figure className={styles.stampWrap} style={{ width: size }}>
      <div
        role="img"
        aria-label={`Stamp earned: ${name}, ${difficultyKey(difficulty)}`}
        className={`${styles.stamp} ${fresh ? styles.stampFresh : ""}`}
        style={{
          width: size,
          height: size,
          color: d.ink,
          ["--ink" as string]: d.ink,
          ["--rot" as string]: `${stampRotation(code)}deg`,
          ["--u" as string]: u,
        }}
      >
        <div className={styles.stampInner}>
          <span className={styles.stampTop}>{topLabel ?? d.label}</span>
          <span className={styles.stampName}>{name}</span>
          <span className={styles.stampBottom}>AIGO ★</span>
        </div>
      </div>
    </figure>
  );
}
