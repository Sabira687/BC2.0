"""v5 Result, Premium and Guide boards."""
import sys, html
sys.path.insert(0, sys.argv[1])
from gen4_common import *
from gen4_art import ART, ITEMS

TERM = f"background: #0B1020; border: 1px solid #1E2A3D; color: #D5DBEC; {MONO_F}; font-size: 13.5px; line-height: 1.6"


def sp(t, c=None, b=False):
    return f'<span style="{"color: " + c + ";" if c else ""}{" font-weight: 600;" if b else ""}">{html.escape(t, quote=False)}</span>'


# ================= RESULT =================
P = "#F0ABFC"
TASKS = [("1", "What goes into a good ask", True, 10, 10), ("2", "Which ask is better, and why", True, 10, 10), ("3", "Why paste your own material", False, 0, 10),
         ("4", "Email: the deadline moved", True, 35, 35), ("5", "Fix “make a report”", True, 35, 35)]
chat_lines = [sp("━" * 44, P), sp(" TEST COMPLETE · PROVING LOCK", "#FFFFFF", True), sp("━" * 44, P)]
for n, t, ok, s, m in TASKS:
    chat_lines.append(sp(f" {n}  ") + sp(f"{t:<30}") + sp("✓" if ok else "✗", "#39FF88" if ok else "#F87171", True) + sp(f" {s:>2}/{m}"))
chat_lines += [sp("─" * 44, "#3B4D74"), sp(" SCORE  ", "#FFFFFF", True) + sp("90/100", "#FFFFFF", True) + sp("                  ") + sp("★★★", "#FCD34D", True), sp("━" * 44, P), "",
               sp("RESULT CODE  ", "#9FB0CF") + sp("SV1-J7Q2-K9MX-4TRA-PL3W", "#6AF7FF", True), sp("→ paste it on your AIGO Progress page", "#7C8BAA")]
chat_block = "<br>".join(chat_lines)

task_rows = "".join(f'''<li style="display: flex; align-items: center; gap: 12px; padding: 9px 0; border-top: 1px dashed #DCD4C4">
          <span style="{DISPLAY}; font-size: 22px; width: 22px; color: #A21CAF">{n}</span><span style="flex: 1">{t}</span>
          <span style="{MONO_F}; font-size: 13px; color: {'#15803D' if ok else '#B91C1C'}">{'✓' if ok else '✗'} {s}/{m}</span></li>''' for n, t, ok, s, m in TASKS)

