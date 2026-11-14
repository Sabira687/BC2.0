"""v5 item page: the page IS the expanded card. Item floats at the top; a game-style tooltip of stats; then usage."""
import sys
sys.path.insert(0, sys.argv[1])
from gen4_common import *
from gen4_art import ART, ITEMS

name, lore = ITEMS["learn"]
BLUE = "#60A5FA"

stage = f'''<section aria-label="Item" style="position: relative; overflow: hidden; background: radial-gradient(ellipse at 50% 42%, #1E3A8A 0%, #0E1A33 46%, #050611 100%); padding: 34px 24px 40px; text-align: center; color: #FFFFFF">
    <div aria-hidden="true" class="v4-twinkle" style="position: absolute; inset: 0; background-image: radial-gradient(1px 1px at 12% 20%, #fff 50%, transparent 51%), radial-gradient(1px 1px at 82% 16%, #BAE6FD 50%, transparent 51%), radial-gradient(1.5px 1.5px at 70% 70%, #fff 50%, transparent 51%), radial-gradient(1px 1px at 22% 78%, #F5D0FE 50%, transparent 51%), radial-gradient(1px 1px at 48% 10%, #fff 50%, transparent 51%)"></div>
    <a href="V4Collection.dc.html" style="position: absolute; left: 24px; top: 20px; text-decoration: none; {MONO_F}; font-size: 12px; letter-spacing: .14em; color: #9FB0CF">◂ COLLECTION</a>
    <div style="position: relative; {MONO_F}; font-size: 12px; letter-spacing: .22em; color: {BLUE}">■ LEARN ITEM · SET 01 · NO. 1/3</div>
    <div style="position: relative; width: 300px; height: 300px; margin: 10px auto 0" class="v5-float">
      <div aria-hidden="true" style="position: absolute; inset: 30px; border-radius: 50%; background: radial-gradient(circle, rgba(96,165,250,.55), rgba(96,165,250,0) 70%)"></div>
      <div style="position: relative; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center">{ART["learn"]}</div>
    </div>
    <div aria-hidden="true" style="width: 220px; height: 22px; margin: -6px auto 0; border-radius: 50%; background: radial-gradient(ellipse, rgba(96,165,250,.45), rgba(96,165,250,0) 70%)"></div>
    <h1 style="position: relative; margin: 12px 0 6px; {DISPLAY}; font-size: 76px; line-height: .9">{name}</h1>
    <div style="position: relative; display: inline-flex; gap: 14px; align-items: center; {MONO_F}; font-size: 12.5px; letter-spacing: .16em">
      <span style="border: 1px solid #94A3B8; color: #E2E8F0; padding: 4px 10px">● COMMON</span>
      <span style="color: #FCD34D; font-size: 18px; letter-spacing: 3px">★<span style="color: #3B4D74">★★</span></span>
      <span style="color: #9FB0CF">1 OF 3 STARS</span>
    </div>
  </section>'''


def stat(label_, value):
    return f'<div style="display: contents"><span style="{MONO_F}; font-size: 12px; letter-spacing: .12em; color: #7C8BAA; padding: 5px 0">{label_}</span><span style="color: #E2E8F0; padding: 5px 0">{value}</span></div>'


tooltip = f'''<section aria-label="Item stats" style="background: #0B1020; color: #E2E8F0; border: 1px solid {BLUE}; outline: 1px solid #1E2A3D; outline-offset: 4px; padding: 22px 24px; {BODY_F}; font-size: 15px; line-height: 1.5">
      <div style="display: flex; justify-content: space-between; align-items: baseline; gap: 12px">
        <div style="{DISPLAY}; font-size: 30px; color: #FFFFFF">{name}</div>
        <div style="{MONO_F}; font-size: 12px; letter-spacing: .14em; color: #CBD5E1">● COMMON</div>
      </div>
      <div style="color: #9FB0CF">Learn item · Set 01 · The Clear Ask</div>
      <div style="height: 1px; background: #1E2A3D; margin: 12px 0"></div>
      <div style="display: grid; grid-template-columns: 150px 1fr">
        {stat("LESSONS", "3 lessons + a final task")}
        {stat("TIME", "about 10 minutes")}
        {stat("PRACTICE ON", "your emails, reports, meeting notes")}
        {stat("WORKS IN", "AIGO console · your own Claude")}
        {stat("STARS", '<span style="color: #FCD34D">★</span><span style="color: #3B4D74">★★</span> · next star: finish Lesson 1.2')}
      </div>
      <div style="height: 1px; background: #1E2A3D; margin: 12px 0"></div>
      <div style="color: #4ADE80">+ Teaches: say who you are, what you need and how it should look</div>
      <div style="color: #4ADE80">+ Stamp: Brief formula <span style="color: #86EFAC">✓ earned</span></div>
      <div style="color: #4ADE80">+ Stamp: Explicit format</div>
      <div style="color: #4ADE80">+ Stamp: Your material</div>
      <div style="margin-top: 10px; color: #6AF7FF"><b>Use:</b> paste into a new chat. Claude becomes your coach for The Clear Ask.</div>
      <div style="margin-top: 12px; color: #FCD34D; font-style: italic">“{lore}”</div>
    </section>'''

