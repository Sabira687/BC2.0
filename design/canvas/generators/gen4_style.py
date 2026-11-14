import sys
sys.path.insert(0, sys.argv[1])
from gen4_common import *

sw = "".join(f'''<div style="display: flex; flex-direction: column; gap: 6px">
          <div style="height: 56px; border-radius: 4px; border: 1px solid #DCD4C4; background: {hexv}"></div>
          <div style="{MONO_F}; font-size: 11px">{name}</div><div style="{MONO_F}; font-size: 11px; color: #566072">{hexv}</div></div>''' for name, hexv in [
    ("paper", "#F4F0E8"), ("sheet", "#FFFFFF"), ("ink", "#172033"), ("muted", "#566072"), ("line", "#DCD4C4"), ("night", "#0E1A33"),
    ("learn", "#2563EB"), ("test", "#A21CAF"), ("help", "#15803D"), ("star", "#E2A300"), ("holo", HOLO_FRAME), ("stamp ink", "#15803D")])

cards = (card("learn", "The Clear Ask", "1/3", "Learn · 3 lessons · ~10 min", "Ask once. Get it right.", 2, 220)
         + card("test", "The Clear Ask", "2/3", "Test · 5 tasks · ~5 min", "Prove it in five tasks.", 3, 220, "holo")
         + card("help", "One Better Move", "3/3", "Help · any task · ~1 min", "One better move, right when you need it.", 0, 220)
         + card("learn", "", "", "Free · after the demo", "", 0, 220, "locked", "S05", "rare")
         + card("learn", "", "", "Premium · Automator path", "", 0, 220, "locked", "S12", "legendary"))

captions = "".join(f'<div style="width: 220px; {MONO_F}; font-size: 11px; color: #566072; letter-spacing: .1em">{c}</div>' for c in ["LEARN · ● COMMON · ★★☆", "TEST · HOLOGRAPHIC · ★★★", "HELP · TOOL · NO STARS", "LOCKED · ◆ RARE · FREE", "LOCKED · ★ LEGENDARY · PREMIUM"])

stamps = (stamp("Player One", "gift", 104, -8) + stamp("Brief formula", "easy", 104, 6) + stamp("Examples", "medium", 104, -4)
          + stamp("Self-critique", "hard", 104, 9) + stamp("", "easy", 104, 0, False))

rows = [("▶ ITEM ACTIVATED · LEARN · Three-Tooth Key", "Composer frame glows in the card's color; “LEARN inserted” chip"),
        ("✅ CHECK PASSED · ★★☆", "Stars fill on the mini card; progress bar steps forward"),
        ("STAMP EARNED · Brief formula", "Stamp lands in the stamp book with a soft press"),
        ("TEST COMPLETE · ★★★ · 90/100", "Result page: stars, holographic card if ★★★"),
        ("HELP USED", "Help counted toward the set badge")]
mapping = "".join(f'''<tr><td style="padding: 10px 12px; border-top: 1px solid #DCD4C4; {MONO_F}; font-size: 12.5px; color: #172033">{a}</td><td style="padding: 10px 12px; border-top: 1px solid #DCD4C4; font-size: 14px; color: #566072">{b}</td></tr>''' for a, b in rows)

body = f'''<div style="width: 1440px; box-sizing: border-box; padding: 56px 64px; display: flex; flex-direction: column; gap: 44px">
  <div style="display: flex; justify-content: space-between; align-items: flex-end; gap: 24px; border-bottom: 1px solid #DCD4C4; padding-bottom: 22px">
    <div>
      {label("AIGO Collection · v4 design system")}
      <h1 style="margin: 10px 0 0; {HEAD_F}; font-weight: 800; font-size: 48px; line-height: 1.05">The collector's album</h1>
    </div>
    <p style="margin: 0; max-width: 560px; font-size: 16px; line-height: 1.6; color: #566072">A learning product first. Play lives in four places only: <strong style="color: #172033">cards, stamps, stars and the reveal</strong>. Everything else reads like a calm, well-made textbook.</p>
  </div>

  <section style="display: flex; gap: 48px">
    <div style="flex: 3">
      {label("Palette")}
      <div style="display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 12px; margin-top: 14px">{sw}</div>
    </div>
    <div style="flex: 2; display: flex; flex-direction: column; gap: 10px">
      {label("Type")}
      <div style="{DISPLAY}; font-size: 44px; line-height: 1">Barlow Condensed 800 · Headings</div>
      <div style="font-size: 17px; line-height: 1.6">IBM Plex Sans · Body text that a tired person can read after work. Same type as the landing; the platform stays light.</div>
      <div style="{MONO_F}; font-size: 14px">IBM Plex Mono · ✅ CHECK PASSED · ★★☆</div>
      <div style="font-size: 13px; color: #566072">The mono line is the same text the AI prints in chat, so the site and the chat speak one language.</div>
    </div>
  </section>

  <section>
    {label("Cards · 5:7 · type = frame color + mark ■ ▲ ● · every card is an item with its own art and story · rarity ● common ◆ rare ★ legendary")}
    <div style="display: flex; gap: 28px; margin-top: 18px; align-items: flex-end">{cards}</div>
    <div style="display: flex; gap: 28px; margin-top: 12px">{captions}</div>
  </section>

  <section style="display: flex; gap: 48px; align-items: flex-start">
    <div style="flex: 1">
      {label("Stamps · rubber ink, color by difficulty")}
      <div style="display: flex; gap: 22px; margin-top: 18px; align-items: center">{stamps}</div>
      <div style="margin-top: 22px; display: flex; gap: 22px; align-items: center">
        {label("Stars")}
        {stars_html(3, 24)} {stars_html(2, 24)} {stars_html(1, 24)}
        <span style="font-size: 13px; color: #566072">always paired with text: “2 of 3 stars”</span>
      </div>
    </div>
    <div style="flex: 1">
      {label("Chat line → what the site shows")}
      <table style="width: 100%; border-collapse: collapse; margin-top: 14px; background: #FFFFFF; border: 1px solid #DCD4C4">{mapping}</table>
    </div>
  </section>

  <section style="display: flex; gap: 40px; align-items: center; border-top: 1px solid #DCD4C4; padding-top: 28px">
    {label("Controls")}
    {btn("Create card")}
    {btn("Take it to your Claude", "#", "ghost")}
    <span style="display: inline-flex; align-items: center; gap: 8px; background: #EFF6FF; border: 1.5px solid #2563EB; color: #1E3A8A; padding: 8px 12px; border-radius: 4px; {MONO_F}; font-size: 12px">■ LEARN · Three-Tooth Key inserted</span>
    <span style="background: #FDE68A; padding: 5px 8px; border-radius: 3px; {MONO_F}; font-size: 11px; letter-spacing: .12em">DEMO</span>
    <span style="font-size: 13px; color: #566072">No streaks · no timers · no points · nothing random</span>
  </section>
</div>
'''
open(sys.argv[1] + "/project/V4Style.dc.html", "w").write(page("v4 style board", body, 1420))
print("ok")
