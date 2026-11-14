"""v5 collection: compact set binders, many locked items visible, bright counter, cards lift on hover."""
import sys
sys.path.insert(0, sys.argv[1])
from gen4_common import *

W = 100
CORE = [("01", "The Clear Ask", "common"), ("02", "Iterate", "common"), ("03", "Show, Don't Tell", "common"), ("04", "Structure", "rare"),
        ("05", "Trust but Verify", "rare"), ("06", "Your Material", "rare"), ("07", "Projects", "rare")]
PREM = [("08", "Artifacts", "Power user"), ("09", "Research", "Power user"), ("10", "Files & Data", "Power user"), ("11", "Skills", "Power user"),
        ("12", "Claude Code", "Automator"), ("13", "Agents", "Automator"), ("14", "Connectors", "Automator"), ("15", "Automations", "Automator")]
RCOL = {"common": "#64748B", "rare": "#0E7490", "legendary": "#B45309"}
RSYM = {"common": "● COMMON", "rare": "◆ RARE", "legendary": "★ LEGENDARY"}


def sleeve(inner, href=None):
    tag = "a" if href else "div"
    attrs = f' href="{href}" style="text-decoration: none; display: block"' if href else ''
    return f'<{tag}{attrs} class="v5-lift" tabindex="0" style="display: block; border-radius: 10px">{inner}</{tag}>' if not href else f'<a href="{href}" class="v5-lift" style="display: block; text-decoration: none; border-radius: 10px">{inner}</a>'


def set_tile(code, title, rarity, owned=False, sub="", premium=False):
    if owned:
        cards = (sleeve(card("learn", "", "1/3", "Learn · 3 lessons", "Ask once.", 1, W), "V4Card.dc.html")
                 + sleeve(card("test", "", "2/3", "Test · 5 tasks", "Prove it.", 0, W))
                 + sleeve(card("help", "", "3/3", "Help · ~1 min", "One move.", 0, W, "new")))
    else:
        lk = card("learn", "", "", "", "", 0, W, "locked", "S" + code, rarity).replace("You'll see it later", "Premium" if premium else "Free")
        cards = sleeve(lk) * 3
    border = "2px solid #172033" if owned else ("1px solid #E7C99A" if premium else "1px solid #DCD4C4")
    bg = "#FFFFFF" if owned else ("#FFFBF2" if premium else "#FBF9F4")
    status = '<span style="color: #15803D">3 / 3 ✓</span>' if owned else f'<span style="color: #6F6858">0 / 3</span>'
    foot = (f'<div style="display: flex; justify-content: space-between; {MONO_F}; font-size: 10.5px; letter-spacing: .1em; color: #566072; border-top: 1px dashed #DCD4C4; padding-top: 8px">'
            f'<span>BADGE · 0 OF 3 STEPS</span><span style="color: #2563EB">NEXT: LESSON 1.2 ▸</span></div>') if owned else \
           f'<div style="{MONO_F}; font-size: 10.5px; letter-spacing: .1em; color: #6F6858; border-top: 1px dashed #DCD4C4; padding-top: 8px">{sub}</div>'
    return f'''<section aria-label="Set {code}: {title}" style="background: {bg}; border: {border}; padding: 14px 16px 12px; display: flex; flex-direction: column; gap: 10px; {CUT_TR}">
        <div style="display: flex; justify-content: space-between; align-items: baseline; gap: 8px">
          <div><div style="{MONO_F}; font-size: 10.5px; letter-spacing: .16em; color: {RCOL[rarity]}">SET {code} · {RSYM[rarity]}</div>
          <div style="{DISPLAY}; font-size: 22px; line-height: 1; margin-top: 2px; color: {'#172033' if owned else '#3F4A5C'}">{title}</div></div>
          <div style="{MONO_F}; font-size: 11.5px">{status}</div>
        </div>
        <div style="display: flex; gap: 10px; justify-content: space-between; padding: 6px 0 4px">{cards}</div>
        {foot}
      </section>'''


core_tiles = "".join(set_tile(c, t, r, owned=(c == "01"), sub="FREE · COMES AFTER THE DEMO") for c, t, r in CORE)
prem_tiles = "".join(set_tile(c, t, "legendary", sub=f"PREMIUM · {p.upper()} PATH", premium=True) for c, t, p in PREM)

