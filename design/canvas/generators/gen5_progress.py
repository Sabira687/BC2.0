"""v5 progress: a Skyrim-style skill sky (each set is a constellation, each star a proven step)
and a museum-ticket stamp passport (one grid, outline color = difficulty)."""
import sys
sys.path.insert(0, sys.argv[1])
from gen4_common import *

# ---------- skill sky ----------
OX, OY = 300, 20
PERKS = [("p1", 0, 150, "1.1 The brief formula"), ("p2", 90, 60, "1.2 Ask for the shape"), ("p3", 180, 150, "1.3 Give it the material"),
         ("p4", 90, 240, "Final task"), ("p5", 300, 240, "Proving Lock · test"), ("p6", 480, 240, "Pocket Compass · help"), ("p7", 480, 320, "Set badge")]
LINKS = [("p1", "p2"), ("p2", "p3"), ("p3", "p4"), ("p4", "p1"), ("p4", "p5"), ("p5", "p6"), ("p6", "p7"), ("p5", "p7")]
POS = {k: (OX + x, OY + y) for k, x, y, _ in PERKS}


def star(x, y, lit, r=7, gold=False):
    col = "#FCD34D" if gold else "#BAE6FD"
    if lit:
        return (f'<circle cx="{x}" cy="{y}" r="{r * 2.6}" fill="{col}" opacity=".18"/><circle cx="{x}" cy="{y}" r="{r}" fill="#FFFFFF"/>'
                f'<path d="M{x} {y - r * 2.2} L{x + 1.2} {y - 1.2} L{x + r * 2.2} {y} L{x + 1.2} {y + 1.2} L{x} {y + r * 2.2} L{x - 1.2} {y + 1.2} L{x - r * 2.2} {y} L{x - 1.2} {y - 1.2} Z" fill="{col}" opacity=".9"/>')
    return f'<circle cx="{x}" cy="{y}" r="{r * .75}" fill="#0E1A33" stroke="#5E6E91" stroke-width="1.5"/>'


