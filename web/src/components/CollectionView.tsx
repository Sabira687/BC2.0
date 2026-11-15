"use client";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAigo } from "@/lib/client/useAigo";
import { albumOf, type AlbumCard, type AlbumSet } from "@/lib/album";
import { CATALOG_COUNTS, RARITY_META, findCatalogSet, type CatalogSet } from "@/lib/content";
import { collectionLayout, fullAlbum, parseAlbumQuery, queryAlbum, serializeAlbumQuery, type AlbumBy, type AlbumGroup, type AlbumQuery } from "@/lib/albumQuery";
import { cardFace, nextStep } from "@/lib/nextstep";
import { kindOf, setBadgeSteps } from "@/lib/progress";
import type { AppState, ItemId } from "@/lib/types";
import { Card } from "@/components/ui";
import { formatNext, loadSchedule, startReminder, type Schedule } from "@/lib/schedule";
import { RevealOverlay, type RevealCard } from "./RevealOverlay";
import { PageFooter } from "./PageFooter";
import styles from "./CollectionView.module.css";

const KIND_NAME = { learn: "LEARN", test: "TEST", help: "HELP" } as const;
const MINI = 100;

function faceOf(card: AlbumCard, set: AlbumSet) {
  return cardFace(card, set);
}

function MiniPocket({ card, set, fresh, onCreate, hideCreate = false }: { card: AlbumCard & { set?: string }; set?: AlbumSet; fresh: boolean; onCreate: (c: AlbumCard) => void; hideCreate?: boolean }) {
  const kindName = KIND_NAME[card.kind];
  if (card.locked || !set) {
    return (
      <div className={styles.pocket} data-status="locked" data-locked="true" title={card.rarity === "legendary" ? "Premium" : "Free · comes after the demo"}>
        <div className={styles.slot}>
          <Card kind="locked" state="closed" setLabel={`S${card.set ?? ""}`} rarity={card.rarity} size={MINI} />
        </div>
        <div className={styles.cap}>{kindName}</div>
      </div>
    );
  }
  const face = faceOf(card, set);
  let body;
  if (card.status === "created") {
    body = (
      <Link
        href={`/item/${card.kind}`}
        className={`lift ${styles.cardLink}`}
        aria-label={`Open ${card.name}, ${kindName} card${card.stars !== null ? `, ${card.stars} of 3 stars` : ""}`}
        data-card-link={card.id}
      >
        <Card {...face} state={fresh ? "new" : card.holo ? "holo" : "normal"} size={MINI} />
      </Link>
    );
  } else if (card.status === "available") {
    body = (
      <div className={styles.empty} style={{ ["--type" as string]: `var(--${card.kind})` }}>
        <div className={styles.emptyShape} aria-hidden="true" />
        {hideCreate ? (
          <div className={styles.emptyText}>Opens with the set</div>
        ) : (
          <button type="button" className={styles.createBtn} aria-label={`Create ${kindName} card`} onClick={() => onCreate(card)}>
            Create
          </button>
        )}
      </div>
    );
  } else {
    body = (
      <div className={styles.empty} title={card.reason ?? "You'll see it later"}>
        <div className={styles.emptyShape} aria-hidden="true" />
        <div className={styles.emptyText}>Later</div>
      </div>
    );
  }
  return (
    <div className={styles.pocket} data-holo={card.holo ? "true" : undefined} data-status={card.status}>
      <div className={styles.slot}>{body}</div>
      <div className={styles.cap}>{card.kind === "help" ? "HELP" : `${kindName}${card.stars !== null ? ` ${"★".repeat(card.stars)}${"☆".repeat(3 - card.stars)}` : ""}`}</div>
    </div>
  );
}