lessons = [("1.1", "The brief formula", "✓ DONE · ★", "#15803D"), ("1.2", "Ask for the shape", "▸ NEXT", "#2563EB"), ("1.3", "Give it the material", "LOCKED", "#6F6858"), ("FINAL", "Weekly report", "LOCKED", "#6F6858")]
quest = "".join(f'<li style="display: flex; justify-content: space-between; gap: 12px; padding: 10px 0; border-top: 1px dashed #DCD4C4"><span><span style="{MONO_F}; font-size: 12px; color: #566072">{n}</span>&nbsp; {t}</span><span style="{MONO_F}; font-size: 12px; letter-spacing: .1em; color: {c}">{s}</span></li>' for n, t, s, c in lessons)

steps = [("1", "Copy the item", "A short block of text with the lessons inside."), ("2", "Paste into a new chat", "In the AIGO console or in your own Claude."), ("3", "Look for ▶ ITEM ACTIVATED", "Claude is now your coach. Stars come when it checks your work.")]
steps_html = "".join(f'<div style="flex: 1 1 200px; border: 1px solid #DCD4C4; background: #FFFFFF; padding: 16px; {CUT_TR}"><div style="{DISPLAY}; font-size: 40px; line-height: .9; color: #2563EB">{n}</div><div style="font-weight: 600; margin-top: 6px">{t}</div><div style="font-size: 14px; color: #566072; margin-top: 4px; line-height: 1.5">{d}</div></div>' for n, t, d in steps)

usage = f'''<section aria-label="How to use" style="display: flex; flex-direction: column; gap: 16px">
      {kicker("02", "How to use it")}
      <div style="display: flex; flex-wrap: wrap; gap: 12px">{steps_html}</div>
      <div style="display: flex; flex-wrap: wrap; gap: 10px; align-items: center">
        <button onClick="{{{{copy}}}}" style="cursor: pointer; border: 0; background: #172033; color: #FFFFFF; padding: 15px 24px; {MONO_F}; font-size: 13px; letter-spacing: .14em; {CUT}">{{{{copyLabel}}}}</button>
        {btn("Open in console ▸", "V4Console.dc.html", "blue")}
        {btn("Use in your own Claude ↗", "V4Guide.dc.html", "ghost")}
      </div>
      <div style="display: flex; flex-wrap: wrap; gap: 16px; align-items: flex-start">
        <div style="flex: 1 1 320px; background: #FFFFFF; border: 1px solid #DCD4C4; padding: 16px 18px">
          <div style="{MONO_F}; font-size: 11px; letter-spacing: .18em; color: #566072">QUEST LOG · LESSONS INSIDE</div>
          <ul style="list-style: none; margin: 8px 0 0; padding: 0; font-size: 15px">{quest}</ul>
        </div>
        <details style="flex: 1 1 320px; background: #FFFFFF; border: 1px solid #DCD4C4">
          <summary style="cursor: pointer; padding: 16px 18px; {MONO_F}; font-size: 11.5px; letter-spacing: .14em; color: #566072">WHAT YOU'LL PASTE · THE ITEM AS TEXT</summary>
          <pre style="margin: 0; padding: 0 18px 18px; {MONO_F}; font-size: 12px; line-height: 1.6; color: #1E3A8A; white-space: pre-wrap">■ AIGO ITEM · LEARN · Three-Tooth Key · Set 01 · 1/3
For John · Mentor style
⟦item-data v1⟧
SW0gaW5zZXJ0aW5nIGFuIEFJR08gTEVBUk4gY2FyZC4gRnJvbSBub3cgb24s…
⟦/item-data⟧</pre>
        </details>
      </div>
    </section>'''

body = f'''{header("Collection")}
  {stage}
  <main style="max-width: 860px; margin: 0 auto; padding: 0 24px 64px; display: flex; flex-direction: column; gap: 28px">
    <div style="margin-top: -26px; position: relative">{tooltip}</div>
    {usage}
  </main>
'''
js = '''class Component extends DCLogic {
  constructor(props) { super(props); this.state = { copied: false }; }
  componentWillUnmount() { clearTimeout(this.t); }
  renderVals() {
    const self = this;
    return {
      copyLabel: (this.state && this.state.copied) ? 'COPIED ✓ NOW PASTE IT' : 'COPY ITEM',
      copy: () => { self.setState({ copied: true }); clearTimeout(self.t); self.t = setTimeout(() => self.setState({ copied: false }), 2600); }
    };
  }
}'''
open(sys.argv[1] + "/project/V4Card.dc.html", "w").write(page("Three-Tooth Key", body, 1650, js))
print("ok")