res_body = f'''{header("Progress")}
  <main style="max-width: 1240px; margin: 0 auto; padding: 26px 24px 64px; display: flex; flex-direction: column; gap: 22px">
    <section style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-end; gap: 20px">
      <div>{kicker("04", "Progress · Test result")}{h1("Your result, decoded", 60)}</div>
      <label style="display: flex; gap: 8px; align-items: center; background: #FFFFFF; border: 1px solid #DCD4C4; padding: 8px 8px 8px 14px; {MONO_F}; font-size: 13px">
        <span style="color: #566072; letter-spacing: .12em; font-size: 11px">CODE</span>
        <input value="SV1-J7Q2-K9MX-4TRA-PL3W" readonly style="border: 0; outline: none; {MONO_F}; font-size: 14px; color: #172033; width: 250px; background: transparent">
        <button onClick="{{{{replay}}}}" style="cursor: pointer; border: 0; background: #172033; color: #FFFFFF; padding: 10px 14px; {MONO_F}; font-size: 12px; letter-spacing: .12em; {CUT}">READ AGAIN ↻</button>
      </label>
    </section>
    <div style="display: flex; flex-wrap: wrap; gap: 20px; align-items: stretch">
      <section aria-label="In the chat" style="flex: 1 1 420px; min-width: 0; display: flex; flex-direction: column; gap: 8px">
        <div style="{MONO_F}; font-size: 11px; letter-spacing: .18em; color: #566072">1 · IN YOUR CLAUDE CHAT</div>
        <div style="{TERM}; padding: 16px 18px; flex: 1; white-space: pre">{chat_block}</div>
        <div style="{MONO_F}; font-size: 11.5px; color: #566072">The code carries the stars, each task's result and your stamps, made for John's items only.</div>
      </section>
      <section aria-label="On the site" style="flex: 1.4 1 560px; min-width: 0; display: flex; flex-direction: column; gap: 8px">
        <div style="{MONO_F}; font-size: 11px; letter-spacing: .18em; color: #566072">2 · ON AIGO, AFTER YOU PASTE IT</div>
        <div style="position: relative; overflow: hidden; background: radial-gradient(ellipse at 30% 40%, #4A0D57 0%, #1B0B2E 55%, #050611 100%); color: #FFFFFF; padding: 22px 24px; {CUT_TR}">
          <sc-if value="{{{{reading}}}}" hint-placeholder-val="{{{{ false }}}}">
            <div style="height: 330px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; {MONO_F}; font-size: 13px; letter-spacing: .14em; color: #F0ABFC">READING CODE<span class="v5-blink">_</span><div style="width: 260px; height: 6px; background: #2E1065"><div style="width: 60%; height: 6px; background: #F0ABFC"></div></div></div>
          </sc-if>
          <sc-if value="{{{{shown}}}}" hint-placeholder-val="{{{{ true }}}}">
            <div style="display: flex; flex-wrap: wrap; gap: 24px; align-items: center">
              <div style="position: relative; width: 210px; height: 210px; flex: none" class="v5-float">
                <div aria-hidden="true" class="v4-holo" style="position: absolute; inset: 0; border-radius: 50%; background: conic-gradient(from 0deg, #7DD3FC, #F0ABFC, #FDE68A, #86EFAC, #7DD3FC); opacity: .55; filter: blur(14px)"></div>
                <div style="position: relative; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center">{ART["test"]}</div>
              </div>
              <div style="flex: 1 1 240px">
                <div style="{MONO_F}; font-size: 11.5px; letter-spacing: .18em; color: #F0ABFC">▲ PROVING LOCK · NOW HOLOGRAPHIC</div>
                <div style="{DISPLAY}; font-size: 96px; line-height: .85">90<span style="font-size: 40px; color: #A78BFA">/100</span></div>
                <div aria-label="3 of 3 stars" style="font-size: 40px; letter-spacing: 6px"><span style="color: {{{{c1}}}}">★</span><span style="color: {{{{c2}}}}">★</span><span style="color: {{{{c3}}}}">★</span></div>
                <div style="{MONO_F}; font-size: 11.5px; color: #C4B5FD; margin-top: 6px">50+ ★ · 70+ ★★ SKILL COUNTED · 90+ ★★★ HOLO</div>
              </div>
            </div>
            <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-top: 18px; {MONO_F}; font-size: 11.5px; letter-spacing: .12em">
              <span style="border: 1px solid #FCD34D; color: #FCD34D; padding: 6px 10px">✦ CONSTELLATION COMPLETE · SET 01</span>
              <span style="border: 1px solid #86EFAC; color: #86EFAC; padding: 6px 10px">+ STAMP · YOUR MATERIAL</span>
              <span style="border: 1px solid #93C5FD; color: #93C5FD; padding: 6px 10px">MILESTONE · FIRST TEST</span>
            </div>
          </sc-if>
        </div>
      </section>
    </div>
    <div style="display: flex; flex-wrap: wrap; gap: 20px; align-items: flex-start">
      <section style="flex: 999 1 560px; min-width: 0; background: #FFFFFF; border: 1px solid #DCD4C4; padding: 18px 22px">
        <div style="{MONO_F}; font-size: 11px; letter-spacing: .18em; color: #566072">WHAT CLAUDE CHECKED</div>
        <ul style="list-style: none; margin: 8px 0 0; padding: 0; font-size: 15px">{task_rows}</ul>
      </section>
      <section style="flex: 1 1 340px; min-width: 0; background: #FFFBEB; border: 1.5px dashed #B45309; padding: 18px 20px">
        <div style="{MONO_F}; font-size: 11px; letter-spacing: .18em; color: #92400E">ONE THING TO PRACTICE</div>
        <div style="{DISPLAY}; font-size: 24px; margin-top: 6px">Why paste your own material</div>
        <p style="margin: 6px 0 12px; font-size: 14.5px; line-height: 1.55">Claude only knows the facts you give it, so paste the real text. Lesson 1.3 covers it in about 5 minutes.</p>
        {btn("Open lesson 1.3 ▸", "V4Console.dc.html")}
      </section>
    </div>
    <section style="display: flex; flex-wrap: wrap; align-items: center; gap: 14px; background: #FFFFFF; border: 1px solid #DCD4C4; border-left: 4px solid #2563EB; padding: 16px 20px">
      <div style="flex: 1 1 420px"><span style="{MONO_F}; font-size: 11px; letter-spacing: .18em; color: #2563EB">NEXT ·</span> <b>Set 02 · Iterate</b> or <b>Set 03 · Show, Don't Tell</b> <span style="color: #566072">— free at launch; this demo ends at Set 01.</span></div>
      {btn("Back to collection", "V4Collection.dc.html")}{btn("See Premium", "V4Pass.dc.html", "ghost")}
    </section>
  </main>
'''
res_js = '''class Component extends DCLogic {
  constructor(props) { super(props); this.state = { stage: 'shown', n: 3 }; }
  componentWillUnmount() { (this.ts || []).forEach(clearTimeout); }
  replay() {
    (this.ts || []).forEach(clearTimeout);
    const reduce = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { this.setState({ stage: 'shown', n: 3 }); return; }
    this.setState({ stage: 'reading', n: 0 });
    this.ts = [setTimeout(() => this.setState({ stage: 'shown', n: 0 }), 900)].concat([1, 2, 3].map((k) => setTimeout(() => this.setState({ n: k }), 900 + 350 * k)));
  }
  renderVals() {
    const self = this; const st = this.state || {}; const n = st.n || 0;
    const on = '#FCD34D', off = '#3B2A55';
    return { reading: st.stage === 'reading', shown: st.stage === 'shown', c1: n >= 1 ? on : off, c2: n >= 2 ? on : off, c3: n >= 3 ? on : off, replay: () => self.replay() };
  }
}'''
open(sys.argv[1] + "/project/V4Result.dc.html", "w").write(page("Test result", res_body, 1060, res_js))


