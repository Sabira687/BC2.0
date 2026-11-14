/**
 * <Stars value max=3 size=14 showText />
 *  - value: filled stars (clamped 0..max); max default 3.
 *  - size: glyph px (default 14). showText: also show "2 of 3 stars" visibly (otherwise visually hidden but still read).
 * Stars are doubled as text so they never rely on color alone.
 */
import { STAR_COLOR, STAR_EMPTY, clampStars, starsText } from "./tokens";
import styles from "./ui.module.css";

export interface StarsProps {
  value: number;
  max?: number;
  size?: number;
  showText?: boolean;
  className?: string;
}

export function Stars({ value, max = 3, size = 14, showText = false, className }: StarsProps) {
  const v = clampStars(value, max);
  return (
    <span className={`${styles.stars} ${className ?? ""}`}>
      <span aria-hidden="true" className={styles.starRow} style={{ fontSize: size }}>
        {Array.from({ length: max }, (_, i) => (
          <span key={i} style={{ color: i < v ? STAR_COLOR : STAR_EMPTY }}>
            {i < v ? "★" : "☆"}
          </span>
        ))}
      </span>
      <span className={showText ? styles.starText : styles.visuallyHidden}>{starsText(v, max)}</span>
    </span>
  );
}
