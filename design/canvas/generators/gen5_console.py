"""v5 console: a terminal-style AI chat. Items paste as items; Claude formats lessons with text frames
(open-right boxes, so they also read well in claude.ai's proportional font)."""
import sys, html
sys.path.insert(0, sys.argv[1])
from gen4_common import *
from gen4_art import ART, ITEMS

TERM_BG = "#0B1020"
FG = "#D5DBEC"
DIM = "#7C8BAA"
TYPE_COL = {"learn": "#60A5FA", "test": "#F0ABFC", "help": "#4ADE80"}


def esc(t):
    return html.escape(t, quote=False)


def tline(*parts):
    """One terminal line; parts are (text, color, bold)."""
    out = ""
    for p in parts:
        t, col, b = (p + (None, False))[:3] if isinstance(p, tuple) else (p, None, False)
        out += f'<span style="{"color: " + col + ";" if col else ""}{" font-weight: 600;" if b else ""}">{esc(t)}</span>'
    return out


def frame(title, lines, col, width=56):
    top = "┌─ " + title + " " + "─" * max(4, width - len(title) - 4)
    rows = [tline((top, col))]
    for ln in lines:
        if isinstance(ln, list):
            rows.append(tline(("│ ", col), *ln))
        else:
            rows.append(tline(("│ ", col), (ln, FG)))
    rows.append(tline(("└" + "─" * (width - 1), col)))
    return "\n".join(rows)


def rule(col, n=58):
    return tline(("━" * n, col))


def pre(lines_html):
    return f'<pre style="margin: 0; {MONO_F}; font-size: 14px; line-height: 1.6; color: {FG}; white-space: pre-wrap; word-break: break-word">{lines_html}</pre>'


def who(name, col):
    return f'<span style="{MONO_F}; font-size: 13px; color: {col}; flex: none; width: 72px">{name} ›</span>'


def msg(name, col, inner):
    return f'<div style="display: flex; gap: 10px; align-items: flex-start">{who(name, col)}<div style="flex: 1; min-width: 0">{inner}</div></div>'


def item_chip(kind, note="item pasted"):
    nm = ITEMS[kind][0]
    c = TYPE_COL[kind]
    mark = {"learn": "■ LEARN", "test": "▲ TEST", "help": "● HELP"}[kind]
    return f'''<div style="display: inline-flex; gap: 14px; align-items: center; border: 1px solid {c}; background: linear-gradient(90deg, rgba(255,255,255,.06), rgba(255,255,255,0)); padding: 10px 16px 10px 10px; {CUT_TR}">
            <div style="width: 64px; height: 64px; flex: none; display: flex; align-items: center; justify-content: center; background: radial-gradient(circle, {c}55 0%, #0E1A33 70%); border-radius: 6px">{ART[kind]}</div>
            <div>
              <div style="{MONO_F}; font-size: 11px; letter-spacing: .16em; color: {c}">{mark} · SET 01 · ● COMMON</div>
              <div style="{DISPLAY}; font-size: 24px; color: #FFFFFF; line-height: 1.05">{nm}</div>
              <div style="{MONO_F}; font-size: 11.5px; color: {DIM}">{note} · hidden instructions inside · <u>view</u></div>
            </div>
          </div>'''


