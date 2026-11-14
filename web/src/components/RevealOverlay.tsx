"use client";
import { useEffect, useRef, useState } from "react";
import { Card, KIND_META } from "@/components/ui";
import type { CardProps } from "@/components/ui";
import { revealSequence, type RevealPhase } from "@/lib/reveal";
import type { ItemKind } from "@/lib/types";
import styles from "./RevealOverlay.module.css";

const SIZE = 240;

export interface RevealCard {
  kind: ItemKind;
  face: Omit<CardProps, "state" | "size">;
}

/**
 * Card reveal (about 2.4 s for one card; several cards play one after another): silhouette, sheen, glow in the type color, a short pause, flip, NEW!.
 * Skip (all) jumps to the end; Escape closes. `onDone` is called once, at the end or on Skip.
 */
export function RevealOverlay({ cards, onDone }: { cards: RevealCard[]; onDone: () => void }) {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<RevealPhase>("silhouette");
  const done = useRef(false);
  const cb = useRef(onDone);
  cb.current = onDone;

  const finish = () => {
    if (done.current) return;
    done.current = true;
    cb.current();
  };

  const skipRef = useRef<HTMLButtonElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    skipRef.current?.focus();
  }, []);

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      finish();
    } else if (e.key === "Tab") {
      // The only focusable control is Skip: keep focus on it.
      e.preventDefault();
      skipRef.current?.focus();
    }
  }

  useEffect(() => {
    const timers = revealSequence(cards.length)
      .slice(1)
      .map((s) =>
        setTimeout(() => {
          if (s.phase === "done") return finish();
          setIndex(s.index);
          setPhase(s.phase);
        }, s.at),
      );
    return () => timers.forEach(clearTimeout);
  }, []);

  const { kind, face } = cards[index]!;
  const many = cards.length > 1;
  const color = KIND_META[kind].color;
  const flipped = phase === "flip" || phase === "new";
  const glowing = phase === "glow" || phase === "pause" || flipped;
  return (
    <div ref={rootRef} onKeyDown={onKeyDown} className={styles.overlay} role="dialog" aria-modal="true" aria-label={many ? "Opening your set" : "Creating your card"}>
      <div className={styles.stage} style={{ ["--type" as string]: color }}>
        <div className={`${styles.card} ${phase === "sheen" ? styles.tilt : ""} ${glowing ? styles.glow : ""} ${flipped ? styles.flipped : ""}`} style={{ width: SIZE, height: (SIZE * 7) / 5 }}>
          <div aria-hidden="true" className={`${styles.face} ${styles.back}`}>
            <Card kind="locked" state="closed" size={SIZE} />
            {phase === "sheen" && <div aria-hidden="true" className={styles.sweep} />}
          </div>
          <div key={index} className={`${styles.face} ${styles.front}`}>
            <Card {...face} state={phase === "new" ? "new" : "normal"} size={SIZE} />
          </div>
        </div>
        <p className={styles.caption} role="status">
          {phase === "new" ? "NEW!" : many ? `Card ${index + 1} of ${cards.length}…` : "Creating your card…"}
        </p>
        <button ref={skipRef} type="button" className="secondary" onClick={finish}>
          {many ? "Skip all" : "Skip"}
        </button>
      </div>
    </div>
  );
}