# ================= PREMIUM =================
def ticket(tag, title, price, per, items, style, strip, stub):
    lis = "".join(f'''<li style="padding: 8px 0; border-top: 1px dashed #DCD4C4"><div style="font-weight: 600">{t}</div>{f'<div style="{MONO_F}; font-size: 11px; line-height: 1.5; color: #566072; margin-top: 2px">{w}</div>' if w else ''}</li>''' for t, w in items)
    return f'''<div style="flex: 1 1 330px; min-width: 0; display: flex; {style}; filter: drop-shadow(0 10px 18px rgba(23,32,51,.12))">
        <div aria-hidden="true" style="width: 14px; flex: none; {strip}"></div>
        <div style="flex: 1; background: #FFFFFF; padding: 20px 20px 14px; border-right: 2px dashed #C9C1B0">
          <div style="{MONO_F}; font-size: 11px; letter-spacing: .2em; color: #566072">{tag}</div>
          <div style="{DISPLAY}; font-size: 28px; margin-top: 4px">{title}</div>
          <div style="display: flex; align-items: flex-end; gap: 6px; margin: 4px 0 6px"><span style="{DISPLAY}; font-size: 54px; line-height: .85">{price}</span><span style="{MONO_F}; font-size: 12px; padding-bottom: 4px">{per}</span></div>
          <ul style="list-style: none; margin: 0; padding: 0; font-size: 14.5px">{lis}</ul>
        </div>
        <div style="width: 46px; flex: none; background: #FFFFFF; display: flex; align-items: center; justify-content: center"><span style="writing-mode: vertical-rl; transform: rotate(180deg); {MONO_F}; font-size: 11px; letter-spacing: .3em; color: #566072">{stub}</span></div>
      </div>'''


demo_items = [("Set 01: Key, Lock and Compass", ""), ("The AIGO console on the Claude API", ""), ("Work chat with the Help item", ""), ("Stars, stamps, result codes", ""), ("Premium checkout in test mode", "")]
free_items = [("Core path: 7 skills, 21 items", "sets 01–07, each with its own art and story"), ("Console and your own Claude", ""), ("Skill sky, stamp passport, holo items", ""), ("Item updates when Claude changes", "")]
prem_items = [("AIGO Connector for Claude", "WHY IT'S REAL · an MCP server; Claude supports custom connectors"),
              ("Full path: Power user + Automator", "WHY IT'S REAL · 24 more items in the Set 01 format"),
              ("New items every month", "WHY IT'S REAL · a content release after each Claude update"),
              ("Promotion Kit", "WHY IT'S REAL · one page from data AIGO already stores"),
              ("Priority support", "email, reply within a day")]