def term_shell(tabs_active, body_html, composer_html, title):
    def tab(name, href, on):
        return f'<a href="{href}" {"aria-current=\"page\" " if on else ""}style="text-decoration: none; {MONO_F}; font-size: 12px; letter-spacing: .14em; padding: 6px 12px; color: {"#050611" if on else "#9FB0CF"}; background: {"#6AF7FF" if on else "transparent"}; border: 1px solid {"#6AF7FF" if on else "#2B3B5E"}">{name}</a>'
    return f'''<section aria-label="AIGO console" style="flex: 999 1 680px; min-width: 0; background: {TERM_BG}; border: 1px solid #1E2A3D; box-shadow: 0 20px 40px rgba(5,6,17,.25); display: flex; flex-direction: column">
      <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 12px 16px; padding: 10px 14px; border-bottom: 1px solid #1E2A3D">
        <span aria-hidden="true" style="display: flex; gap: 6px"><span style="width: 10px; height: 10px; border-radius: 50%; background: #FF5F57"></span><span style="width: 10px; height: 10px; border-radius: 50%; background: #FEBC2E"></span><span style="width: 10px; height: 10px; border-radius: 50%; background: #28C840"></span></span>
        <span style="{MONO_F}; font-size: 12px; color: {DIM}">{title}</span>
        <nav aria-label="Console mode" style="display: flex; gap: 6px; margin-left: 8px">{tab("LESSON", "V4Console.dc.html", tabs_active == "lesson")}{tab("WORK CHAT", "V4WorkChat.dc.html", tabs_active == "work")}</nav>
        <span style="margin-left: auto; {MONO_F}; font-size: 11px; letter-spacing: .14em; color: #39FF88">● CLAUDE · LIVE</span>
      </div>
      <div aria-live="polite" style="height: 690px; overflow-y: auto; display: flex; flex-direction: column-reverse"><div style="flex: none; min-height: 100%; box-sizing: border-box; padding: 22px 22px 14px; display: flex; flex-direction: column; gap: 20px">
        {body_html}
      </div></div>
      {composer_html}
    </section>'''


def composer(kind, active_text, submit_hole, value_hole=None, change_hole=None, border_hole=None, extra_btn=""):
    c = TYPE_COL[kind]
    border = f"{{{{{border_hole}}}}}" if border_hole else c
    val = f' value="{{{{{value_hole}}}}}" onChange="{{{{{change_hole}}}}}"' if value_hole else ""
    return f'''<form onSubmit="{{{{{submit_hole}}}}}" style="border-top: 1px solid #1E2A3D; padding: 12px 14px 14px">
        <div style="display: inline-flex; align-items: center; gap: 8px; margin-bottom: 8px; border: 1px solid {c}; color: {c}; padding: 4px 10px; {MONO_F}; font-size: 11.5px; letter-spacing: .1em; box-shadow: 0 0 14px {c}55">{active_text}</div>
        <div style="display: flex; gap: 10px; align-items: flex-end">
          <label style="flex: 1; display: flex; gap: 10px; align-items: flex-start; border: 1.5px solid {border}; background: #0E1528; padding: 10px 12px">
            <span style="{MONO_F}; font-size: 14px; color: #6AF7FF; padding-top: 2px">john ›</span>
            <span style="position: absolute; left: -9999px">Your message</span>
            <textarea rows="3"{val} placeholder="Type your answer, or use the hint on the right" style="flex: 1; resize: vertical; border: 0; outline: none; background: transparent; color: #FFFFFF; {MONO_F}; font-size: 14px; line-height: 1.55"></textarea>
          </label>
          {extra_btn}
          <button type="submit" style="cursor: pointer; border: 0; background: #3B82FF; color: #050611; padding: 15px 20px; {MONO_F}; font-weight: 600; font-size: 13px; letter-spacing: .14em; {CUT}">SEND ↵</button>
        </div>
      </form>'''


