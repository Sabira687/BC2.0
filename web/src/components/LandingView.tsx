"use client";
/** Landing page (approved canvas v4.1, dark "v3" look): hero + quick-demo strip, idea, items, path, benefits, kept/left, plans, roadmap, footer. */
import Link from "next/link";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { Card } from "@/components/ui";
import { HELP_ITEM, ITEMS } from "@/lib/content";
import {
  BENEFITS, FREE_TICKET, ITEM_PANELS, QUICK_DEMO_STEPS, KEPT, LEFT_BEHIND, PATH_STOPS, PREMIUM_TICKET, ROADMAP,
} from "@/lib/marketing";
import styles from "./Landing.module.css";

const TRAIL_COLORS = ["#6AF7FF", "#FF8AD9", "#EEF2FF", "#00FFD1"];
const MAX_TRAIL = 16;

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(true); // assume reduced until we know (no motion before hydration)
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const on = () => setReduced(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}

interface Dot { id: number; x: number; y: number; c: string }

function Hero({ reduced }: { reduced: boolean }) {
  const [trail, setTrail] = useState<Dot[]>([]);
  const seq = useRef(0);

  useEffect(() => {
    if (reduced || trail.length === 0) return;
    const t = setTimeout(() => setTrail((d) => d.slice(1)), 60);
    return () => clearTimeout(t);
  }, [trail, reduced]);

  function onMove(e: MouseEvent<HTMLElement>) {
    if (reduced) return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = Math.round(e.clientX - r.left);
    const y = Math.round(e.clientY - r.top);
    setTrail((d) => {
      const last = d[d.length - 1];
      if (last && Math.abs(last.x - x) + Math.abs(last.y - y) < 14) return d;
      seq.current += 1;
      return [...d, { id: seq.current, x, y, c: TRAIL_COLORS[seq.current % 4]! }].slice(-MAX_TRAIL);
    });
  }

  return (
    <section className={styles.hero} onMouseMove={onMove}>
      {trail.map((d, i) => (
        <span
          key={d.id}
          aria-hidden="true"
          className={styles.trail}
          style={{ left: d.x, top: d.y, width: 3 + Math.round(i / 3), height: 3 + Math.round(i / 3), background: d.c, opacity: (i + 1) / trail.length }}
        />
      ))}
      <header className={styles.topbar}>
        <Link href="/" className="wordmark" aria-label="AIGO Collection home">
          <span className="wordmarkMain">AIGO</span>
          <span className="wordmarkSub">COLLECTION</span>
        </Link>
        <nav aria-label="Sections" className={styles.anchors}>
          <a href="#idea">Idea</a><a href="#items">Items</a><a href="#path">Path</a><a href="#plans">Plans</a><a href="#roadmap">Roadmap</a>
          <Link href="/collection" className={styles.openApp}>Open app ▸</Link>
        </nav>
      </header>
      <div className={styles.heroBody}>
        <div className={styles.kicker}>&gt; COLLECTIBLE CARDS FOR YOUR AI<span className={styles.blink}>_</span></div>
        <h1 className={styles.display}>
          <span className={styles.glitch} data-text="Collect.">Collect.</span>
          <br />
          <span className={styles.outline}>Learn.</span>
          <br />
          <span className={styles.blue}>Level up.</span>
        </h1>
        <div className={styles.heroCta}>
          <Link href="/start" className={styles.cta}>Start your collection ▸</Link>
          <p>
            Every card in your collection is a digital item with its own story and use. Paste it into your AI and it adapts to you.
            Earn stars and stamps to unlock new cards and grow your collection.
          </p>
        </div>
      </div>
      <div className={styles.quickDemo}>
        <Link href="/collection" className={styles.quickDemoHead}>
          QUICK DEMO · 3 MIN ▸<br />
          <span>sample player John is ready</span>
        </Link>
        {QUICK_DEMO_STEPS.map((s, i) => (
          <div key={s} className={styles.quickDemoStep}>
            <span>{String(i + 1).padStart(2, "0")}</span> {s}
          </div>
        ))}
      </div>
      <a href="#idea" className={styles.more}>
        LEARN MORE <span className={styles.chev} aria-hidden="true" />
      </a>
    </section>
  );
}