PATHS = [("Power user", [("08", "Artifacts"), ("09", "Research"), ("10", "Files & Data"), ("11", "Skills")]), ("Automator", [("12", "Claude Code"), ("13", "Agents"), ("14", "Connectors"), ("15", "Automations")])]
paths = "".join(f'''<div style="flex: 1 1 520px; min-width: 0; background: #FFFBF2; border: 1px solid #E7C99A; padding: 16px 18px; {CUT_TR}">
        <div style="display: flex; justify-content: space-between; align-items: baseline"><div style="{DISPLAY}; font-size: 26px">{n} path</div><span style="{MONO_F}; font-size: 11px; letter-spacing: .14em; color: #B45309">★ LEGENDARY · 12 ITEMS</span></div>
        <div style="display: flex; gap: 12px; margin-top: 12px">{"".join(f'<div class="v5-lift" style="display: flex; flex-direction: column; align-items: center; gap: 6px">{card("learn", "", "", "Premium", "", 0, 92, "locked", "S" + c, "legendary")}<div style="font-size: 13px; font-weight: 600">{t}</div></div>' for c, t in sets)}</div>
      </div>''' for n, sets in PATHS)

prem_body = f'''{header("Premium")}
  <main style="max-width: 1240px; margin: 0 auto; padding: 26px 24px 64px; display: flex; flex-direction: column; gap: 24px">
    <section style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-end; gap: 20px">
      <div>{kicker("05", "Premium")}{h1("Go further.<br>$7 a month.", 72)}</div>
      <p style="margin: 0; max-width: 460px; color: #566072; font-size: 16px; line-height: 1.55">Free is the core path, and it stays free. Premium adds the connector, two advanced paths and new items every month. Everything you earn stays yours.</p>
    </section>
    <div style="display: flex; flex-wrap: wrap; gap: 22px; align-items: stretch">
      {ticket("IN THIS DEMO", "Set 01, live today", "LIVE", "NOW", demo_items, "opacity: .95", "background: repeating-linear-gradient(180deg, #B45309 0 6px, #FFFBEB 6px 12px)", "DEMO · FREE PLAN")}
      {ticket("FREE · AT LAUNCH", "The core path", "$0", "/ FOREVER", free_items, "", "background: #3B82FF", "FREE FOREVER")}
      {ticket("PREMIUM · AT LAUNCH", "The full path", "$7", "/ MONTH", prem_items, "", "background: linear-gradient(180deg, #7DD3FC, #F0ABFC, #FDE68A, #86EFAC)", "CANCEL ANYTIME")}
    </div>
    <div style="display: flex; flex-wrap: wrap; gap: 18px">{paths}</div>
    <section style="display: flex; flex-wrap: wrap; align-items: center; gap: 16px; {night_sky('')} color: #FFFFFF; padding: 20px 24px; {CUT_TR}">
      <div style="flex: 1 1 420px">
        <div style="{MONO_F}; font-size: 11px; letter-spacing: .2em; color: #FCD34D">ADMIT ONE · PREMIUM · TEST MODE</div>
        <div style="font-size: 15px; margin-top: 6px; color: #D5DBEC">This demo runs on the Free plan. The checkout is real code in test mode: no card, no charge.</div>
      </div>
      <sc-if value="{{{{idle}}}}" hint-placeholder-val="{{{{ true }}}}">
        <button onClick="{{{{buy}}}}" style="cursor: pointer; border: 0; background: #FCD34D; color: #050611; padding: 15px 22px; {MONO_F}; font-weight: 600; font-size: 13px; letter-spacing: .14em; {CUT}">GET PREMIUM · $7 / MONTH</button>
      </sc-if>
      <sc-if value="{{{{paying}}}}" hint-placeholder-val="{{{{ false }}}}"><div style="{MONO_F}; font-size: 13px; color: #9FB0CF">confirming test payment<span class="v5-blink">_</span></div></sc-if>
      <sc-if value="{{{{active}}}}" hint-placeholder-val="{{{{ false }}}}">
        <div style="border: 1px solid #86EFAC; padding: 10px 14px; max-width: 480px"><div style="color: #86EFAC; {MONO_F}; font-size: 12px; letter-spacing: .14em">✓ PREMIUM ACTIVE · TEST MODE</div><div style="font-size: 13.5px; color: #D5DBEC; margin-top: 4px">The connector and the paths arrive at launch. In this demo nothing else changes.</div></div>
      </sc-if>
    </section>
  </main>
'''
prem_js = '''class Component extends DCLogic {
  constructor(props) { super(props); this.state = { s: 'idle' }; }
  componentWillUnmount() { clearTimeout(this.t); }
  renderVals() {
    const self = this; const s = (this.state && this.state.s) || 'idle';
    return { idle: s === 'idle', paying: s === 'paying', active: s === 'active',
      buy: () => { self.setState({ s: 'paying' }); self.t = setTimeout(() => self.setState({ s: 'active' }), 1200); } };
  }
}'''
open(sys.argv[1] + "/project/V4Pass.dc.html", "w").write(page("Premium", prem_body, 1160, prem_js))


