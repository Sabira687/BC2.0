import { useEffect, useState } from "react";
import { neighbourTip, starStatus, starTip, type SetSky, type SkyNeighbour } from "@/lib/sky";
import { LABEL, LINKS, POS, SKY_VIEWBOX } from "@/lib/skygeom";
import styles from "./Progress.module.css";

const DUST: [number, number, number][] = [[-190, 40, 1], [250, 30, 1.2], [600, 70, 1], [610, 200, 1.3], [-170, 300, 1], [380, 335, 1.2], [200, 320, 1], [520, 20, 1]];

function skyAria(sky: SetSky, neighbours: SkyNeighbour[]): string {
  const state = sky.complete ? "all 7 stars lit, constellation complete" : `${sky.lit} of ${sky.stars.length} stars lit; next: ${sky.next?.label}`;
  const side = neighbours.map((n) => `${n.name.toLowerCase()} ${n.sub.toLowerCase()}`).join("; ");
  return `Skill sky. The Clear Ask constellation: ${state}. Around it: ${side}.`;
}

const MINI: Record<SkyNeighbour["id"], [number, number][]> = {
  player_one: [[0, 40], [25, 0], [55, 20], [60, 60], [25, 70], [0, 40]],
  s02: [[0, 50], [30, 10], [65, 30], [45, 70], [0, 50]],
  s03: [[0, 30], [35, 0], [70, 35], [35, 65]],
  premium: [[0, 20], [20, 0], [45, 15], [60, 0]],
};
const TONE: Record<SkyNeighbour["tone"], string> = { lit: "#93C5FD", bright: "#93C5FD", dim: "#7C8BAA", gold: "#FCD34D" };

function Mini({ n, open, setOpen }: { n: SkyNeighbour; open: string | null; setOpen: (id: string | null) => void }) {
  const pts = MINI[n.id];
  const col = TONE[n.tone];
  const tip = neighbourTip(n);
  return (
    <button
      type="button"
      className={styles.miniBtn}
      aria-label={`${n.name} ${n.sub.toLowerCase()}. ${tip}`}
      onMouseEnter={() => setOpen(n.id)}
      onMouseLeave={() => setOpen(null)}
      onFocus={() => setOpen(n.id)}
      onBlur={() => setOpen(null)}
      onClick={() => setOpen(n.id)}
    >
    <svg viewBox="0 0 150 130" className={styles.mini} aria-hidden="true" data-neighbour={n.id}>
      {pts.slice(1).map((p, i) => (
        <line key={i} x1={pts[i]![0] + 40} y1={pts[i]![1] + 8} x2={p[0] + 40} y2={p[1] + 8} stroke={col} strokeOpacity=".5" strokeWidth="1" />
      ))}
      {pts.map((p, i) => (
        <circle key={i} cx={p[0] + 40} cy={p[1] + 8} r="3" fill={col} opacity=".85" />
      ))}
      <text x="75" y="102" textAnchor="middle" className={styles.miniName} fill={col}>{n.name}</text>
      <text x="75" y="119" textAnchor="middle" className={styles.miniSub} fill={col}>{n.sub}</text>
    </svg>
      {open === n.id && <span role="tooltip" className={styles.miniTip}>{tip}</span>}
    </button>
  );
}