function Items() {
  const [i, setI] = useState(0);
  const p = ITEM_PANELS[i]!;
  const card = (n: number) => {
    const pick = () => setI(n);
    const cls = `${styles.itemBtn} ${styles.float}`;
    const style = { animationDelay: `${n * 0.6}s`, opacity: i === n ? 1 : n > 2 ? 0.55 : 0.75, outlineColor: i === n ? p.accent : "transparent" };
    const common = { onMouseEnter: pick, onFocus: pick, onClick: pick, className: cls, style, "aria-label": `Inspect item ${n + 1}` };
    if (n === 0) return <button key={n} type="button" {...common}><Card kind="learn" title={ITEMS.m1!.learn.name} overline="THE CLEAR ASK" rarity="common" art flavor="Ask once." stars={0} setLabel="S01 · 1/3" properties="Learn · 3 lessons" size={128} /></button>;
    if (n === 1) return <button key={n} type="button" {...common}><Card kind="test" title={ITEMS.m1!.test.name} overline="THE CLEAR ASK" rarity="common" art flavor="Prove it." stars={0} setLabel="S01 · 2/3" properties="Test · 5 tasks" size={128} /></button>;
    if (n === 2) return <button key={n} type="button" {...common}><Card kind="help" title={HELP_ITEM.name} overline="THE CLEAR ASK" rarity="common" art flavor="One move." setLabel="S01 · 3/3" properties="Help · ~1 min" size={128} /></button>;
    return <button key={n} type="button" {...common}><Card kind="locked" state="closed" setLabel={n === 3 ? "S05" : "S12"} rarity={n === 3 ? "rare" : "legendary"} size={108} /></button>;
  };
  return (
    <section id="items" className={styles.items}>
      <div className={styles.inner}>
        <div className={styles.itemsText}>
          <div className={`${styles.eyebrow} ${styles.pink}`}>02 / THE VAULT</div>
          <h2 className={styles.h2}>Every item<br /><span className={styles.holoText}>has a story.</span></h2>
          <p className={styles.lead}>
            Each card is a unique item that helps you gain a new skill and real experience. Cards differ in rarity and come in sets.
            Inside are hidden instructions your AI reads to adapt to you.
          </p>
          <div className={styles.panel} style={{ borderColor: p.accent }} aria-live="polite">
            <div className={styles.panelTag} style={{ color: p.accent }}>{p.tag}</div>
            <div className={styles.panelName}>{p.name}</div>
            <div className={styles.panelLore}>{p.lore}</div>
            <div className={styles.panelTeach}>{p.teach}</div>
          </div>
          <div className={styles.hint}>HOVER AN ITEM TO INSPECT IT</div>
        </div>
        <div className={styles.podium}>
          <div className={styles.podiumGlow} aria-hidden="true" />
          <div className={styles.podiumCards}>{[0, 1, 2, 3, 4].map(card)}</div>
          <div className={styles.podiumTop} aria-hidden="true" />
          <div className={styles.podiumBase} aria-hidden="true" />
          <div className={styles.podiumLabel} aria-hidden="true">AIGO · SET 01 · THE CLEAR ASK</div>
        </div>
      </div>
    </section>
  );
}

const PATH_CURVE = "M120 320 C 200 320, 235 130, 315 130 S 420 300, 500 300 S 605 140, 685 140 S 800 260, 880 260";

