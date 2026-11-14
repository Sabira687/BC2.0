"""v5 start: an old-school questionnaire (lined notebook page, varied fields).
Pencil = demo answers (locked); blue ink = the player's own input. Only the name and the teaching style are live."""
import sys
sys.path.insert(0, sys.argv[1])
from gen4_common import *

PENCIL = "#7B7F86"
INK = "#1D3FB8"
LINE = "rgba(96,165,250,.35)"


def topbar():
    return f'''<header style="{night_sky()}">
    <div style="max-width: 1240px; margin: 0 auto; padding: 14px 24px; display: flex; align-items: center; gap: 20px">
      <a href="V4Landing.dc.html" style="text-decoration: none; display: flex; align-items: baseline; gap: 10px"><span style="{DISPLAY}; font-size: 26px; letter-spacing: .18em; color: #FFFFFF">AIGO</span><span style="{MONO_F}; font-size: 11px; letter-spacing: .3em; color: #6AF7FF">COLLECTION</span></a>
      <span style="margin-left: auto; background: #FDE68A; color: #172033; padding: 5px 8px; {MONO_F}; font-size: 10.5px; letter-spacing: .12em">DEMO · SAMPLE PLAYER</span>
    </div>
  </header>'''


def q(n, text, hint="", locked=False):
    return f'<div style="{HAND_F}; font-size: 26px; font-weight: 700; color: #172033; line-height: 1.1">{n}. {text} {f"<span style=\"font-size: 20px; font-weight: 500; color: #8A6D3B\">({hint})</span>" if hint else ""}{lock() if locked else ""}</div>'


def lock():
    return f'<span title="Demo answer, locked" style="{MONO_F}; font-size: 10px; letter-spacing: .12em; color: {PENCIL}; border: 1px dashed {PENCIL}; padding: 1px 5px; margin-left: 8px; vertical-align: middle">🔒 DEMO</span>'


def pencil(text, size=28):
    return f'<span style="{HAND_F}; font-size: {size}px; color: {PENCIL}; font-weight: 500">{text}</span>'


def ticks(options, chosen):
    out = ""
    for o in options:
        on = o == chosen
        out += f'''<div style="display: flex; align-items: center; gap: 10px; {HAND_F}; font-size: 24px; color: {PENCIL if on else "#9AA0A8"}">
            <span style="position: relative; width: 20px; height: 20px; border: 2px solid #4B5563; border-radius: 2px; transform: rotate({-3 if on else 2}deg)">{f'<span style="position: absolute; left: 1px; top: -14px; {HAND_F}; font-size: 30px; color: {PENCIL}">✓</span>' if on else ''}</span>{o}</div>'''
    return f'<div style="display: flex; flex-wrap: wrap; gap: 6px 28px; margin: 6px 0 0 6px">{out}</div>'


def circled(options, chosen):
    out = ""
    for o in options:
        if o == chosen:
            out += f'<span style="position: relative; display: inline-block; padding: 2px 12px; color: {PENCIL}">{o}<svg aria-hidden="true" viewBox="0 0 100 40" preserveAspectRatio="none" style="position: absolute; inset: -6px -8px; width: calc(100% + 16px); height: calc(100% + 12px)"><path d="M8 22 C 6 6, 90 2, 94 18 C 98 34, 12 40, 6 24 C 4 16, 30 8, 52 8" fill="none" stroke="{PENCIL}" stroke-width="2.2"/></svg></span>'
        else:
            out += f'<span style="padding: 2px 12px; color: #9AA0A8">{o}</span>'
    return f'<div style="display: flex; flex-wrap: wrap; gap: 8px 14px; margin: 4px 0 0; {HAND_F}; font-size: 26px">{out}</div>'


def underlined(options, chosen):
    out = ""
    for o in options:
        if o == chosen:
            out += f'<span style="position: relative; color: {PENCIL}; padding-bottom: 4px">{o}<svg aria-hidden="true" viewBox="0 0 100 8" preserveAspectRatio="none" style="position: absolute; left: 0; bottom: -4px; width: 100%; height: 8px"><path d="M0 4 Q 12 0, 25 4 T 50 4 T 75 4 T 100 4" fill="none" stroke="{PENCIL}" stroke-width="2"/></svg></span>'
        else:
            out += f'<span style="color: #9AA0A8">{o}</span>'
    return f'<div style="display: flex; flex-wrap: wrap; gap: 8px 30px; margin: 6px 0 0 6px; {HAND_F}; font-size: 26px">{out}</div>'


def sticker(name, sub, key, rot):
    return f'''<button type="button" onClick="{{{{pick{key}}}}}" aria-pressed="{{{{{key}P}}}}" style="cursor: pointer; position: relative; border: 2px {{{{{key}Bs}}}} {{{{{key}B}}}}; background: {{{{{key}Bg}}}}; padding: 12px 18px 10px; transform: rotate({rot}deg); text-align: left; box-shadow: {{{{{key}Sh}}}}; border-radius: 6px">
          <div style="{DISPLAY}; font-size: 26px; color: {{{{{key}C}}}}">{name}</div>
          <div style="{HAND_F}; font-size: 20px; color: #4B5563">{sub}</div>
          <span style="position: absolute; top: -12px; right: -10px; {MONO_F}; font-size: 10px; letter-spacing: .12em; background: {INK}; color: #FFFFFF; padding: 3px 6px; transform: rotate(8deg); display: {{{{{key}Tag}}}}">✓ CHOSEN</span>
        </button>'''