cells = "".join(f'<span style="flex: 1; height: 14px; background: {"linear-gradient(180deg, #6AF7FF, #3B82FF)" if i < 3 else ("#1E2A3D" if i < 21 else "#2A2010")}; {"box-shadow: 0 0 8px #6AF7FF;" if i < 3 else ""}"></span>' for i in range(45))
counter = f'''<div style="{night_sky('')} padding: 18px 22px; min-width: 460px; flex: 1 1 460px; color: #FFFFFF; {CUT_TR}">
      <div style="display: flex; align-items: flex-end; justify-content: space-between; gap: 16px">
        <div>
          <div style="{MONO_F}; font-size: 11px; letter-spacing: .22em; color: #6AF7FF">ITEMS COLLECTED</div>
          <div style="{DISPLAY}; font-size: 72px; line-height: .85"><span style="color: #6AF7FF; text-shadow: 0 0 16px rgba(106,247,255,.6)">{{{{owned}}}}</span><span style="color: #5E6E91"> / 45</span></div>
        </div>
        <div style="display: flex; gap: 22px; {MONO_F}; font-size: 11px; letter-spacing: .14em; color: #9FB0CF; text-align: right">
          <div><div style="{DISPLAY}; font-size: 30px; color: #FFFFFF; letter-spacing: 0">2<span style="color: #3B4D74">/13</span></div>STAMPS</div>
          <div><div style="{DISPLAY}; font-size: 30px; color: #FFFFFF; letter-spacing: 0">0<span style="color: #3B4D74">/15</span></div>SET BADGES</div>
        </div>
      </div>
      <div style="display: flex; gap: 3px; margin-top: 14px">{cells}</div>
      <div style="display: flex; justify-content: space-between; margin-top: 8px; {MONO_F}; font-size: 10.5px; letter-spacing: .14em; color: #7C8BAA"><span>21 FREE ITEMS</span><span style="color: #FCD34D">24 PREMIUM ITEMS · NEW ONES EVERY MONTH</span></div>
    </div>'''


def seg(items, active):
    return "".join(f'<button style="cursor: pointer; border: 1px solid {"#172033" if i == active else "#DCD4C4"}; background: {"#172033" if i == active else "#FFFFFF"}; color: {"#FFFFFF" if i == active else "#172033"}; padding: 8px 12px; {MONO_F}; font-size: 11.5px; letter-spacing: .12em">{t}</button>' for i, t in enumerate(items))


toolbar = f'''<div role="toolbar" aria-label="Sort and filter" style="display: flex; flex-wrap: wrap; align-items: center; gap: 10px 18px; border-top: 1px solid #DCD4C4; border-bottom: 1px solid #DCD4C4; padding: 10px 0">
      <span style="{MONO_F}; font-size: 11px; letter-spacing: .16em; color: #566072">SORT BY</span>
      <div style="display: flex">{seg(["SET", "SKILL", "RARITY"], 0)}</div>
      <span style="{MONO_F}; font-size: 11px; letter-spacing: .16em; color: #566072; margin-left: 8px">TYPE</span>
      <div style="display: flex">{seg(["ALL", "■ LEARN", "▲ TEST", "● HELP"], 0)}</div>
      <label style="margin-left: auto; display: flex; gap: 8px; align-items: center; {MONO_F}; font-size: 11.5px; letter-spacing: .1em"><input type="checkbox" checked> SHOW LOCKED</label>
    </div>'''

body = f'''{header("Collection")}
  <main style="max-width: 1240px; margin: 0 auto; padding: 26px 24px 64px; display: flex; flex-direction: column; gap: 20px">
    <section style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-end; gap: 20px">
      <div>
        {kicker("01", "Collection · John")}
        {h1("Your collection", 64)}
        <p style="margin: 8px 0 0; color: #566072; font-size: 16px; max-width: 520px">Every item teaches one way to work with AI. Collect a set to earn its badge. Nothing expires.</p>
      </div>
      {counter}
    </section>

    <section aria-label="Next step" style="display: flex; flex-wrap: wrap; align-items: center; gap: 14px; background: #FFFFFF; border: 1px solid #DCD4C4; border-left: 4px solid #2563EB; padding: 14px 18px">
      <div style="flex: 1 1 360px"><span style="{MONO_F}; font-size: 11px; letter-spacing: .18em; color: #2563EB">NEXT STEP ·</span> <b>Lesson 1.2 · Ask for the shape</b> <span style="color: #566072">with the Three-Tooth Key · about 5 minutes</span></div>
      {btn("Open console ▸", "V4Console.dc.html")}
      {btn("Use in your Claude ↗", "V4Guide.dc.html", "ghost")}
    </section>

    {toolbar}

    <div style="display: flex; justify-content: space-between; align-items: baseline"><div style="{DISPLAY}; font-size: 28px">Core path <span style="color: #15803D">· free</span></div><div style="{MONO_F}; font-size: 11px; letter-spacing: .14em; color: #566072">SETS 01–07 · 21 ITEMS · THIS DEMO OPENS SET 01</div></div>
    <div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px">{core_tiles}</div>

    <div style="display: flex; justify-content: space-between; align-items: baseline; margin-top: 10px"><div style="{DISPLAY}; font-size: 28px">Premium paths <span style="color: #B45309">· ★ legendary</span></div><a href="V4Pass.dc.html" style="{MONO_F}; font-size: 11px; letter-spacing: .14em; color: #B45309">SETS 08–15 · 24 ITEMS · SEE PREMIUM ▸</a></div>
    <div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px">{prem_tiles}</div>
    <p style="margin: 6px 0 0; text-align: center; {MONO_F}; font-size: 12px; letter-spacing: .1em; color: #566072">MORE KINDS OF ITEMS ARE ON THE WAY · YOUR ITEMS WAIT FOR YOU</p>
  </main>
'''
js = '''class Component extends DCLogic {
  renderVals() { return { owned: 3 }; }
}'''
open(sys.argv[1] + "/project/V4Collection.dc.html", "w").write(page("Collection", body, 2250, js))
print("ok")