function PathSection({ reduced }: { reduced: boolean }) {
  const [stop, setStop] = useState(0);
  const [lock, setLock] = useState(false);
  useEffect(() => {
    if (reduced || lock) return;
    const t = setInterval(() => setStop((s) => (s + 1) % PATH_STOPS.length), 2400);
    return () => clearInterval(t);
  }, [reduced, lock]);
  // Smooth cubic curve from the canvas generator; it passes through every stop in PATH_STOPS.
  const d = PATH_CURVE;
  return (
    <section id="path" className={styles.path}>
      <div className={styles.inner2}>
        <div className={styles.pathHead}>
          <div>
            <div className={`${styles.eyebrow} ${styles.mint}`}>03 / THE PATH</div>
            <h2 className={styles.h2}>How the AI<br />teaches you</h2>
          </div>
          <span className={styles.hint}>HOVER A POINT ON THE PATH</span>
        </div>
        <div className={styles.pathScroll}>
          <div className={styles.pathBox} onMouseLeave={() => setLock(false)}>
            <svg viewBox="0 0 1000 440" className={styles.pathSvg} aria-hidden="true" preserveAspectRatio="none">
              <path d={d} className={styles.pathBase} fill="none" />
              <path d={d} pathLength={100} className={styles.pathFill} fill="none" strokeDasharray={`${stop * 25} 100`} />
              <path d={d} className={styles.pathLine} fill="none" />
            </svg>
            {PATH_STOPS.map((s, i) => {
              const on = stop === i;
              const below = s.y < 220;
              const pick = () => { setStop(i); setLock(true); };
              return (
                <div key={s.n}>
                  <div className={styles.stop} style={{ left: `${s.x / 10}%`, top: `${s.y / 4.4}%` }}>
                    <button type="button" aria-label={s.title} aria-pressed={on} className={`${styles.dot} ${on ? styles.dotOn : ""}`} onMouseEnter={pick} onFocus={pick} onClick={pick}>
                      {s.n}
                    </button>
                  </div>
                  <div className={`${styles.stopBox} ${on ? styles.stopBoxOn : ""}`} role="group" tabIndex={0} aria-label={`Step ${s.n}: ${s.title}`} aria-current={on ? "step" : undefined} onMouseEnter={pick} onFocus={pick} style={{ left: `${s.x / 10}%`, top: `${(below ? s.y + 40 : s.y - 180) / 4.4}%` }}>
                    <div className={styles.stopTitle}>{s.title}</div>
                    <div className={on ? styles.stopText : styles.stopHidden}>{on ? s.text : "▒▒▒▒▒▒▒▒ ▒▒▒▒▒ ▒▒▒▒▒▒▒"}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function Ticket({ name, big, per, items, tag, accent, rot, holo }: {
  name: string; big: string; per: string; items: readonly { bold?: string; text: string }[]; tag: string; accent: string; rot: number; holo?: boolean;
}) {
  return (
    <div className={styles.ticketWrap} style={{ transform: `rotate(${rot}deg)` }}>
      <div className={styles.ticketShadow} style={{ borderColor: accent }} aria-hidden="true" />
      <div className={styles.ticket}>
        <div className={`${styles.stripe} ${holo ? styles.holoBar : ""}`} style={holo ? undefined : { background: accent }} aria-hidden="true" />
        <div className={styles.ticketMain}>
          <div className={styles.ticketName}>{name}</div>
          <div className={styles.ticketPrice}><span>{big}</span><em>{per}</em></div>
          <ul>
            {items.map((it) => (
              <li key={it.text}>▸ {it.bold && <b>{it.bold}</b>} {it.text}</li>
            ))}
          </ul>
        </div>
        <div className={styles.ticketTag}><span>{tag}</span></div>
      </div>
    </div>
  );
}

export function LandingView() {
  const reduced = usePrefersReducedMotion();
  return (
    <div className={styles.landing} data-reduced={reduced ? "true" : "false"}>
      <Hero reduced={reduced} />

      <section id="idea" className={styles.idea}>
        <div className={styles.ideaInner}>
          <div aria-hidden="true" className={styles.bigNum}>01</div>
          <div className={styles.ideaText}>
            <div className={styles.eyebrowDark}>THE IDEA</div>
            <h2 className={styles.h2}>The best teacher<br />for the AI is the AI.</h2>
            <p className={styles.built}>BUILT FOR: people who know AI matters and don&apos;t know where to start. Start with the AI itself.</p>
            <p className={styles.ideaP}>
              AIGO is a collection of digital items. Each card has a story and a power: the Key teaches, the Lock tests, the Compass helps you mid-task.
              Paste a card into your AI and it teaches you a new skill on your real work. Earn stars and stamps to unlock the next cards, collect the set,
              keep every card.
            </p>
          </div>
        </div>
      </section>

      <Items />
      <PathSection reduced={reduced} />

      <section className={styles.terminalSec}>
        <div className={styles.inner}>
          <div className={styles.termHead}>
            <div className={`${styles.eyebrow} ${styles.green}`}>04 / WHAT YOU GET</div>
            <h2 className={styles.h2}>Not a course.<br /><span className={styles.green}>A skill you can show.</span></h2>
          </div>
          <div className={styles.terminal}>
            <div className={styles.termBar}><span>john@aigo:~</span><span>[ ■ ▲ ● ]</span></div>
            <div className={styles.termBody}>
              <div><span className={styles.green}>$</span> aigo --benefits</div>
              {BENEFITS.map((b) => (
                <div key={b}><span className={styles.green}>[+]</span> {b}</div>
              ))}
              <div><span className={styles.green}>$</span> <span className={`${styles.cursor} ${styles.blink}`} /></div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.kept}>
        <div className={styles.inner2}>
          <div className={`${styles.eyebrow} ${styles.pink}`}>05 / THE GOOD PARTS ONLY</div>
          <h2 className={styles.h2}>We kept the magic.<br /><span className={styles.pink}>We left the guilt.</span></h2>
          <p className={styles.keptLead}>
            AIGO uses a few game mechanics that make collecting feel good — and leaves out the ones that make you feel guilty.
          </p>
          <div className={styles.keptRow}>
            <div className={styles.keptGrid}>
              {KEPT.map((k) => (
                <div key={k.name} className={styles.keptCell}>
                  <div className={styles.keptFrom}>KEPT</div>
                  <div className={styles.keptName}>{k.name}</div>
                  <div>{k.text}</div>
                </div>
              ))}
            </div>
            <div className={styles.left}>
              <div className={styles.keptFrom} style={{ color: "#9e7a97" }}>LEFT BEHIND</div>
              <ul>{LEFT_BEHIND.map((l) => <li key={l}>{l}</li>)}</ul>
            </div>
          </div>
        </div>
      </section>

      <section id="plans" className={styles.plans}>
        <div className={styles.inner2}>
          <div className={styles.plansHead}>
            <div>
              <div className={`${styles.eyebrow} ${styles.cyan}`}>06 / PLANS</div>
              <h2 className={styles.h2}>Start free.<br />Go further for less than a lunch.</h2>
            </div>
            <div className={styles.demoBox}>
              <span>IN THIS DEMO</span>
              <br />
              Set 01 of the Free plan: 3 cards, the AIGO lesson, Work chat, stars, stamps and result codes. Premium checkout runs in test mode. The live AI in this demo console runs on our API key — for the demo only. In the real app, lessons run on your own AI.
            </div>
          </div>
          <div className={styles.tickets}>
            <Ticket name="AIGO · FREE" big="$0" per="/ FOREVER" items={FREE_TICKET} tag="FREE FOREVER" accent="#3B82FF" rot={1.2} />
            <Ticket name="AIGO · PREMIUM" big="$7" per="/ MONTH" items={PREMIUM_TICKET} tag="CANCEL ANYTIME" accent="#FF8AD9" rot={-1.6} holo />
          </div>
          <div className={styles.planCta}>
            <Link href="/start" className={styles.ctaSm}>Start free ▸</Link>
            <Link href="/pro" className={styles.ghost}>SEE PREMIUM</Link>
          </div>
        </div>
      </section>

      <section id="roadmap" className={styles.roadmap}>
        <div className={styles.inner2}>
          <div className={`${styles.eyebrow} ${styles.cyan}`}>07 / ROADMAP</div>
          <h2 className={styles.h2}>Big plan.<br /><span className={styles.blue}>Real parts.</span></h2>
          <p className={styles.keptLead}>The demo is the core of the whole product, working today. Everything after it reuses the same parts.</p>
          <p className={styles.keptLead}>The live AI in this demo console runs on our API key — for the demo only. In the real app, lessons run on your own AI.</p>
          <div className={styles.roadGrid}>
            {ROADMAP.map((c) => (
              <div key={c.tag} className={styles.roadCol}>
                <div className={styles.roadTag}><span className={styles.diamond} style={{ background: c.color }} aria-hidden="true" /><span style={{ color: c.color }}>{c.tag}</span></div>
                <div className={styles.roadTitle}>{c.title}</div>
                <ul>{c.items.map((it) => <li key={it}>▸ {it}</li>)}</ul>
                <div className={styles.why}><span style={{ color: c.color }}>WHY IT&apos;S REAL ·</span> {c.why}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.outro}>
        <div className={styles.inner2}>
          <div className={styles.outroRow}>
            <h2 className={styles.huge}>It&apos;s not<br /><span className={styles.blue}>too late.</span></h2>
            <Link href="/start" className={styles.cta}>Start your collection ▸</Link>
          </div>
          <div className={styles.foot}>AIGO COLLECTION · 2026 · TEAM SKaiCode · YOUR CARDS WAIT FOR YOU</div>
        </div>
      </section>
    </div>
  );
}