# ---------------- Lesson ----------------
B = TYPE_COL["learn"]
activation = pre("\n".join([
    tline(("▶ ITEM ACTIVATED · LEARN · Three-Tooth Key", "#6AF7FF", True)),
    tline(("Hi John! I'm your coach for this item. Three short lessons on your real work.", FG)),
]))
earlier = f'<div style="display: flex; align-items: center; gap: 12px; color: {DIM}; {MONO_F}; font-size: 12px"><span style="flex: 1; height: 1px; background: #1E2A3D"></span>LESSON 1.1 · THE BRIEF FORMULA · ✓ ★ · 12 earlier messages<span style="flex: 1; height: 1px; background: #1E2A3D"></span></div>'
lesson = pre("\n".join([
    rule(B),
    tline((" LESSON 1.2 · ASK FOR THE SHAPE", "#FFFFFF", True), ("        step 4/7  ", DIM), ("████", B), ("░░░", "#3B4D74")),
    rule(B),
    tline(("Claude can write anything, but it can't guess the shape you need.", FG)),
    tline(("So say it: the format, the length and what comes first.", FG)),
    "",
    frame("MONDAY'S MEETING NOTES", ["printer arrives Thursday · John sets it up", "offsite venue booked by the 20th · Anna", "budget request to finance on Friday · Mark", "standup moves to 9:30"], DIM),
    "",
    frame("YOUR TURN", [[("Ask me for an update you can post in your team chat:", FG)], [("Turn these notes into ", FG), ("___", "#FCD34D", True), (". Format: ", FG), ("___", "#FCD34D", True), (".", FG)], [("Length: ", FG), ("___", "#FCD34D", True), (". Start with ", FG), ("___", "#FCD34D", True), (".", FG)]], B),
]))
checked = pre("\n".join([
    frame("CHECK", [[("[✓] ", "#39FF88"), ("format       3 bullets with owners", FG)], [("[✓] ", "#39FF88"), ("length       under 60 words", FG)], [("[✓] ", "#39FF88"), ("comes first  the decision", FG)]], "#39FF88"),
    "",
    tline(("✅ CHECK PASSED · ", "#39FF88", True), ("★★", "#FCD34D", True), ("☆", "#4B5A7A")),
    tline(("✦ STAMP EARNED · Explicit format", "#86EFAC", True)),
    "",
    frame("YOUR UPDATE", [[("Standup moves to 9:30, starting Monday.", "#FFFFFF", True)], "• Anna books the offsite venue by the 20th", "• Mark sends the budget request on Friday", "• John sets up the new printer on Thursday"], DIM),
    "",
    tline(("Next: Lesson 1.3 · Give it the material, then the final task.", FG)),
    tline(("[1] ", "#6AF7FF", True), ("next lesson    ", FG), ("[2] ", "#6AF7FF", True), ("more practice", FG)),
]))

lesson_body = "\n".join([
    msg("john", "#6AF7FF", item_chip("learn")),
    msg("claude", "#FF8AD9", activation),
    earlier,
    msg("claude", "#FF8AD9", lesson),
    f'<sc-if value="{{{{sent}}}}" hint-placeholder-val="{{{{ false }}}}">{msg("john", "#6AF7FF", f"<div style=\"{MONO_F}; font-size: 14px; line-height: 1.6; color: #FFFFFF\">{{{{lastSent}}}}</div>")}</sc-if>',
    f'<sc-if value="{{{{checking}}}}" hint-placeholder-val="{{{{ false }}}}">{msg("claude", "#FF8AD9", f"<span style=\"{MONO_F}; font-size: 14px; color: {DIM}\">checking your ask</span><span class=\"v5-blink\" style=\"display: inline-block; width: 8px; height: 16px; background: #6AF7FF; vertical-align: middle; margin-left: 6px\"></span>")}</sc-if>',
    f'<sc-if value="{{{{passed}}}}" hint-placeholder-val="{{{{ false }}}}">{msg("claude", "#FF8AD9", checked)}</sc-if>',
])

hint = "Turn these notes into an update for our team chat. Format: 3 bullet points, each with an owner and a deadline. Length: under 60 words. Start with the one decision we made: standup moves to 9:30."


def side_panel(title, color, inner, top=True):
    return f'''<div style="background: #FFFFFF; border: 1px solid #DCD4C4; {"border-top: 4px solid " + color + ";" if top else ""} padding: 18px; {CUT_TR}">
        <div style="{MONO_F}; font-size: 11px; letter-spacing: .18em; color: {color}">{title}</div>
        {inner}
      </div>'''