function OpenTile({ set, cards, fresh, onCreate, onOpen }: { set: AlbumSet; cards: AlbumCard[]; fresh: ItemId | null; onCreate: (c: AlbumCard) => void; onOpen: () => void }) {
  const { state } = useAigo();
  if (!state) return null;
  const badge = setBadgeSteps(state, set.module);
  const created = set.cards.filter((c) => c.status === "created").length;
  const stepNames = ["Learn ★★★", "Test ★★+", "Help used"];
  const meta = RARITY_META[set.rarity];
  return (
    <section className={`${styles.tile} ${styles.tileOwned} cutPanel`} aria-label={`Set ${set.number}: ${set.title}`} data-set-state={set.state}>
      <div className={styles.tileHead}>
        <div>
          <div className={styles.setKick} style={{ color: meta.color }}>
            SET {set.number} · {meta.symbol} {meta.label}
          </div>
          <h2 className={styles.tileTitle}>{set.title}</h2>
        </div>
        <div className={`${styles.status} ${created === set.cards.length ? styles.statusDone : ""}`}>
          {set.counter}
          {created === set.cards.length ? " ✓" : ""}
        </div>
      </div>
      {created === 0 && set.cards.some((c) => c.status === "available") && (
        <div className={styles.openRow}>
          <button type="button" className={`${styles.btn} cut`} onClick={onOpen}>
            OPEN SET {set.number} ▸
          </button>
          <span className={styles.openNote}>3 items made for you</span>
        </div>
      )}
      <div className={styles.row}>
        {cards.map((c) => (
          <MiniPocket key={c.id} card={c} set={set} fresh={fresh === c.id} onCreate={onCreate} hideCreate={created === 0} />
        ))}
      </div>
      <div className={styles.foot}>
        <span>
          BADGE · {badge.done} OF {badge.total} STEPS
        </span>
        <span className={styles.footSteps}>
          {stepNames.map((n, i) => (
            <span key={n}>
              {badge.steps[i] ? "✓" : "○"} {n}
            </span>
          ))}
        </span>
      </div>
      <div className={styles.footNote}>{set.badge.earned ? (set.badge.holo ? "SET COMPLETE · HOLOGRAPHIC" : "SET COMPLETE") : "★★★ ON THE TEST MAKES THIS SET HOLOGRAPHIC"}</div>
    </section>
  );
}

function LockedTile({ cs, cards }: { cs: CatalogSet; cards: AlbumGroup["cards"] }) {
  const premium = cs.tier === "premium";
  const meta = RARITY_META[cs.rarity];
  return (
    <section className={`${styles.tile} ${premium ? styles.tilePremium : ""} cutPanel`} aria-label={`Set ${cs.number}: ${cs.title}, locked`} data-set-state="locked">
      <div className={styles.tileHead}>
        <div>
          <div className={styles.setKick} style={{ color: meta.color }}>
            SET {cs.number} · {meta.symbol} {meta.label}
          </div>
          <h2 className={styles.tileTitle}>{cs.title}</h2>
        </div>
        <div className={styles.status}>0 / 3</div>
      </div>
      <div className={styles.row}>
        {cards.map((c) => (
          <MiniPocket key={c.id} card={c} fresh={false} onCreate={() => {}} />
        ))}
      </div>
      <div className={styles.foot}>
        <span>{premium ? `PREMIUM · ${(cs.path ?? "").toUpperCase()} PATH` : "FREE · COMES AFTER THE DEMO"}</span>
      </div>
    </section>
  );
}

function SortBar({ q, onChange }: { q: AlbumQuery; onChange: (q: AlbumQuery) => void }) {
  const seg = (on: boolean) => (on ? styles.segOn : styles.segOff);
  const by: [AlbumBy, string][] = [
    ["set", "SET"],
    ["skill", "SKILL"],
    ["rarity", "RARITY"],
  ];
  const types: [AlbumQuery["type"], string][] = [
    ["all", "ALL"],
    ["learn", "■ LEARN"],
    ["test", "▲ TEST"],
    ["help", "● HELP"],
  ];
  return (
    <div role="toolbar" aria-label="Sort and filter" className={styles.toolbar}>
      <span id="tb-by" className={styles.tbLabel}>SORT BY</span>
      <div className={styles.seg} role="group" aria-labelledby="tb-by">
        {by.map(([v, label]) => (
          <button key={v} type="button" className={seg(q.by === v)} aria-pressed={q.by === v} onClick={() => onChange({ ...q, by: v })}>
            {label}
          </button>
        ))}
      </div>
      <span id="tb-type" className={styles.tbLabel}>TYPE</span>
      <div className={styles.seg} role="group" aria-labelledby="tb-type">
        {types.map(([v, label]) => (
          <button key={v} type="button" className={seg(q.type === v)} aria-pressed={q.type === v} onClick={() => onChange({ ...q, type: v })}>
            {label}
          </button>
        ))}
      </div>
      <span id="tb-locked" className={styles.tbLabel}>SHOW LOCKED</span>
      <div className={styles.seg} role="group" aria-labelledby="tb-locked">
        <button type="button" className={seg(q.showLocked)} aria-pressed={q.showLocked} onClick={() => onChange({ ...q, showLocked: true })}>
          ON
        </button>
        <button type="button" className={seg(!q.showLocked)} aria-pressed={!q.showLocked} onClick={() => onChange({ ...q, showLocked: false })}>
          OFF
        </button>
      </div>
    </div>
  );
}