export function SkySvg({ sky, neighbours }: { sky: SetSky; neighbours: SkyNeighbour[] }) {
  const lit = new Set(sky.stars.filter((s) => s.lit).map((s) => s.id));
  const gold = sky.complete;
  const col = gold ? "#FCD34D" : "#BAE6FD";
  const [open, setOpen] = useState<string | null>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);
  const openStar = sky.stars.find((s) => s.id === open);
  return (
    <div className={styles.skyStage}>
      {/* Narrow screens: the constellation is replaced by a plain vertical list of the same 7 stars (CSS swaps them). */}
      <ol className={styles.skyList} aria-label={skyAria(sky, neighbours)}>
        {sky.stars.map((s) => (
          <li key={s.id} className={styles.skyItem} data-lit={s.lit ? "true" : "false"} data-next={s.next ? "true" : "false"}>
            <span className={styles.skyDot} aria-hidden="true">{s.lit ? "★" : s.next ? "◎" : "☆"}</span>
            <span>{s.label}</span>
            <span className={styles.skyState}>{starStatus(s)}</span>
          </li>
        ))}
      </ol>
      <div className={styles.skyScroll}>
        <svg role="img" aria-label={skyAria(sky, neighbours)} viewBox={SKY_VIEWBOX.join(" ")} className={styles.skySvg}>
          {DUST.map(([x, y, r]) => (
            <circle key={`${x}-${y}`} className={styles.twinkle} cx={x} cy={y} r={r} fill="#fff" opacity=".45" />
          ))}
          {LINKS.map(([a, b]) => {
            const on = lit.has(a) && lit.has(b);
            return <line key={a + b} x1={POS[a][0]} y1={POS[a][1]} x2={POS[b][0]} y2={POS[b][1]} stroke={on ? "#BAE6FD" : "#3B4D74"} strokeWidth={on ? 2 : 1.2} strokeOpacity={on ? 0.85 : 0.7} />;
          })}
          {sky.stars.map((s) => {
            const [x, y] = POS[s.id];
            const l = LABEL[s.id];
            return (
              <g
                key={s.id}
                data-star={s.id}
                data-lit={s.lit ? "true" : "false"}
                className={styles.skyStar}
                role="button"
                tabIndex={0}
                aria-label={starTip(s)}
                onMouseEnter={() => setOpen(s.id)}
                onMouseLeave={() => setOpen(null)}
                onFocus={() => setOpen(s.id)}
                onBlur={() => setOpen(null)}
                onClick={() => setOpen(s.id)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpen(s.id); } }}
              >
                <circle cx={x} cy={y} r="22" fill="transparent" />
                {s.lit ? (
                  <>
                    <circle cx={x} cy={y} r="18" fill={col} opacity=".18" />
                    <circle cx={x} cy={y} r="7" fill="#fff" />
                    <path d={`M${x} ${y - 15} L${x + 1.2} ${y - 1.2} L${x + 15} ${y} L${x + 1.2} ${y + 1.2} L${x} ${y + 15} L${x - 1.2} ${y + 1.2} L${x - 15} ${y} L${x - 1.2} ${y - 1.2} Z`} fill={col} opacity=".9" />
                  </>
                ) : (
                  <circle cx={x} cy={y} r="5.5" fill="#0E1A33" stroke="#7C8BAA" strokeWidth="1.5" />
                )}
                {s.next && <circle data-next="true" cx={x} cy={y} r="16" fill="none" stroke="#6AF7FF" strokeWidth="1.5" strokeDasharray="3 4" />}
                <text x={x + l.dx} y={y + l.dy} textAnchor={l.anchor} className={styles.skyLabel} fill={s.lit ? "#E2E8F0" : s.next ? "#6AF7FF" : "#9FB0CF"}>
                  {s.label}
                  {s.lit ? " ✓" : s.next ? " · NEXT" : ""}
                </text>
              </g>
            );
          })}
          {openStar && (() => {
            const [x, y] = POS[openStar.id];
            const text = starTip(openStar);
            const w = text.length * 9.5 + 20;
            const cx = Math.min(Math.max(x, SKY_VIEWBOX[0] + w / 2 + 4), SKY_VIEWBOX[0] + SKY_VIEWBOX[2] - w / 2 - 4);
            const ty = y < 90 ? y + 30 : y - 54;
            return (
              <g className={styles.skyTip} pointerEvents="none" aria-hidden="true">
                <rect x={cx - w / 2} y={ty} width={w} height="26" rx="4" fill="#050611" stroke="#6AF7FF" strokeOpacity=".7" />
                <text x={cx} y={ty + 17.5} textAnchor="middle" className={styles.skyLabel} fill="#E2E8F0">{text}</text>
              </g>
            );
          })()}
        </svg>
      </div>
      <div className={styles.minis}>
        {neighbours.map((n) => (
          <Mini key={n.id} n={n} open={open} setOpen={setOpen} />
        ))}
      </div>
    </div>
  );
}
