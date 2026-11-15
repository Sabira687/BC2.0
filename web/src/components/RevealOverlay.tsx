"use client";
import { useEffect, useRef, useState } from "react";
import { Card, KIND_META } from "@/components/ui";
import type { CardProps } from "@/components/ui";
import { revealSequence, sparkLayout, type RevealPhase } from "@/lib/reveal";
import { loadMuted, playChime, saveMuted } from "@/lib/sound";
import type { ItemKind } from "@/lib/types";
import styles from "./RevealOverlay.module.css";

const SIZE = 240;
const SPARKS = sparkLayout(14);
const LIGHT: Record<string, string> = { learn: "#60A5FA", test: "#F0ABFC", help: "#4ADE80" };

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

  const muteRef = useRef<HTMLButtonElement>(null);
  const [muted, setMuted] = useState(false);
  useEffect(() => {
    skipRef.current?.focus();
    setMuted(loadMuted());
  }, []);

  useEffect(() => {
    if (phase !== "flip" || muted) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    playChime();
  }, [phase, index, muted]);

  function toggleMute() {
    const next = !muted;
    setMuted(next);
    saveMuted(next);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      finish();
    } else if (e.key === "Tab") {
      // Two controls (Skip, Sound): keep focus cycling between them.
      e.preventDefault();
      const order = [skipRef.current, muteRef.current];
      const at = order.indexOf(document.activeElement as HTMLButtonElement);
      const step = e.shiftKey ? -1 : 1;
      order[(at + step + order.length) % order.length]?.focus();
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
  const light = LIGHT[kind] ?? color;
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
        {phase === "flip" || phase === "new" ? (
          <div key={index} aria-hidden="true" className={styles.sparks} style={{ ["--spark" as string]: color, ["--spark2" as string]: light }}>
            {SPARKS.map((p, i) => (
              <span
                key={i}
                className={`${styles.spark} ${p.star ? styles.star : ""}`}
                style={{ width: p.size, height: p.size, animationDelay: `${p.delay}ms`, ["--dx" as string]: `${Math.round(Math.cos((p.angle * Math.PI) / 180) * p.dist)}px`, ["--dy" as string]: `${Math.round(Math.sin((p.angle * Math.PI) / 180) * p.dist)}px` }}
              />
            ))}
          </div>
        ) : null}
        <p className={styles.caption} role="status">
          {phase === "new" ? "NEW!" : many ? `Card ${index + 1} of ${cards.length}…` : "Creating your card…"}
        </p>
        <button ref={skipRef} type="button" className="secondary" onClick={finish}>
          {many ? "Skip all" : "Skip"}
        </button>
        <button ref={muteRef} type="button" className="secondary" aria-pressed={muted} onClick={toggleMute}>
          {muted ? "Sound off" : "Sound on"}
        </button>
      </div>
    </div>
  );
}