# ================= GUIDE =================
def mock_chat(lines):
    return f'<div style="{TERM}; padding: 12px 14px; font-size: 12.5px">{"<br>".join(lines)}</div>'


chip = f'''<div style="display: inline-flex; gap: 10px; align-items: center; border: 1px solid #60A5FA; background: #0B1020; padding: 8px 12px 8px 8px">
        <div style="width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; background: radial-gradient(circle, #60A5FA55, #0E1A33 70%)">{ART["learn"]}</div>
        <div style="{MONO_F}; font-size: 11px; color: #60A5FA; letter-spacing: .12em">■ LEARN<br><span style="{DISPLAY}; font-size: 18px; color: #FFFFFF; letter-spacing: 0">Three-Tooth Key</span></div></div>'''
claude_box = f'''<div style="border: 1px solid #DCD4C4; background: #FFFFFF; padding: 12px 14px; font-size: 13.5px; color: #566072">
        <div style="{MONO_F}; font-size: 11px; letter-spacing: .14em; color: #172033">claude.ai · new chat</div>
        <div style="margin-top: 8px; border: 1.5px solid #DCD4C4; border-radius: 10px; padding: 10px 12px">How can I help you today?<span class="v5-blink" style="display: inline-block; width: 2px; height: 14px; background: #172033; margin-left: 4px; vertical-align: middle"></span></div></div>'''

STEPS = [
    ("1", "Get Claude", "Free is enough. Use claude.ai in the browser, the desktop app or the phone app.", claude_box, "TOOL · CLAUDE (FREE PLAN WORKS)"),
    ("2", "Copy an item", "Open your collection, pick an item, press COPY ITEM. It's a short block of text with the lessons inside.", chip, "FROM YOUR COLLECTION"),
    ("3", "Paste it into a new chat", "Start a fresh chat so nothing old gets in the way. Paste, send.", mock_chat([sp("you › ", "#6AF7FF") + sp("■ AIGO ITEM · LEARN · Three-Tooth Key ⟦item-data v1⟧ …"), sp("claude › ", "#FF8AD9") + sp("▶ ITEM ACTIVATED · LEARN · Three-Tooth Key", "#6AF7FF", True)]), "LOOK FOR ▶ ITEM ACTIVATED"),
    ("4", "Learn in the chat", "Claude runs the lesson on your real work and checks every answer. Stars and stamps appear as lines in the chat.", mock_chat([sp("✅ CHECK PASSED · ", "#39FF88", True) + sp("★★☆", "#FCD34D", True), sp("✦ STAMP EARNED · Explicit format", "#86EFAC", True)]), "ALL LEARNING HAPPENS IN THE AI"),
    ("5", "Bring your progress home", "The test ends with a RESULT CODE. Paste it on your Progress page: stars, stamps and badges land in AIGO.", mock_chat([sp("RESULT CODE  ", "#9FB0CF") + sp("SV1-J7Q2-K9MX-4TRA-PL3W", "#6AF7FF", True)]), "IN THE AIGO CONSOLE THIS IS AUTOMATIC"),
    ("6", "Stuck at work? Use a Help item", "In any chat, paste the Pocket Compass. Claude looks at what already happened and suggests one better move.", mock_chat([sp("claude › ", "#FF8AD9") + sp("▶ ITEM ACTIVATED · HELP · Pocket Compass", "#4ADE80", True)]), "WORKS IN THE MIDDLE OF REAL WORK"),
]
steps_html = "".join(f'''<li style="display: flex; flex-wrap: wrap; gap: 18px; padding: 20px 0; border-top: 1px dashed #DCD4C4">
        <div style="flex: none; width: 64px; {DISPLAY}; font-size: 64px; line-height: .8; color: #2563EB">{n}</div>
        <div style="flex: 1 1 300px; min-width: 0">
          <div style="{MONO_F}; font-size: 10.5px; letter-spacing: .16em; color: #566072">{tag}</div>
          <div style="{DISPLAY}; font-size: 30px; margin-top: 2px">{t}</div>
          <p style="margin: 6px 0 0; font-size: 15px; line-height: 1.55; color: #3F4A5C">{d}</p>
        </div>
        <div style="flex: 1 1 340px; min-width: 0">{vis}</div>
      </li>''' for n, t, d, vis, tag in STEPS)