export function CollectionView() {
  const { state, actions } = useAigo();
  const [reveal, setReveal] = useState<{ cards: RevealCard[]; focusId: ItemId } | null>(null);
  /** Pre-open snapshot: counter, segments and next step keep these numbers while the reveal plays. */
  const [held, setHeld] = useState<AppState | null>(null);
  const [fresh, setFresh] = useState<ItemId | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const query = useMemo(() => parseAlbumQuery(new URLSearchParams(params.toString())), [params]);
  const setQuery = (next: AlbumQuery) => {
    const qs = serializeAlbumQuery(next);
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const [schedule, setSchedule] = useState<Schedule | null>(null);
  useEffect(() => {
    const s = loadSchedule();
    setSchedule(s);
    return startReminder(s);
  }, []);

  useEffect(() => {
    actions.viewCollection();
  }, [actions]);

  const sets = useMemo(() => (state ? albumOf(state) : []), [state]);
  const shown = held ?? state;
  const step = useMemo(() => (shown ? nextStep(shown) : null), [shown]);

  if (!state) return <p>Loading…</p>;

  const owned = shown!.created.length;
  const stampCount = shown!.stamps.length;
  const badges = (held ? albumOf(held) : sets).filter((x) => x.badge.earned).length;
  const firstCreated = state.created[0] ? kindOf(state.created[0]) : null;
  const albumByNumber = new Map(sets.map((x) => [x.number, x]));

  const groups = queryAlbum(fullAlbum(state), query);
  const layout = collectionLayout(groups, query);

  function tileOf(g: AlbumGroup) {
    const cs = findCatalogSet(g.key);
    if (!cs) return null;
    const album = albumByNumber.get(cs.number);
    if (album && album.state === "open") return <OpenTile key={cs.number} set={album} cards={g.cards} fresh={fresh} onCreate={(c) => create(c, album)} onOpen={() => open(album)} />;
    return <LockedTile key={cs.number} cs={cs} cards={g.cards} />;
  }

  function create(card: AlbumCard, set: AlbumSet) {
    actions.createItem(card.id);
    setFresh(card.id);
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setHeld(state);
    setReveal({ cards: [{ kind: card.kind, face: faceOf(card, set) }], focusId: card.id });
  }

  /** One action opens the whole set; the reveal plays its cards in order (Key, Lock, Compass). */
  function open(set: AlbumSet) {
    const made = set.cards.filter((c) => c.status === "available");
    if (made.length === 0) return;
    actions.openSet(set.module);
    setFresh(made[made.length - 1]!.id);
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setHeld(state);
    setReveal({ cards: made.map((c) => ({ kind: c.kind, face: faceOf(c, set) })), focusId: made[0]!.id });
  }

  return (
    <>
      <section className={styles.hero}>
        <div>
          <div className="kicker">01 / COLLECTION · {state.profile.name}</div>
          <h1 className={styles.h1}>Your collection</h1>
          <p className={styles.lead}>Every item teaches one way to work with AI. Collect a set to earn its badge. Nothing expires.</p>
          {state.demo.fastForwarded && (
            <p className="muted">
              DEMO · fast-forwarded — <Link href="/progress">Back to now on Progress</Link>
            </p>
          )}
        </div>
        <div className={`${styles.counter} cutPanel`} role="group" aria-label="Collection counter">
          <div className={styles.counterTop}>
            <div>
              <div className={styles.counterLabel}>ITEMS COLLECTED</div>
              <div className={styles.counterNum}>
                <span className={styles.counterLit}>{owned}</span>
                <span className={styles.counterDim}> / {CATALOG_COUNTS.total}</span>
              </div>
            </div>
            <div className={styles.counterSide}>
              <div>
                <div className={styles.sideNum}>
                  {stampCount}
                  <span>/13</span>
                </div>
                STAMPS
              </div>
              <div>
                <div className={styles.sideNum}>
                  {badges}
                  <span>/15</span>
                </div>
                SET BADGES
              </div>
            </div>
          </div>
          <div className={styles.segments} role="progressbar" aria-label="Items collected" aria-valuemin={0} aria-valuemax={CATALOG_COUNTS.total} aria-valuenow={owned}>
            {Array.from({ length: CATALOG_COUNTS.total }, (_, i) => (
              <span key={i} className={i < owned ? styles.segLit : i < CATALOG_COUNTS.free ? styles.segFree : styles.segPrem} />
            ))}
          </div>
          <div className={styles.counterFoot}>
            <span>{CATALOG_COUNTS.free} FREE ITEMS</span>
            <span className={styles.gold}>{CATALOG_COUNTS.premium} PREMIUM ITEMS</span>
          </div>
        </div>
      </section>

      {step && (
        <section className={styles.next} aria-label="Next step">
          <div className={styles.nextText}>
            <div className={styles.nextKick}>NEXT STEP</div>
            <div className={styles.nextTitle}>{step.title}</div>
            <p className="muted">{step.text}</p>
            {schedule && <p className="muted">{formatNext(schedule, new Date())}</p>}
          </div>
          {step.openSet ? (
            <div className={styles.openRow}>
              <button
                type="button"
                className={`${styles.btn} cut`}
                onClick={() => {
                  const set = sets.find((x) => x.module === step.openSet);
                  if (set) open(set);
                }}
              >
                {step.cta} ▸
              </button>
              {step.note && <span className={styles.openNote}>{step.note}</span>}
            </div>
          ) : step.create ? (
            <button
              type="button"
              className={`${styles.btn} cut`}
              onClick={() => {
                const set = sets.find((x) => x.cards.some((c) => c.id === step.create));
                const card = set?.cards.find((c) => c.id === step.create);
                if (set && card) create(card, set);
              }}
            >
              {step.cta} ▸
            </button>
          ) : (
            <Link className={`${styles.btn} cut`} href={step.href}>
              {step.cta} ▸
            </Link>
          )}
          {firstCreated && (
            <Link className={`${styles.btnGhost} cut`} href={`/item/${firstCreated}`}>
              Take your cards to Claude
            </Link>
          )}
        </section>
      )}

      <SortBar q={query} onChange={setQuery} />

      {layout.mode === "flat" ? (
        layout.groups.length === 0 ? (
          <p className="muted">No cards match this filter.</p>
        ) : (
          layout.groups.map((g) => (
            <section key={g.key} className={styles.flatGroup} aria-label={g.title} data-group={g.key}>
              <div className={styles.band}>
                <h2 className={styles.bandTitle}>{g.title}</h2>
                <div className={styles.bandNote}>{g.cards.length} {g.cards.length === 1 ? "CARD" : "CARDS"}</div>
              </div>
              <div className={styles.flatRow}>
                {g.cards.map((c) => {
                  const album = albumByNumber.get(c.set);
                  return <MiniPocket key={c.id} card={c} set={album} fresh={fresh === c.id} onCreate={(card) => album && create(card, album)} />;
                })}
              </div>
            </section>
          ))
        )
      ) : (
        <>
          <div className={styles.band}>
            <h2 className={styles.bandTitle}>
              Core path <span className={styles.free}>· free</span>
            </h2>
            <div className={styles.bandNote}>SETS 01–07 · {CATALOG_COUNTS.free} ITEMS · THIS DEMO OPENS SET 01</div>
          </div>
          <div className={styles.grid}>{layout.free.map(tileOf)}</div>

          {layout.premium.length > 0 && (
            <>
              <div className={styles.band}>
                <h2 className={styles.bandTitle}>
                  Premium paths <span className={styles.gold}>· ★ legendary</span>
                </h2>
                <Link href="/pro" className={styles.bandLink}>
                  SETS 08–15 · {CATALOG_COUNTS.premium} ITEMS · SEE PREMIUM ▸
                </Link>
              </div>
              <div className={styles.grid}>{layout.premium.map(tileOf)}</div>
            </>
          )}
        </>
      )}

      <PageFooter meta="MORE KINDS OF ITEMS ARE ON THE WAY · YOUR ITEMS WAIT FOR YOU">
        <Link href="/progress">Your progress</Link>
        <Link href="/pro">See Premium</Link>
      </PageFooter>

      {reveal && (
        <RevealOverlay
          cards={reveal.cards}
          onDone={() => {
            const id = reveal.focusId;
            setReveal(null);
            setHeld(null);
            // Restore focus to the new card's pocket link once it is rendered.
            setTimeout(() => document.querySelector<HTMLElement>(`[data-card-link="${id}"]`)?.focus(), 0);
          }}
        />
      )}
    </>
  );
}
