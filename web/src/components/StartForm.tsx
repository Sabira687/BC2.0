"use client";
import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import { Stamp } from "@/components/ui";
import { firstReply } from "@/lib/startpreview";
import { inkGreeting } from "@/lib/startsheet";
import styles from "./StartForm.module.css";
import { useAigo } from "@/lib/client/useAigo";
import { JOHN, validateProfile, type ProfileErrors } from "@/lib/profile";
import type { Profile } from "@/lib/types";

type StyleChoice = "mentor" | "straight";

const STICKERS: { value: StyleChoice; name: string; sub: string; rot: number }[] = [
  { value: "mentor", name: "Mentor", sub: "explains why, step by step", rot: -2 },
  { value: "straight", name: "Straight talk", sub: "short tasks, no fluff", rot: 1.5 },
];

const BENEFITS: [string, string][] = [
  ["Items made for your job", "Examples from your work, in the tone you picked."],
  ["Learn inside your own AI", "No new app to live in. Paste an item, start learning."],
  ["Proof, not points", "Stars and stamps only when your AI checks your work."],
  ["Nothing expires", "No streaks, no timers. Come back whenever you like."],
];

function Lock() {
  return <span className={styles.lock} title="Demo answer, locked">🔒 DEMO</span>;
}

function Q({ n, text, hint, locked, children }: { n: number; text: string; hint?: string; locked?: boolean; children: ReactNode }) {
  return (
    <div className={styles.row} role="group" aria-label={`Question ${n}: ${text}${locked ? ". Demo answer, locked" : ""}`}>
      <div className={styles.q}>
        {n}. {text} {hint && <span className={styles.hint}>({hint})</span>}
        {locked && <Lock />}
      </div>
      {children}
    </div>
  );
}

function Ticks({ options, chosen }: { options: string[]; chosen: string }) {
  return (
    <ul className={styles.ticks}>
      {options.map((o) => (
        <li key={o} className={o === chosen ? styles.on : styles.off}>
          <span className={styles.box}>{o === chosen && <span className={styles.check}>✓</span>}</span>
          {o}
          <span className={styles.sr}>{o === chosen ? " selected (demo answer)" : " not selected"}</span>
        </li>
      ))}
    </ul>
  );
}

function Marked({ options, chosen, kind }: { options: string[]; chosen: string; kind: "circle" | "underline" }) {
  return (
    <ul className={styles.marked}>
      {options.map((o) => (
        <li key={o} className={o === chosen ? `${styles.pencilOn} ${kind === "circle" ? styles.circle : styles.underline}` : styles.off}>
          {o}
          <span className={styles.sr}>{o === chosen ? " selected (demo answer)" : " not selected"}</span>
        </li>
      ))}
    </ul>
  );
}

export function StartForm() {
  const { state } = useAigo();
  if (!state) return <p>Loading…</p>;
  return <StartFormInner initial={state.profile} />;
}

