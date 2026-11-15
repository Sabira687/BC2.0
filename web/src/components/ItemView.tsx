"use client";
import Link from "next/link";
import { useState } from "react";
import { useAigo } from "@/lib/client/useAigo";
import { itemPageModel, type ItemPageModel } from "@/lib/itempage";
import { itemSummary } from "@/lib/generator";
import { peekItem } from "@/lib/peek";
import { collection, kindOf, moduleOfItem } from "@/lib/progress";
import type { AppState, ItemId, ItemKind } from "@/lib/types";
import { Stars } from "@/components/ui";
import { ItemArt } from "@/components/ui/ItemArt";
import { CopyButton } from "./CopyButton";
import { ITEM_INFO, itemLabel } from "./itemInfo";
import styles from "./ItemView.module.css";

const STEPS: [string, string][] = [
  ["Copy the item", "A short block of text with the lessons inside."],
  ["Paste into a new chat", "In the AIGO console or in your own Claude."],
  ["Look for ▶ ITEM ACTIVATED", "Your AI switches to the card's mode. Stars come when it checks your work."],
];

function Tooltip({ model }: { model: ItemPageModel }) {
  return (
    <section aria-label="Item stats" className={`${styles.tooltip} cutPanel`} data-kind={model.kind}>
      <div className={styles.tipHead}>
        <div className={styles.tipName}>{model.name}</div>
        <div className={styles.tipRarity}>{model.rarityLabel}</div>
      </div>
      <div className={styles.tipSub}>
        {ITEM_INFO[model.kind].title[0] + ITEM_INFO[model.kind].title.slice(1).toLowerCase()} item · Set {model.setNumber} · {model.setTitle}
      </div>
      <hr className={styles.rule} />
      <dl className={styles.stats}>
        {model.stats.map((s) => (
          <div key={s.label} className={styles.stat}>
            <dt>{s.label}</dt>
            <dd>{s.value}</dd>
          </div>
        ))}
      </dl>
      <hr className={styles.rule} />
      <div className={styles.plus}>+ Teaches: {ITEM_INFO[model.kind].description}</div>
      {model.stamps.map((s) => (
        <div key={s.code} className={styles.plus}>
          + Stamp: {s.label} {s.earned && <span className={styles.earned}>✓ earned</span>}
        </div>
      ))}
      <div className={styles.use}>
        <b>Use:</b> {model.use}
      </div>
    </section>
  );
}