def row(inner):
    return f'<div style="padding: 10px 0 14px; border-bottom: 1px dashed rgba(96,165,250,.0)">{inner}</div>'


sheet = f'''<form aria-label="Questionnaire" style="position: relative; flex: 999 1 640px; min-width: 0; background-color: #FFFEFA; background-image: repeating-linear-gradient(180deg, transparent 0 39px, {LINE} 39px 40px); border: 1px solid #E5DFD2; box-shadow: 0 2px 0 #EFE9DC, 0 14px 30px rgba(23,32,51,.14); padding: 30px 40px 34px 92px">
      <div aria-hidden="true" style="position: absolute; left: 66px; top: 0; bottom: 0; width: 2px; background: rgba(239,68,68,.5)"></div>
      <div aria-hidden="true" style="position: absolute; left: 20px; top: 0; bottom: 0; display: flex; flex-direction: column; justify-content: space-around">{'<span style="width: 18px; height: 18px; border-radius: 50%; background: #F4F0E8; box-shadow: inset 0 2px 3px rgba(0,0,0,.18)"></span>' * 3}</div>
      <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 16px">
        <div>
          <div style="{MONO_F}; font-size: 11px; letter-spacing: .2em; color: #566072">AIGO · PLAYER QUESTIONNAIRE · NO. 0001</div>
          <div style="{HAND_F}; font-size: 54px; font-weight: 700; color: #172033; line-height: 1">All about me ✎</div>
        </div>
        <div style="text-align: right; {MONO_F}; font-size: 11px; line-height: 1.8; color: #566072">
          <div><span style="{HAND_F}; font-size: 22px; color: {PENCIL}">pencil</span> = demo answer, locked</div>
          <div><span style="{HAND_F}; font-size: 22px; color: {INK}">blue ink</span> = your answer</div>
        </div>
      </div>

      {row(f'''{q(1, "My name is")}
        <label style="display: flex; align-items: flex-end; gap: 10px; margin-top: 2px">
          <span style="position: absolute; left: -9999px">Your name</span>
          <input value="{{{{name}}}}" onChange="{{{{setName}}}}" aria-describedby="nameHint" style="width: 320px; border: 0; border-bottom: 2px solid #4B5563; background: transparent; outline: none; {HAND_F}; font-size: 38px; font-weight: 700; color: {{{{nameColor}}}}; padding: 0 4px">
          <span id="nameHint" style="{MONO_F}; font-size: 10.5px; letter-spacing: .12em; color: {{{{tagColor}}}}; border: 1px dashed {{{{tagColor}}}}; padding: 2px 6px; margin-bottom: 8px">{{{{nameTag}}}}</span>
        </label>''')}
      {row(f'{q(2, "I work as")}<div style="margin-top: 2px">{pencil("an office manager", 30)}{lock()}</div>')}
      {row(f'{q(3, "How do I use AI now?", "tick one", True)}{ticks(["only chat: questions & answers", "tried an AI agent", "work with agents often"], "only chat: questions & answers")}')}
      {row(f'{q(4, "Who do I want to become?", "circle it", True)}{circled(["everyday user", "power user", "automator", "my own Jarvis"], "automator")}')}
      {row(f'{q(5, "Why?", "underline", True)}{underlined(["grow at my job", "change careers", "my own project"], "grow at my job")}')}
      {row(f'''{q(6, "How should Claude teach me?", "pick a sticker!")}
        <div style="display: flex; flex-wrap: wrap; gap: 22px; margin: 14px 0 4px 6px">{sticker("Mentor", "explains why, step by step", "sM", -2)}{sticker("Straight talk", "short tasks, no fluff", "sS", 1.5)}</div>''')}
      {row(f'''{q(7, "My AI", "", True)}
        <div style="display: flex; flex-wrap: wrap; gap: 6px 26px; margin: 6px 0 0 6px; {HAND_F}; font-size: 26px"><span style="color: {PENCIL}">Claude Chat ✓</span><span style="color: #9AA0A8; text-decoration: line-through">Claude Code</span><span style="color: #9AA0A8; text-decoration: line-through">ChatGPT</span><span style="color: #9AA0A8; text-decoration: line-through">Gemini</span><span style="color: #9AA0A8; font-size: 20px">← later!</span></div>''')}
      {row(f'{q(8, "My Claude plan", "circle it", True)}{circled(["Free", "Pro", "Max"], "Pro")}')}
      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px; {HAND_F}; font-size: 28px; color: #8A6D3B"><span>Thank you for filling it in! ☺</span><span aria-hidden="true" style="font-size: 36px; color: #E2A300; transform: rotate(12deg)">★</span></div>
    </form>'''

