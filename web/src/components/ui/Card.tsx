/**
 * <Card kind state title flavor stars setLabel properties size=220 />
 *  - kind: "learn"|"test"|"help"|"locked". "locked" always renders the night card back.
 *  - state: "closed" (night back, "???", stars if known) | "new" (normal + NEW! tag) | "normal" | "holo" (3-star holographic).
 *  - title / flavor: card name and italic quote (flavor is wrapped in curly quotes).
 *  - stars: 0..3, or undefined for HELP ("TOOL · NO STARS").
 *  - setLabel: e.g. "S01 · 1/3" (header right, and "??? · S03" style on a closed card).
 *  - properties: one line, e.g. "Learn · 3 lessons · ~10 min".
 *  - overline (set title in caps, above the item name), rarity ("common"|"rare"|"legendary": bottom-right label; locked rare/legendary cards get a colored glow),
 *    art (true: the item illustration for learn/test/help instead of the big type shape).
 *  - size: card width in px (default 220, height = width * 7/5). Everything scales with it.
 * Renders as role="img" with a full aria-label (kind, title, stars as text). Motion (twinkle, holo sheen) respects reduced-motion.
 */
import { KIND_META, HOLO_GRADIENT, clampStars, starsText, type CardKind } from "./tokens";
import { Stars } from "./Stars";
import { RARITY_META, type Rarity } from "@/lib/content/items";
import { ItemArt } from "./ItemArt";
import styles from "./Card.module.css";

export type CardVisualKind = CardKind | "locked";
export type CardState = "closed" | "new" | "normal" | "holo";

export interface CardProps {
  kind: CardVisualKind;
  state?: CardState;
  title?: string;
  flavor?: string;
  stars?: number;
  setLabel?: string;
  properties?: string;
  size?: number;
  className?: string;
  overline?: string;
  rarity?: Rarity;
  art?: boolean;
}

export function Card({ kind, state = "normal", title, flavor, stars, setLabel, properties, size = 220, className, overline, rarity, art = false }: CardProps) {
  const closed = state === "closed" || kind === "locked";
  const sizeStyle = { ["--u" as string]: size / 220, width: size, height: (size * 7) / 5 };
  if (closed) {
    const note = kind === "locked" || stars === undefined ? "You'll see it later" : undefined;
    const label =
      kind === "locked" ? `Locked card${rarity && rarity !== "common" ? `, ${rarity}` : ""}` : `${KIND_META[kind].label} card, closed${stars !== undefined ? `, ${starsText(stars)}` : ""}`;
    return (
      <div
        role="img"
        aria-label={label}
        className={`${styles.card} ${styles.closed} ${rarity === "rare" ? styles.closedRare : rarity === "legendary" ? styles.closedLegendary : ""} ${className ?? ""}`}
        style={sizeStyle}
      >
        <div aria-hidden="true" className={styles.hex}>
          ?
        </div>
        <div className={styles.closedCode} aria-hidden="true">
          ??? {setLabel ? `· ${setLabel}` : ""}
        </div>
        {kind !== "locked" && stars !== undefined ? <Stars value={stars} size={14 * (size / 220)} /> : null}
        {note ? <div className={styles.closedNote}>{note}</div> : null}
        {rarity && rarity !== "common" ? (
          <div aria-hidden="true" className={styles.closedRarity} style={{ color: rarity === "rare" ? "#67E8F9" : "#FCD34D" }}>
            {RARITY_META[rarity].symbol} {RARITY_META[rarity].label}
          </div>
        ) : null}
      </div>
    );
  }

  const m = KIND_META[kind];
  const holo = state === "holo";
  const hasStars = stars !== undefined;
  const label = `${m.label} card: ${title ?? ""}${rarity ? `, ${RARITY_META[rarity].label.toLowerCase()}` : ""}${hasStars ? `, ${starsText(stars)}` : ", no stars"}${holo ? ", holographic" : ""}`;
  return (
    <div
      role="img"
      aria-label={label}
      className={`${styles.card} ${holo ? styles.holoCard : ""} ${className ?? ""}`}
      style={{ ...sizeStyle, ["--glow" as string]: m.glow }}
    >
      <div aria-hidden="true" className={`${styles.frame} ${holo ? styles.holo : ""}`} style={{ background: holo ? HOLO_GRADIENT : m.frame }} />
      <div className={`${styles.head} ${holo ? "" : styles.headDark}`} style={{ color: holo ? "#172033" : "#FFFFFF" }}>
        <span>
          <span aria-hidden="true">{m.shape}</span> {m.label}
        </span>
        <span>{setLabel}</span>
      </div>
      <div className={styles.window} style={{ ["--glow" as string]: m.glow }}>
        <div aria-hidden="true" className={styles.twinkle} />
        {art && !closed ? <ItemArt kind={kind as CardKind} /> : <div aria-hidden="true" className={styles.shape} style={{ clipPath: m.clip }} />}
      </div>
      <div className={styles.body}>
        {overline ? <div className={styles.overline}>{overline}</div> : null}
        <div className={styles.title}>{title}</div>
        {properties ? <div className={styles.props}>{properties}</div> : null}
        {flavor ? <div className={styles.flavor}>{`“${flavor}”`}</div> : null}
        <div className={styles.foot}>
          {hasStars ? <Stars value={clampStars(stars)} size={14 * (size / 220)} /> : <span className={styles.tool}>TOOL · NO STARS</span>}
          {rarity ? (
            <span className={styles.rarity} style={{ color: RARITY_META[rarity].color }}>
              {RARITY_META[rarity].symbol} {RARITY_META[rarity].label}
            </span>
          ) : (
            <span className={styles.brand}>AIGO</span>
          )}
        </div>
      </div>
      <div aria-hidden="true" className={styles.gloss} />
      {holo ? <div aria-hidden="true" className={`${styles.sheen}`} /> : null}
      {state === "new" ? <div className={styles.newTag}>NEW!</div> : null}
    </div>
  );
}