lesson_aside = f'''<aside aria-label="Your item and hints" style="flex: 1 1 320px; min-width: 0; display: flex; flex-direction: column; gap: 14px">
      {side_panel("ACTIVE ITEM", "#2563EB", f"""<div style="display: flex; gap: 14px; align-items: center; margin-top: 10px">
          <div style="flex: none">
            <sc-if value="{{{{notPassed}}}}" hint-placeholder-val="{{{{ true }}}}">{card("learn", "", "1/3", "Learn · ~10 min", "Ask once.", 1, 104)}</sc-if>
            <sc-if value="{{{{passed}}}}" hint-placeholder-val="{{{{ false }}}}">{card("learn", "", "1/3", "Learn · ~10 min", "Ask once.", 2, 104)}</sc-if>
          </div>
          <div style="display: flex; flex-direction: column; gap: 6px">
            <div style="{DISPLAY}; font-size: 24px; line-height: 1">Three-Tooth Key</div>
            <div style="font-size: 13px; color: #566072">Set 01 · The Clear Ask</div>
            <div><span style="font-size: 20px; letter-spacing: 2px"><span style="color: #E2A300">★</span><span style="color: {{{{s2}}}}">★</span><span style="color: #C9C1B0">★</span></span> <span style="font-size: 13px; color: #566072">{{{{starsText}}}}</span></div>
            <sc-if value="{{{{passed}}}}" hint-placeholder-val="{{{{ false }}}}"><div style="display: flex; align-items: center; gap: 8px">{stamp("Explicit format", "easy", 64, -8)}<span style="{MONO_F}; font-size: 11px; letter-spacing: .1em; color: #15803D">NEW STAMP</span></div></sc-if>
          </div>
        </div>""")}
      {side_panel("NOT SURE WHAT TO WRITE?", "#2563EB", f"""<p style="margin: 8px 0 10px; font-size: 14px; color: #566072; line-height: 1.5">An answer you can use as is. Claude still checks it for real.</p>
        <p style="margin: 0 0 12px; font-size: 14px; line-height: 1.55; background: #F4F0E8; padding: 12px; {MONO_F}">{hint}</p>
        <div style="display: flex; gap: 8px">
          <button onClick="{{{{useHint}}}}" style="cursor: pointer; border: 0; background: #172033; color: #FFFFFF; padding: 11px 14px; {MONO_F}; font-size: 12px; letter-spacing: .12em; {CUT}">USE THIS ANSWER</button>
          <button style="cursor: pointer; border: 1.5px solid #DCD4C4; background: #FFFFFF; color: #172033; padding: 10px 14px; {MONO_F}; font-size: 12px; letter-spacing: .12em">COPY</button>
        </div>
        <div style="margin-top: 14px; border-top: 1px dashed #DCD4C4; padding-top: 10px; {MONO_F}; font-size: 12.5px; line-height: 1.9">
          <div style="letter-spacing: .14em; color: #566072">PASSES IF IT SAYS</div>
          <div>[ ] the format: list, table, email…</div><div>[ ] how long it should be</div><div>[ ] what comes first</div>
        </div>""")}
      <a href="V4Guide.dc.html" style="text-decoration: none; display: block; border: 1.5px dashed #2563EB; padding: 14px 16px; {MONO_F}; font-size: 12.5px; letter-spacing: .08em; color: #1D4ED8; line-height: 1.6">PREFER YOUR OWN CLAUDE? ↗<br><span style="color: #566072; letter-spacing: 0">Same item, same lesson. The guide shows how in 3 steps.</span></a>
    </aside>'''