function Peek({ state, id, textLength }: { state: AppState; id: ItemId; textLength: number }) {
  const [open, setOpen] = useState(false);
  const panelId = `peek-${id.replace(":", "-")}`;
  const peek = peekItem(state, id, textLength);
  return (
    <section aria-label="Peek inside" className={styles.peek}>
      <button type="button" className={`${styles.peekBtn} cut`} aria-expanded={open} aria-controls={panelId} onClick={() => setOpen(!open)}>
        PEEK INSIDE <span aria-hidden="true">{open ? "▴" : "▾"}</span>
      </button>
      <div id={panelId} className={styles.peekPanel} hidden={!open}>
        <h3 className={styles.peekHead}>TUNED FOR</h3>
        <dl className={styles.peekTuned}>
          {peek.tunedFor.map((t) => (
            <div key={t.label}>
              <dt>{t.label}</dt>
              <dd>{t.value}</dd>
            </div>
          ))}
        </dl>
        <p className={styles.peekLink}>
          <Link href="/start">Change in the questionnaire</Link>
        </p>
        {peek.sections.map((s) => (
          <div key={s.title} className={styles.peekFrame}>
            <h4 className={styles.peekHead}>
              <span aria-hidden="true">┌─ </span>
              {s.title}
              <span aria-hidden="true"> ─────</span>
            </h4>
            {s.lines.map((l) => (
              <div key={l} className={styles.peekLine}>
                <span aria-hidden="true">│ </span>
                {l}
              </div>
            ))}
            <div className={styles.peekHead} aria-hidden="true">
              └─────
            </div>
          </div>
        ))}
        {peek.styleDiff && (
          <div className={styles.peekDiff}>
            {(
              [
                ["MENTOR", peek.styleDiff.mentor, peek.styleDiff.straight],
                ["STRAIGHT TALK", peek.styleDiff.straight, peek.styleDiff.mentor],
              ] as const
            ).map(([title, mine, theirs]) => {
              // Highlight only when some lines are shared; otherwise every line differs and a mark says nothing.
              const someShared = mine.some((l) => theirs.includes(l));
              return (
                <div key={title} className={styles.peekCol}>
                  <h4 className={styles.peekHead}>{title}</h4>
                  <ul>
                    {mine.map((l) => (
                      <li key={l}>
                        {someShared && !theirs.includes(l) ? (
                          <mark className={styles.peekMark}>
                            <span aria-hidden="true">≠ </span>
                            {l}
                          </mark>
                        ) : (
                          l
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
        <p className={styles.peekFoot}>{peek.sizeKb.toFixed(1)} KB · packed so you aren&apos;t spoiled · Claude reads it, you don&apos;t have to</p>
      </div>
    </section>
  );
}

function OneItem({ id, state, text, first }: { id: ItemId; state: AppState; text: string | null; first: boolean }) {
  const model = itemPageModel(state, id);
  const flavor = itemSummary(state.profile, moduleOfItem(id), kindOf(id)).flavor;
  const Heading = first ? "h1" : "h2";
  const preId = `item-text-${id.replace(":", "-")}`;
  return (
    <section aria-label={itemLabel(id)} className={styles.page} data-kind={model.kind}>
      <div className={styles.stage}>
        <Link href="/collection" className={styles.back}>
          ◂ COLLECTION
        </Link>
        <div className={styles.stageKicker}>
          ■ {model.kind.toUpperCase()} ITEM · SET {model.setNumber} · NO. {model.position}
        </div>
        <div className={styles.art}>
          <div className={styles.glow} aria-hidden="true" />
          <div className={styles.artInner}>
            <ItemArt kind={model.kind} />
          </div>
        </div>
        <div className={styles.shadow} aria-hidden="true" />
        <Heading className={styles.name}>{model.name}</Heading>
        {model.lore && <p className={styles.lore}>“{model.lore}”</p>}
        {flavor && <p className={styles.flavor}>{flavor}</p>}
        <div className={styles.badges}>
          <span className={styles.rarity}>{model.rarityLabel}</span>
          {model.stars !== null && <Stars value={model.stars} size={18} showText />}
        </div>
      </div>

      <div className={styles.body}>
        <Tooltip model={model} />

        <section aria-label="How to use" className={styles.usage}>
          <div className="kicker">02 / How to use it</div>
          <ol className={styles.steps}>
            {STEPS.map(([t, d], i) => (
              <li key={t} className={`${styles.step} cutPanel`}>
                <span className={styles.stepNum}>{i + 1}</span>
                <strong>{t}</strong>
                <span className={styles.stepText}>{d}</span>
              </li>
            ))}
          </ol>
          {text === null ? (
            <p role="status">
              This set is part of <Link href="/pro">Premium</Link>, arriving at launch.
            </p>
          ) : (
            <div className={styles.actions}>
              <CopyButton text={text} selectTargetId={preId} label="COPY ITEM" className={`${styles.primary} cut`} />
              <Link className={`${styles.secondary} cut`} href="/console">
                OPEN IN CONSOLE
              </Link>
              <Link className={`${styles.ghost} cut`} href="/guide">
                USE IN YOUR OWN CLAUDE ↗
              </Link>
            </div>
          )}
          <p className="muted">{ITEM_INFO[model.kind].howTo}</p>
        </section>

        <div className={styles.lower}>
          {text !== null && <Peek state={state} id={id} textLength={text.length} />}
          <section aria-label="Quest log" className={styles.quest}>
            <div className="kicker">Quest log · {model.kind === "learn" ? "lessons inside" : model.kind === "test" ? "your test" : "your help"}</div>
            <ul className={styles.questList}>
              {model.quest.map((r) => (
                <li key={r.code} data-status={r.status}>
                  <span>
                    <span className="mono">{r.code}</span> &nbsp;{r.title}
                  </span>
                  <span className={styles.questState}>{r.status === "done" ? "✓ DONE" : r.status === "next" ? "▸ NEXT" : "LOCKED"}</span>
                </li>
              ))}
            </ul>
          </section>
          {text !== null && (
            <details className={styles.details}>
              <summary className="kicker">What you&apos;ll paste · the item as text</summary>
              <pre id={preId} className={styles.pre}>
                {text}
              </pre>
            </details>
          )}
        </div>
      </div>
    </section>
  );
}

function NoCard({ kind, state }: { kind: ItemKind; state: AppState }) {
  const { actions } = useAigo();
  const info = ITEM_INFO[kind];
  const available = collection(state).find((it) => it.kind === kind && it.status === "available");
  return (
    <section aria-label={`${info.title} card`} className={styles.empty}>
      <div className="kicker">No card yet</div>
      <h1>{info.title}</h1>
      <p>
        You have no {info.title} card yet. {available ? "Create it and it joins your collection." : <>It opens as you go: see the <Link href="/collection">collection</Link>.</>}
      </p>
      {available && (
        <button type="button" className={`${styles.primary} cut`} onClick={() => actions.createItem(available.id)}>
          Create {info.title} card
        </button>
      )}
    </section>
  );
}

export function ItemView({ kind }: { kind: ItemKind }) {
  const { state, itemText } = useAigo();

  if (!state) return <p>Loading…</p>;
  const ids = state.created.filter((id) => kindOf(id) === kind);

  return ids.length === 0 ? <NoCard kind={kind} state={state} /> : <>{ids.map((id, i) => <OneItem key={id} id={id} state={state} text={itemText(id)} first={i === 0} />)}</>;
}
