import sys
sys.path.insert(0, sys.argv[1])
from gen4_common import *

W = 150
def frame(n, title, ms, inner, note):
    return f'''<div style="flex: 1 1 0; display: flex; flex-direction: column; gap: 10px; align-items: center">
          <div style="width: 100%; height: 250px; border-radius: 6px; background: #EFEBE2; border: 1px solid #DCD4C4; display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden">{inner}</div>
          <div style="{MONO_F}; font-size: 11px; letter-spacing: .12em; color: #566072">{n} · {ms}</div>
          <div style="{HEAD_F}; font-weight: 700; font-size: 15px">{title}</div>
          <div style="font-size: 12.5px; color: #566072; text-align: center; line-height: 1.45">{note}</div>
        </div>'''

sil = f'<div style="width: {W}px; height: {round(W*1.4)}px; border-radius: 10px; border: 2px dashed #9CA3AF; display: flex; align-items: center; justify-content: center"><div style="width: 54px; height: 54px; border-radius: 50%; border: 2px dashed #9CA3AF"></div></div>'
glint = f'<div style="width: {W}px; height: {round(W*1.4)}px; border-radius: 10px; {night_sky()} transform: rotate(-2deg); position: relative; overflow: hidden"><div style="position: absolute; inset: 0; background: linear-gradient(115deg, transparent 35%, rgba(255,255,255,.55) 48%, transparent 60%)"></div></div>'
glow = f'<div style="width: {W}px; height: {round(W*1.4)}px; border-radius: 10px; background: radial-gradient(ellipse at 50% 45%, rgba(74,222,128,.85), #0E1A33 72%); box-shadow: 0 0 0 8px rgba(74,222,128,.25), 0 0 36px rgba(74,222,128,.55)"></div>'
pause = f'<div style="width: {W}px; height: {round(W*1.4)}px; border-radius: 10px; background: radial-gradient(ellipse at 50% 45%, rgba(74,222,128,.65), #0E1A33 72%); box-shadow: 0 0 0 4px rgba(74,222,128,.2)"></div>'
flip = f'<div style="transform: perspective(600px) rotateY(18deg)">{card("help", "One Better Move", "3/3", "Help · ~1 min", "One better move.", 0, W)}</div>'
done = card("help", "One Better Move", "3/3", "Help · ~1 min", "One better move.", 0, W, "new")

frames = (frame(1, "The empty pocket", "tap", sil, "A dashed outline in the card's shape. Button: Create card.")
          + frame(2, "A glint", "300 ms", glint, "Card back appears, one light sweep, a tiny tilt. No shaking.")
          + frame(3, "A hint of the type", "300 ms", glow, "The back glows in the card's color before you see the face.")
          + frame(4, "A short pause", "800 ms", pause, "The only moment of suspense. Skippable.")
          + frame(5, "The flip", "300 ms", flip, "The face: item art, name and rarity mark ● ◆ ★.")
          + frame(6, "New card", "400 ms", done, "NEW! tag, then the item story in one line; the card settles into its pocket."))

body = f'''<div style="width: 1440px; box-sizing: border-box; padding: 40px 56px; display: flex; flex-direction: column; gap: 26px">
  <div style="display: flex; justify-content: space-between; align-items: flex-end; gap: 20px">
    <div>
      {label("Motion · creating a card")}
      <h1 style="margin: 8px 0 0; {HEAD_F}; font-weight: 800; font-size: 34px">The reveal, in six frames</h1>
    </div>
    <p style="margin: 0; max-width: 560px; color: #566072; font-size: 15px; line-height: 1.55">Borrowed from card-pack openings, without the gambling: the card is already yours, nothing is random. Total about 2.1 s. A Skip button appears from frame 2. With reduced motion: a simple fade.</p>
  </div>
  <div style="display: flex; gap: 16px">{frames}</div>
</div>
'''
open(sys.argv[1] + "/project/V4Reveal.dc.html", "w").write(page("Card reveal", body, 760))
print("ok")