guide_body = f'''{header("Guide")}
  <main style="max-width: 1240px; margin: 0 auto; padding: 26px 24px 64px; display: flex; flex-wrap: wrap; gap: 28px; align-items: flex-start">
    <div style="flex: 999 1 720px; min-width: 0">
      {kicker("03", "Guide")}
      {h1("Use your items anywhere", 64)}
      <p style="margin: 10px 0 8px; font-size: 16px; color: #566072; max-width: 640px">The platform keeps your collection. The learning happens inside your AI. Here's how to get set up, once, in about three minutes.</p>
      <ol style="list-style: none; margin: 10px 0 0; padding: 0">{steps_html}</ol>
    </div>
    <aside style="flex: 1 1 320px; min-width: 0; display: flex; flex-direction: column; gap: 14px; position: sticky; top: 16px">
      <div style="background: #FFFFFF; border: 1px solid #DCD4C4; border-top: 4px solid #2563EB; padding: 18px; {CUT_TR}">
        <div style="{MONO_F}; font-size: 11px; letter-spacing: .18em; color: #2563EB">TWO WAYS TO LEARN</div>
        <div style="margin-top: 10px; padding: 10px 0; border-top: 1px dashed #DCD4C4"><b>Your own Claude</b> <span style="{MONO_F}; font-size: 10.5px; color: #15803D">RECOMMENDED</span><div style="font-size: 13.5px; color: #566072; margin-top: 2px">Where you already work. Bring progress back with the result code.</div></div>
        <div style="padding: 10px 0; border-top: 1px dashed #DCD4C4"><b>AIGO console</b><div style="font-size: 13.5px; color: #566072; margin-top: 2px">No setup, right in the browser. Progress saves itself.</div></div>
        <div style="display: flex; gap: 8px; margin-top: 8px">{btn("Collection", "V4Collection.dc.html")}{btn("Console", "V4Console.dc.html", "ghost")}</div>
      </div>
      <div style="background: #FFFFFF; border: 1px solid #DCD4C4; padding: 16px 18px; {MONO_F}; font-size: 12.5px; line-height: 2">
        <div style="letter-spacing: .16em; font-size: 11px; color: #566072">SETUP CHECKLIST</div>
        <div>[✓] get Claude</div><div>[✓] copy an item</div><div>[ ] paste it into a new chat</div><div>[ ] pass a lesson</div><div>[ ] bring the result code home</div>
      </div>
      <div style="background: #FFFBF2; border: 1px solid #E7C99A; padding: 16px 18px">
        <div style="{MONO_F}; font-size: 11px; letter-spacing: .18em; color: #B45309">★ WITH PREMIUM · AT LAUNCH</div>
        <div style="{DISPLAY}; font-size: 22px; margin-top: 4px">AIGO Connector</div>
        <div style="font-size: 13.5px; color: #566072; margin-top: 4px; line-height: 1.5">Add it once in Claude under Settings → Connectors. Then Claude can open your items itself, and progress saves without codes.</div>
      </div>
    </aside>
  </main>
'''
open(sys.argv[1] + "/project/V4Guide.dc.html", "w").write(page("Guide", guide_body, 1250))
print("ok")