def sky(after):
    lit = {"p1"} if not after else {k for k, *_ in PERKS}
    nxt = "p2" if not after else None
    g = []
    for a, b in LINKS:
        (x1, y1), (x2, y2) = POS[a], POS[b]
        on = a in lit and b in lit
        g.append(f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{"#BAE6FD" if on else "#3B4D74"}" stroke-width="{2 if on else 1.2}" stroke-opacity="{.85 if on else .7}"/>')
    for k, x, y, label_ in PERKS:
        X, Y = POS[k]
        g.append(star(X, Y, k in lit, 7, gold=after))
        if k == nxt:
            g.append(f'<circle cx="{X}" cy="{Y}" r="16" fill="none" stroke="#6AF7FF" stroke-width="1.5" stroke-dasharray="3 4"/>')
        lx, anchor = (X - 18, "end") if k in ("p1",) else ((X, "middle") if k in ("p2", "p4", "p5", "p6") else (X + 18, "start"))
        ly = Y - 22 if k in ("p2", "p5", "p6") else (Y + 32 if k in ("p4",) else Y + 5)
        g.append(f'<text x="{lx}" y="{ly}" text-anchor="{anchor}" font-family="IBM Plex Mono" font-size="12.5" fill="{"#E2E8F0" if k in lit else ("#6AF7FF" if k == nxt else "#7C8BAA")}">{label_}{" ✓" if k in lit else (" · NEXT" if k == nxt else "")}</text>')
    # neighbouring constellations (dim), premium (faint gold)
    def mini(cx, cy, pts, name, sub, gold=False, bright=False):
        col = "#FCD34D" if gold else ("#93C5FD" if bright else "#5E6E91")
        s = "".join(f'<line x1="{cx + a[0]}" y1="{cy + a[1]}" x2="{cx + b[0]}" y2="{cy + b[1]}" stroke="{col}" stroke-opacity=".5" stroke-width="1"/>' for a, b in zip(pts, pts[1:]))
        s += "".join(f'<circle cx="{cx + p[0]}" cy="{cy + p[1]}" r="3" fill="{col}" opacity=".85"/>' for p in pts)
        s += f'<text x="{cx + 30}" y="{cy + 92}" text-anchor="middle" font-family="Barlow Condensed" font-weight="700" font-size="17" fill="{col}" letter-spacing="1">{name}</text>'
        s += f'<text x="{cx + 30}" y="{cy + 108}" text-anchor="middle" font-family="IBM Plex Mono" font-size="10" fill="{col}" opacity=".8">{sub}</text>'
        return s
    g.append(mini(60, 120, [(0, 40), (25, 0), (55, 20), (60, 60), (25, 70), (0, 40)], "PLAYER ONE", "GIFT · LIT", bright=True))
    g.append(mini(860, 90, [(0, 50), (30, 10), (65, 30), (45, 70), (0, 50)], "02 · ITERATE", "AT LAUNCH" if after else "FREE", bright=after))
    g.append(mini(990, 160, [(0, 30), (35, 0), (70, 35), (35, 65)], "03 · SHOW, DON'T TELL", "AT LAUNCH" if after else "FREE", bright=after))
    g.append(mini(1000, 30, [(0, 20), (20, 0), (45, 15), (60, 0)], "PREMIUM ★", "8 CONSTELLATIONS", gold=True))
    dust = "".join(f'<circle class="v4-twinkle" cx="{x}" cy="{y}" r="{r}" fill="#FFFFFF" opacity=".45"/>' for x, y, r in [(30, 30, 1), (200, 60, 1.2), (520, 20, 1), (780, 300, 1.3), (660, 380, 1), (1100, 330, 1.2), (150, 350, 1), (900, 250, 1), (420, 360, 1.2)])
    return f'<svg role="img" aria-label="Skill sky. The Clear Ask constellation: {"all 7 stars lit" if after else "1 of 7 stars lit; next: lesson 1.2"}" viewBox="0 0 1140 400" width="100%" style="display: block">{dust}{"".join(g)}</svg>'


def sky_section(after):
    bar = "".join(f'<span style="flex: 1; height: 8px; background: {"#FCD34D" if (after or i < 1) else "#2B3B5E"}"></span>' for i in range(7))
    return f'''<section aria-label="Skill sky" style="position: relative; background: radial-gradient(ellipse at 45% 40%, #1B2E5C 0%, #0E1A33 45%, #050611 100%); color: #FFFFFF; padding: 22px 26px 24px; {CUT_TR}">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 16px">
          <div>{kicker("A", "Skill sky", "#6AF7FF")}<div style="{DISPLAY}; font-size: 34px; margin-top: 4px">Every star is a step you proved</div></div>
          <div style="{MONO_F}; font-size: 11px; letter-spacing: .12em; color: #7C8BAA; text-align: right; line-height: 1.7">LIKE SKYRIM'S SKILL CONSTELLATIONS<br>◂ ▸ TURN THE SKY · 7 FREE + 8 PREMIUM</div>
        </div>
        {sky(after)}
        <div style="display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 16px; margin-top: -6px">
          <div style="min-width: 320px">
            <div style="{DISPLAY}; font-size: 40px; line-height: .9">The Clear Ask</div>
            <div style="display: flex; align-items: center; gap: 12px; margin-top: 8px"><span style="{MONO_F}; font-size: 12px; color: #9FB0CF">SET 01</span><div style="display: flex; gap: 3px; width: 220px">{bar}</div><span style="{MONO_F}; font-size: 12px; color: #FCD34D">{"7 / 7 · SET BADGE ◆ HOLO" if after else "1 / 7 STARS"}</span></div>
          </div>
          <div style="background: rgba(5,6,17,.7); border: 1px solid #2B3B5E; padding: 12px 16px; max-width: 420px; {MONO_F}; font-size: 12.5px; line-height: 1.6; color: #D5DBEC">
            {"<span style='color: #FCD34D'>CONSTELLATION COMPLETE</span><br>Learn ★★★ · Test 90 ★★★ · Help used. Next at launch: Iterate or Show, Don't Tell." if after else "<span style='color: #6AF7FF'>NEXT STAR · 1.2 ASK FOR THE SHAPE</span><br>Earns ★★ on the Key and the stamp Explicit format. About 5 minutes in the console."}
          </div>
        </div>
      </section>'''


# ---------- stamp passport (museum ticket) ----------
STAMPS = [("gift", "Player One"), ("easy", "Brief formula"), ("easy", "Explicit format"), ("easy", "Your material"), ("easy", "Iterate"), ("easy", "Options"),
          ("medium", "Examples"), ("medium", "Role"), ("medium", "Long documents"), ("medium", "Fact check"), ("hard", "Self-critique"), ("hard", "Projects"), ("hard", "Artifacts")]


def slot(i, lvl, name, got):
    col = C[lvl]
    if got:
        inner = stamp(name, lvl, 92, [-8, 6, -4, 9][i % 4])
    else:
        inner = f'<div style="width: 92px; height: 92px; border-radius: 50%; border: 2.5px dashed {col}; display: flex; align-items: center; justify-content: center; {MONO_F}; font-size: 12px; letter-spacing: .14em; color: {col}; opacity: .85">???</div>'
    return f'''<div style="display: flex; flex-direction: column; align-items: center; gap: 6px; width: 112px; text-align: center">
          <div style="padding: 6px; border: 2px solid {col}; border-radius: 50%; background: rgba(255,255,255,.6)">{inner}</div>
          <div style="font-size: 12.5px; font-weight: 600; color: {'#172033' if got else '#6F6858'}; line-height: 1.2">{name}</div>
        </div>'''


def passport(after):
    earned = {0, 1, 2, 3} if after else {0, 1}
    slots = "".join(slot(i, lvl, n, i in earned) for i, (lvl, n) in enumerate(STAMPS))
    legend = "".join(f'<span style="display: inline-flex; align-items: center; gap: 6px"><span style="width: 12px; height: 12px; border-radius: 50%; border: 2px solid {C[k]}"></span>{t}</span>' for k, t in [("gift", "start"), ("easy", "easy"), ("medium", "medium"), ("hard", "hard")])
    guilloche = "background-color: #FFF8E6; background-image: repeating-radial-gradient(circle at 0 0, rgba(183,121,31,.07) 0 2px, transparent 2px 9px), repeating-radial-gradient(circle at 100% 100%, rgba(29,63,184,.05) 0 2px, transparent 2px 11px)"
    return f'''<section aria-label="Stamp passport" style="display: flex; filter: drop-shadow(0 12px 22px rgba(23,32,51,.16))">
        <div style="flex: none; width: 92px; {guilloche}; border: 1px solid #E7C99A; border-right: 0; display: flex; align-items: center; justify-content: center; border-radius: 10px 0 0 10px">
          <div style="writing-mode: vertical-rl; transform: rotate(180deg); {MONO_F}; font-size: 12px; letter-spacing: .3em; color: #8A5A12; text-align: center; line-height: 1.8">ADMIT ONE · VALID FOREVER<br><span style="{DISPLAY}; font-size: 22px; letter-spacing: .12em; color: #172033">No. 0001 · JOHN</span></div>
        </div>
        <div aria-hidden="true" style="flex: none; width: 0; border-left: 3px dotted #C9A46A"></div>
        <div style="flex: 1; {guilloche}; border: 1px solid #E7C99A; border-left: 0; border-radius: 0 10px 10px 0; padding: 20px 24px">
          <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-end; gap: 12px">
            <div>
              <div style="{MONO_F}; font-size: 11px; letter-spacing: .22em; color: #8A5A12">AIGO SKILL PASSPORT · COLLECT ALL 13 STAMPS</div>
              <div style="{DISPLAY}; font-size: 34px; margin-top: 4px">One stamp for each skill Claude checked</div>
            </div>
            <div style="{DISPLAY}; font-size: 48px; line-height: .9; color: #B91C1C">{len(earned)}<span style="color: #C9A46A">/13</span></div>
          </div>
          <div style="display: flex; flex-wrap: wrap; gap: 14px 6px; margin-top: 16px">{slots}</div>
          <div style="display: flex; flex-wrap: wrap; gap: 18px; margin-top: 14px; {MONO_F}; font-size: 11px; letter-spacing: .12em; color: #6F6858; text-transform: uppercase">{legend}<span style="margin-left: auto">the Artifacts stamp comes with premium</span></div>
        </div>
      </section>'''


def can_do(after):
    items = [("Write an ask the AI gets right the first time", "Brief formula · Lesson 1.1")]
    if after:
        items += [("Get the answer in the shape you need", "Explicit format · Lesson 1.2"), ("Give the AI your real material", "Your material · Lesson 1.3"), ("Pass a 5-task test on your work", "Proving Lock · 90 / 100")]
    lis = "".join(f'<li style="display: flex; gap: 10px; padding: 10px 0; border-top: 1px dashed #DCD4C4"><span style="color: #15803D; font-weight: 700">✓</span><div><div style="font-weight: 600">{t}</div><div style="{MONO_F}; font-size: 11.5px; color: #566072; margin-top: 2px">{d}</div></div></li>' for t, d in items)
    return f'''<section style="background: #FFFFFF; border: 1px solid #DCD4C4; border-top: 4px solid #15803D; padding: 18px 20px; {CUT_TR}">
        <div style="{MONO_F}; font-size: 11px; letter-spacing: .18em; color: #166534">WHAT YOU CAN DO NOW</div>
        <p style="margin: 6px 0 4px; font-size: 13.5px; color: #566072">Only what Claude checked on your own work.</p>
        <ul style="list-style: none; margin: 0; padding: 0; font-size: 15px">{lis}</ul>
      </section>'''


def block(after):
    return f'''{sky_section(after)}
    <div style="display: flex; flex-wrap: wrap; gap: 20px; align-items: flex-start">
      <div style="flex: 999 1 760px; min-width: 0">{passport(after)}</div>
      <div style="flex: 1 1 300px; min-width: 0">{can_do(after)}</div>
    </div>'''


body = f'''{header("Progress")}
  <main style="max-width: 1240px; margin: 0 auto; padding: 26px 24px 64px; display: flex; flex-direction: column; gap: 22px">
    <section style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-end; gap: 20px">
      <div>{kicker("04", "Progress · John")}{h1("Your progress", 64)}<p style="margin: 8px 0 0; color: #566072; font-size: 16px">What you've proven with Claude. Nothing expires; there are no streaks to keep.</p></div>
      <div style="display: flex; flex-wrap: wrap; gap: 10px; align-items: center; background: #FFFBEB; border: 1.5px dashed #B45309; padding: 12px 14px; max-width: 520px">
        <div style="flex: 1 1 240px; font-size: 13.5px; line-height: 1.45"><b style="{MONO_F}; font-size: 11px; letter-spacing: .14em; color: #92400E">DEMO ONLY</b><br>{{{{demoText}}}}</div>
        <button onClick="{{{{toggle}}}}" style="cursor: pointer; border: 0; background: #172033; color: #FFFFFF; padding: 12px 14px; {MONO_F}; font-size: 12px; letter-spacing: .12em; {CUT}">{{{{demoBtn}}}}</button>
      </div>
    </section>
    <sc-if value="{{{{before}}}}" hint-placeholder-val="{{{{ true }}}}">{block(False)}</sc-if>
    <sc-if value="{{{{after}}}}" hint-placeholder-val="{{{{ false }}}}">{block(True)}</sc-if>
    <section aria-label="Add a result code" style="display: flex; flex-wrap: wrap; align-items: center; gap: 16px; background: #FFFFFF; border: 1px solid #DCD4C4; border-left: 4px solid #A21CAF; padding: 18px 20px">
      <div style="flex: 1 1 360px"><div style="{MONO_F}; font-size: 11px; letter-spacing: .18em; color: #A21CAF">TOOK THE TEST IN YOUR OWN CLAUDE?</div><div style="font-size: 15px; margin-top: 6px">Paste the result code from the end of the test. Your stars and stamps come home.</div></div>
      <label style="flex: 1 1 300px; display: flex; flex-direction: column; gap: 6px; {MONO_F}; font-size: 11px; letter-spacing: .12em; color: #566072">RESULT CODE<input placeholder="SV1-…" style="border: 1.5px solid #DCD4C4; padding: 12px; {MONO_F}; font-size: 14px; color: #172033; background: #FFFFFF"></label>
      {btn("Read code ▸", "V4Result.dc.html")}
    </section>
  </main>
'''
js = '''class Component extends DCLogic {
  constructor(props) { super(props); this.state = { ff: false }; }
  renderVals() {
    const self = this; const ff = !!(this.state && this.state.ff);
    return {
      before: !ff, after: ff,
      demoText: ff ? 'John after Set 01, filled in through the same result-code path a real test uses.' : 'See John after he finishes Set 01: every star, stamps and the set badge.',
      demoBtn: ff ? 'BACK TO NOW' : 'FAST-FORWARD JOHN',
      toggle: () => self.setState({ ff: !ff })
    };
  }
}'''
open(sys.argv[1] + "/project/V4Progress.dc.html", "w").write(page("Progress", body, 1640, js))
print("ok")