benefits = [("Items made for your job", "Examples from your work, in the tone you picked."),
            ("Learn inside your own Claude", "No new app to live in. Paste an item, start learning."),
            ("Proof, not points", "Stars and stamps only when Claude checks your work."),
            ("Nothing expires", "No streaks, no timers. Come back whenever you like.")]
ben_html = "".join(f'<li style="display: flex; gap: 12px; padding: 12px 0; border-top: 1px dashed #DCD4C4"><span style="{DISPLAY}; font-size: 22px; color: #2563EB; line-height: 1">{i + 1:02d}</span><div><div style="font-weight: 600">{t}</div><div style="font-size: 14px; color: #566072; margin-top: 2px">{d}</div></div></li>' for i, (t, d) in enumerate(benefits))

aside = f'''<aside aria-label="Why you're filling this in" style="flex: 1 1 340px; min-width: 0; display: flex; flex-direction: column; gap: 16px; position: sticky; top: 16px">
      <div style="background: #FFFFFF; border: 1px solid #DCD4C4; border-top: 4px solid #2563EB; padding: 18px 20px; {CUT_TR}">
        <div style="{MONO_F}; font-size: 11px; letter-spacing: .18em; color: #2563EB">WHY YOU'RE FILLING THIS IN</div>
        <ul style="list-style: none; margin: 8px 0 0; padding: 0; font-size: 15px">{ben_html}</ul>
      </div>
      <div style="background: #0B1020; border: 1px solid #1E2A3D; padding: 14px 16px; {MONO_F}; font-size: 13.5px; line-height: 1.6; color: #D5DBEC">
        <div style="font-size: 11px; letter-spacing: .16em; color: #7C8BAA">HOW CLAUDE WILL GREET YOU · {{{{styleName}}}}</div>
        <div style="margin-top: 8px"><span style="color: #FF8AD9">claude ›</span> {{{{greeting}}}}</div>
      </div>
      <div style="display: flex; gap: 14px; align-items: center; background: #FFFFFF; border: 1px solid #DCD4C4; padding: 14px 16px">
        {stamp("Player One", "gift", 72, -6)}
        <div><div style="font-weight: 600">Your first stamp is a gift</div><div style="font-size: 13.5px; color: #566072; margin-top: 2px; line-height: 1.45">It lands in your stamp book with your collection. The other 12 you earn by doing.</div></div>
      </div>
      {btn("Make my items ▸", "V4Collection.dc.html", "blue")}
      <div style="{MONO_F}; font-size: 11.5px; letter-spacing: .08em; color: #566072">SET 01 IS FREE: THE KEY, THE LOCK AND THE COMPASS</div>
    </aside>'''

body = f'''{topbar()}
  <main style="max-width: 1240px; margin: 0 auto; padding: 28px 24px 64px">
    {kicker("00", "About you · one minute")}
    {h1("Let's make your items", 60)}
    <p style="margin: 8px 0 24px; color: #566072; font-size: 16px; max-width: 680px">Your answers pick the examples, the order of lessons and how Claude talks to you. No account.</p>
    <div style="display: flex; flex-wrap: wrap; gap: 30px; align-items: flex-start">{sheet}{aside}</div>
  </main>
'''

js = '''class Component extends DCLogic {
  constructor(props) { super(props); this.state = { style: 'Mentor', name: 'John', edited: false }; }
  renderVals() {
    const self = this; const st = this.state || {}; const s = st.style || 'Mentor';
    const nm = (st.name || '').trim() || 'there';
    const v = {
      name: st.name, nameColor: st.edited ? '#1D3FB8' : '#7B7F86',
      nameTag: st.edited ? 'YOUR ANSWER ✓' : 'DEMO · TYPE YOUR OWN', tagColor: st.edited ? '#1D3FB8' : '#7B7F86',
      setName: (e) => self.setState({ name: e.target.value, edited: true }),
      styleName: s.toUpperCase(),
      greeting: s === 'Mentor' ? 'Hi ' + nm + "! I'm your coach for this item. Three short lessons on your real work, and I'll explain why each step matters." : nm + '. Three lessons, ten minutes. Short tasks from your job. Go.',
      picksM: () => self.setState({ style: 'Mentor' }), picksS: () => self.setState({ style: 'Straight talk' })
    };
    [['Mentor', 'sM'], ['Straight talk', 'sS']].forEach(([n, k]) => {
      const on = s === n;
      v[k + 'P'] = on ? 'true' : 'false'; v[k + 'B'] = on ? '#1D3FB8' : '#9AA0A8'; v[k + 'Bs'] = on ? 'solid' : 'dashed';
      v[k + 'Bg'] = on ? '#EEF2FF' : '#FFFEFA'; v[k + 'C'] = on ? '#1D3FB8' : '#6B7280'; v[k + 'Sh'] = on ? '0 6px 14px rgba(29,63,184,.18)' : 'none'; v[k + 'Tag'] = on ? 'block' : 'none';
    });
    return v;
  }
}'''
open(sys.argv[1] + "/project/V4Start.dc.html", "w").write(page("Questionnaire", body, 1450, js))
print("ok")