lesson_page = f'''{header("Console")}
  <main style="max-width: 1360px; margin: 0 auto; padding: 18px 24px 28px">
    <div style="display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 12px; margin-bottom: 14px">
      <div>{kicker("02", "Console")}<h1 style="margin: 6px 0 0; {DISPLAY}; font-size: 44px; line-height: .9">Your AI, with an item inside</h1></div>
      <div style="{MONO_F}; font-size: 12px; color: #566072; letter-spacing: .08em">A real Claude chat. Paste an item and it becomes your coach.</div>
    </div>
    <div style="display: flex; flex-wrap: wrap; gap: 18px; align-items: flex-start">
      {term_shell("lesson", lesson_body, composer("learn", "■ THREE-TOOTH KEY · ACTIVE", "send", "draft", "type"), "john@aigo-console:~ · claude")}
      {lesson_aside}
    </div>
  </main>
'''
lesson_js = '''class Component extends DCLogic {
  constructor(props) { super(props); this.state = { draft: '', stage: 0, lastSent: '' }; }
  componentWillUnmount() { clearTimeout(this.t); }
  renderVals() {
    const self = this; const st = this.state || {};
    const hint = "__HINT__";
    const passed = st.stage === 2;
    return {
      draft: st.draft || '', lastSent: st.lastSent || '', sent: st.stage >= 1, checking: st.stage === 1, passed, notPassed: !passed,
      s2: passed ? '#E2A300' : '#C9C1B0', starsText: passed ? '2 of 3 stars' : '1 of 3 stars',
      type: (e) => self.setState({ draft: e.target.value }),
      useHint: () => self.setState({ draft: hint }),
      send: (e) => { e.preventDefault(); if (!st.draft || st.stage > 0) return; self.setState({ stage: 1, lastSent: st.draft, draft: '' }); self.t = setTimeout(() => self.setState({ stage: 2 }), 1500); }
    };
  }
}'''.replace("__HINT__", hint)
open(sys.argv[1] + "/project/V4Console.dc.html", "w").write(page("Console · Lesson", lesson_page, 1100, lesson_js))

# ---------------- Work chat ----------------
G = TYPE_COL["help"]
sample = "\n".join([
    msg("john", "#6AF7FF", f'<div style="{MONO_F}; font-size: 14px; color: #FFFFFF">write me a report</div>'),
    msg("claude", "#FF8AD9", pre(tline(("Sure! Here's a report on recent business performance…  ", FG), ("(long and generic)", DIM)))),
    msg("john", "#6AF7FF", f'<div style="{MONO_F}; font-size: 14px; color: #FFFFFF">no, shorter</div>'),
    msg("claude", "#FF8AD9", pre(tline(("Here's a shorter version…  ", FG), ("(still generic)", DIM)))),
    msg("john", "#6AF7FF", f'<div style="{MONO_F}; font-size: 14px; color: #FFFFFF">no, more formal</div>'),
    msg("claude", "#FF8AD9", pre(tline(("Certainly. Here is a more formal version…  ", FG), ("(still not what John needs)", DIM)))),
])
help_reply = pre("\n".join([
    tline(("▶ ITEM ACTIVATED · HELP · Pocket Compass", "#4ADE80", True)),
    "",
    frame("ONE BETTER MOVE", ["You asked three times and still don't have the report.", "Say it once, with all three parts:", [("  who it's for", "#FFFFFF", True), (" · ", DIM), ("what it covers", "#FFFFFF", True), (" · ", DIM), ("how it should look", "#FFFFFF", True)]], G),
    "",
    frame("TRY THIS", ["I'm the office manager. Write my weekly report for my", "manager: supplies ordered, upcoming events, open issues.", "Format: under 150 words, three short sections, neutral tone."], G),
    "",
    tline(("HELP USED", "#86EFAC", True), (" · back to normal chat", DIM)),
]))
work_body = "\n".join([
    f'<sc-if value="{{{{empty}}}}" hint-placeholder-val="{{{{ true }}}}"><div style="margin: auto; text-align: center; color: {DIM}; {MONO_F}; font-size: 14px; line-height: 1.7">work chat is empty<br>type a real task, or load a sample chat →</div></sc-if>',
    f'<sc-if value="{{{{loaded}}}}" hint-placeholder-val="{{{{ false }}}}"><div style="align-self: center; background: #FDE68A; color: #172033; padding: 3px 10px; {MONO_F}; font-size: 11px; letter-spacing: .14em">SAMPLE CHAT · DEMO DATA</div>{sample}</sc-if>',
    f'<sc-if value="{{{{helped}}}}" hint-placeholder-val="{{{{ false }}}}">{msg("john", "#6AF7FF", item_chip("help"))}{msg("claude", "#FF8AD9", help_reply)}</sc-if>',
])
help_btn = f'<button type="button" onClick="{{{{help}}}}" style="cursor: pointer; border: 1.5px solid {G}; background: transparent; color: {G}; padding: 13px 14px; {MONO_F}; font-size: 12px; letter-spacing: .12em">● USE COMPASS</button>'
work_aside = f'''<aside aria-label="Help item" style="flex: 1 1 320px; min-width: 0; display: flex; flex-direction: column; gap: 14px">
      {side_panel("HELP ITEM", "#15803D", f"""<div style="display: flex; gap: 14px; align-items: center; margin-top: 10px">
          <div style="flex: none">{card("help", "", "3/3", "Help · ~1 min", "One move.", 0, 104)}</div>
          <div><div style="{DISPLAY}; font-size: 24px; line-height: 1">Pocket Compass</div>
          <p style="margin: 6px 0 0; font-size: 13.5px; color: #566072; line-height: 1.5">Works once, on what already happened in the chat. Using it counts toward your Set 01 badge.</p></div>
        </div>""")}
      {side_panel("TRY HELP IN TWO STEPS", "#15803D", f"""<div style="margin: 10px 0 14px; {MONO_F}; font-size: 13.5px; line-height: 2">
          <div>[{{{{step1}}}}] load a sample work chat</div><div>[{{{{step2}}}}] press <b>USE COMPASS</b></div></div>
        <div style="display: flex; gap: 8px">
          <button onClick="{{{{load}}}}" style="cursor: pointer; border: 0; background: #15803D; color: #FFFFFF; padding: 11px 14px; {MONO_F}; font-size: 12px; letter-spacing: .12em; {CUT}">LOAD SAMPLE CHAT</button>
          <button onClick="{{{{help}}}}" style="cursor: pointer; border: 1.5px solid #15803D; background: #FFFFFF; color: #166534; padding: 10px 14px; {MONO_F}; font-size: 12px; letter-spacing: .12em">USE COMPASS</button>
        </div>""")}
      <sc-if value="{{{{helped}}}}" hint-placeholder-val="{{{{ false }}}}">
        <div style="background: #F0FDF4; border: 1px solid #BBF7D0; padding: 14px 16px; font-size: 14px; line-height: 1.55">
          <div style="{MONO_F}; font-size: 11px; letter-spacing: .18em; color: #166534">COUNTED AUTOMATICALLY</div>
          <div style="margin-top: 6px">✓ Help used · Set 01 badge: 1 of 3 steps</div>
          <div style="color: #566072">The site saw the HELP USED line. No code to copy.</div>
        </div>
      </sc-if>
    </aside>'''