function StartFormInner({ initial }: { initial: Profile }) {
  const { actions } = useAigo();
  const router = useRouter();
  const [style, setStyle] = useState<StyleChoice>(initial.style === "straight" ? "straight" : "mentor");
  const [errors, setErrors] = useState<ProfileErrors>({});

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const result = validateProfile({ ...initial, name: JOHN.name, style }, { demoLock: true });
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    actions.updateProfile(result.profile);
    router.push("/collection");
  }

  const shown = JOHN.name;
  const reply = firstReply(style, shown);

  return (
    <div className={styles.layout}>
      <form id="start-form" onSubmit={onSubmit} noValidate aria-label="Questionnaire" className={styles.sheet}>
        <div className={styles.margin} aria-hidden="true" />
        <div className={styles.holes} aria-hidden="true"><span /><span /><span /></div>
        <div className={styles.head}>
          <div>
            <div className={styles.no}>AIGO · PLAYER QUESTIONNAIRE · NO. 0001</div>
            <div className={styles.title}>All about me ✎</div>
          </div>
          <div className={styles.legend}>
            <div><span className={styles.legPencil}>pencil</span> = demo answer, locked</div>
            <div><span className={styles.legInk}>blue ink</span> = your answer</div>
          </div>
        </div>

        <Q n={1} text="My name is" locked><span className={`${styles.nameInput} ${styles.pencilText}`}>{JOHN.name}<span className={styles.sr}> (demo answer)</span></span></Q>
        <Q n={2} text="I work as" locked><span className={`${styles.big} ${styles.pencilText}`}>an office manager<span className={styles.sr}> (demo answer)</span></span></Q>
        <Q n={3} text="How do I use AI now?" hint="tick one" locked>
          <Ticks options={["only chat: questions & answers", "tried an AI agent", "work with agents often"]} chosen="only chat: questions & answers" />
        </Q>
        <Q n={4} text="Who do I want to become?" hint="circle it" locked>
          <Marked options={["everyday user", "power user", "automator", "my own Jarvis"]} chosen="automator" kind="circle" />
        </Q>
        <Q n={5} text="Why?" hint="underline" locked>
          <Marked options={["grow at my job", "change careers", "my own project"]} chosen="grow at my job" kind="underline" />
        </Q>

        <fieldset className={styles.row}>
          <legend className={styles.q}>6. How should my AI teach me? <span className={styles.hint}>(pick a sticker!)</span></legend>
          <div className={styles.stickers}>
            {STICKERS.map((s) => {
              const on = style === s.value;
              return (
                <button
                  key={s.value}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setStyle(s.value)}
                  className={`${styles.sticker} ${on ? styles.stickerOn : ""}`}
                  style={{ transform: `rotate(${s.rot}deg)` }}
                >
                  <span className={styles.stName}>{s.name}</span>
                  <span className={styles.stSub}>{s.sub}</span>
                  {on && <span className={styles.chosen}>✓ CHOSEN</span>}
                </button>
              );
            })}
          </div>
          {errors.style && <span role="alert" className={styles.error}>{errors.style}</span>}
        </fieldset>

        <Q n={7} text="My AI" locked>
          <div className={styles.marked}>
            <span className={styles.pencilOn}>Claude Chat ✓<span className={styles.sr}> selected (demo answer)</span></span>
            <span className={`${styles.off} ${styles.strike}`}>Claude Code<span className={styles.sr}> not selected</span></span>
            <span className={`${styles.off} ${styles.strike}`}>ChatGPT<span className={styles.sr}> not selected</span></span>
            <span className={`${styles.off} ${styles.strike}`}>Gemini<span className={styles.sr}> not selected</span></span>
            <span className={styles.off}>← later!</span>
          </div>
        </Q>
        <Q n={8} text="My Claude plan" hint="circle it" locked>
          <Marked options={["Free", "Pro", "Max"]} chosen="Pro" kind="circle" />
        </Q>
        {(errors.age || errors.level || errors.goal || errors.reason || errors.assistant || errors.plan) && (
          <p role="alert" className={styles.error}>The demo answers could not be checked. Reload the page and try again.</p>
        )}
        <div className={styles.thanks}><span>Thank you for filling it in! ☺</span><span aria-hidden="true" className={styles.star}>★</span></div>
      </form>

      <aside className={styles.side} aria-label="Why you are filling this in">
        <div className={`${styles.panel} cutPanel`}>
          <div className="kicker" style={{ color: "var(--learn)" }}>WHY YOU&apos;RE FILLING THIS IN</div>
          <ul className={styles.benefits}>
            {BENEFITS.map(([t, d], i) => (
              <li key={t}>
                <span className={styles.num}>{String(i + 1).padStart(2, "0")}</span>
                <div><strong>{t}</strong><p>{d}</p></div>
              </li>
            ))}
          </ul>
        </div>
        <div className={styles.greet} aria-live="polite">
          <div className={styles.greetLabel}>HOW YOUR AI WILL GREET YOU · {reply.styleLabel.toUpperCase()}</div>
          <p><span className={styles.claude}>claude ›</span> {inkGreeting(style, shown)}</p>
          <p className={styles.rule}>In your item: {reply.rule}</p>
        </div>
        <div className={styles.gift}>
          <Stamp code="P" name="Player One" difficulty="start" topLabel="GIFT" earned size={72} />
          <div>
            <strong>Your first stamp is a gift</strong>
            <p>It lands in your stamp book with your collection. The other 12 you earn by doing.</p>
          </div>
        </div>
        <button type="submit" form="start-form" className={`${styles.submit} cut`}>MAKE MY ITEMS ▸</button>
        <div className="kicker" style={{ fontSize: 11 }}>SET 01 IS FREE: THE KEY, THE LOCK AND THE COMPASS</div>
      </aside>
    </div>
  );
}