work_page = f'''{header("Console")}
  <main style="max-width: 1360px; margin: 0 auto; padding: 18px 24px 28px">
    <div style="display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 12px; margin-bottom: 14px">
      <div>{kicker("02", "Console · Work chat")}<h1 style="margin: 6px 0 0; {DISPLAY}; font-size: 44px; line-height: .9">A normal chat, a compass in your pocket</h1></div>
      <div style="{MONO_F}; font-size: 12px; color: #566072; letter-spacing: .08em">When it isn't going well, use your Help item.</div>
    </div>
    <div style="display: flex; flex-wrap: wrap; gap: 18px; align-items: flex-start">
      {term_shell("work", work_body, composer("help", "● POCKET COMPASS · IN YOUR POCKET", "noop", border_hole="composerBorder", extra_btn=help_btn), "john@aigo-console:~ · claude")}
      {work_aside}
    </div>
  </main>
'''
work_js = '''class Component extends DCLogic {
  constructor(props) { super(props); this.state = { loaded: false, helped: false }; }
  renderVals() {
    const self = this; const st = this.state || {};
    return {
      empty: !st.loaded && !st.helped, loaded: !!st.loaded, helped: !!st.helped,
      noop: (e) => e.preventDefault(),
      load: () => self.setState({ loaded: true }),
      help: () => self.setState({ helped: true }),
      step1: st.loaded ? '✓' : ' ', step2: st.helped ? '✓' : ' ',
      composerBorder: st.helped ? '#4ADE80' : '#2B3B5E'
    };
  }
}'''
open(sys.argv[1] + "/project/V4WorkChat.dc.html", "w").write(page("Console · Work chat", work_page, 1100, work_js))
print("ok")
