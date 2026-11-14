"""Shared building blocks for the AIGO v4 canvas boards ("Collector's album")."""

FONTS = "https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&amp;family=IBM+Plex+Mono:wght@400;500;600&amp;family=IBM+Plex+Sans:ital,wght@0,400;0,500;0,600;1,400&amp;family=Caveat:wght@500;700&amp;display=swap"

C = {
    "paper": "#F4F0E8", "sheet": "#FFFFFF", "ink": "#172033", "muted": "#566072", "line": "#DCD4C4",
    "night": "#0E1A33", "learn": "#2563EB", "test": "#A21CAF", "help": "#15803D", "star": "#E2A300",
    "easy": "#15803D", "medium": "#B7791F", "hard": "#B91C1C", "gift": "#64748B",
}
HEAD_F = "font-family: 'Barlow Condensed', sans-serif"
BODY_F = "font-family: 'IBM Plex Sans', sans-serif"
HAND_F = "font-family: 'Caveat', cursive"
DISPLAY = "font-family: 'Barlow Condensed', sans-serif; font-weight: 800; text-transform: uppercase; letter-spacing: .01em"
CUT = "clip-path: polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)"
CUT_TR = "clip-path: polygon(0 0, calc(100% - 18px) 0, 100% 18px, 100% 100%, 0 100%)"
MONO_F = "font-family: 'IBM Plex Mono', monospace"

TYPES = {
    "learn": {"label": "LEARN", "mark": "■", "frame": "linear-gradient(150deg, #60A5FA 0%, #2563EB 45%, #1E3A8A 100%)", "glow": "rgba(96,165,250,0.55)", "clip": "inset(0)", "pad": "0"},
    "test": {"label": "TEST", "mark": "▲", "frame": "linear-gradient(150deg, #E879F9 0%, #A21CAF 45%, #581C87 100%)", "glow": "rgba(232,121,249,0.5)", "clip": "polygon(50% 0, 100% 100%, 0 100%)", "pad": "34%"},
    "help": {"label": "HELP", "mark": "●", "frame": "linear-gradient(150deg, #4ADE80 0%, #15803D 45%, #14532D 100%)", "glow": "rgba(74,222,128,0.45)", "clip": "circle(50% at 50% 50%)", "pad": "0"},
}
HOLO_FRAME = "linear-gradient(125deg, #7DD3FC 0%, #F0ABFC 25%, #FDE68A 50%, #86EFAC 75%, #7DD3FC 100%)"

HEAD = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>{title}</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link href="{fonts}" rel="stylesheet">
<style>
body{{margin:0;background:#F4F0E8}}
a{{color:#1D4ED8}}a:hover{{color:#172033}}
@keyframes v4Sheen{{0%{{background-position:0% 50%}}100%{{background-position:250% 50%}}}}
@keyframes v4Twinkle{{0%,100%{{opacity:.35}}50%{{opacity:.9}}}}
@keyframes v4Glow{{0%{{box-shadow:0 0 0 0 rgba(37,99,235,.0)}}40%{{box-shadow:0 0 0 6px rgba(37,99,235,.28)}}100%{{box-shadow:0 0 0 0 rgba(37,99,235,.0)}}}}
@keyframes v4Spin{{to{{transform:rotate(360deg)}}}}
.v4-holo{{background-size:250% 250%;animation:v4Sheen 4.5s linear infinite}}
.v4-twinkle{{animation:v4Twinkle 3s ease-in-out infinite}}
@keyframes v5Float{{0%,100%{{transform:translateY(0)}}50%{{transform:translateY(-12px)}}}}
@keyframes v5Blink{{0%,49%{{opacity:1}}50%,100%{{opacity:0}}}}
.v5-lift{{transition:transform .22s ease, box-shadow .22s ease, filter .22s ease}}
.v5-lift:hover,.v5-lift:focus-visible{{transform:translateY(-12px) rotate(-1.5deg);filter:drop-shadow(0 18px 18px rgba(14,26,51,.28))}}
.v5-float{{animation:v5Float 4.2s ease-in-out infinite}}
.v5-blink{{animation:v5Blink 1s infinite}}
a:focus-visible,button:focus-visible{{outline:2px solid #3B82FF;outline-offset:3px}}
@media (prefers-reduced-motion: reduce){{.v4-holo,.v4-twinkle,.v5-float,.v5-blink{{animation:none}}.v5-lift:hover{{transform:none}}}}
</style>
</helmet>
<div style="background: #F4F0E8; color: #172033; {body}; min-height: 100vh">
"""

TAIL = """</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{{"$preview":{{"width":{w},"height":{h}}}}}'>
{js}
</script>
</body>
</html>
"""

STATIC_JS = """class Component extends DCLogic {
  renderVals() { return {}; }
}"""


def page(title, body_html, h, js=STATIC_JS, w=1440):
    return HEAD.format(title=title, fonts=FONTS, body=BODY_F) + body_html + TAIL.format(w=w, h=h, js=js)


def stars_html(n, size=16, total=3, label=True):
    s = "".join(f'<span style="color: {C["star"] if i < n else "#C9C1B0"}">{"★" if i < n else "☆"}</span>' for i in range(total))
    txt = f'<span style="position: absolute; left: -9999px">{n} of {total} stars</span>' if label else ""
    return f'<span style="font-size: {size}px; letter-spacing: 2px; line-height: 1; white-space: nowrap">{s}</span>{txt}'


def night_sky(extra_style=""):
    return ("background-color: #0E1A33; background-image: radial-gradient(1px 1px at 18px 26px, rgba(255,255,255,.6) 50%, transparent 51%), "
            "radial-gradient(1px 1px at 120px 80px, rgba(186,230,253,.55) 50%, transparent 51%), radial-gradient(1.5px 1.5px at 70px 140px, rgba(255,255,255,.45) 50%, transparent 51%); "
            f"background-size: 160px 160px, 210px 210px, 290px 290px; {extra_style}")


def card(kind, name, num, props, flavor, stars=0, w=240, state="normal", set_code="S01", rarity="common"):
    """A collectible card. state: normal | holo | new | locked. Set 01 cards show their item (name + art)."""
    from gen4_art import ART, ITEMS, RARITY
    eyebrow = ""
    art_svg = None
    if set_code == "S01" and kind in ITEMS:
        eyebrow, name, art_svg = "The Clear Ask", ITEMS[kind][0], ART[kind]
    s = w / 240
    h = round(w * 1.4)
    px = lambda v: f"{round(v * s, 1)}px"
    if state == "locked":
        rc = {"common": ("#33476F", "#1B2A4A", "#8FA3C8", "#23345A", ""), "rare": ("#155E75", "#0B2A3A", "#67E8F9", "#0E7490", "0 0 0 2px rgba(103,232,249,.35), 0 0 26px rgba(34,211,238,.35),"), "legendary": ("#92400E", "#3B1A06", "#FCD34D", "#B45309", "0 0 0 2px rgba(252,211,77,.45), 0 0 30px rgba(245,158,11,.45),")}[rarity]
        sub = props or "You'll see it later"
        tier = "" if rarity == "common" else f'<div style="{MONO_F}; font-size: {px(10.5)}; letter-spacing: .16em; color: {rc[2]}">{RARITY[rarity][0]} {RARITY[rarity][1]}</div>'
        return f'''<div role="img" aria-label="Locked card, {RARITY[rarity][1].lower()}: {sub}" style="position: relative; flex: none; width: {w}px; height: {h}px; border-radius: 10px; box-sizing: border-box; {night_sky('border: 1px solid ' + rc[3] + '; box-shadow: ' + rc[4] + ' 0 10px 24px rgba(14,26,51,.22);')} display: flex; flex-direction: column; align-items: center; justify-content: center; gap: {px(10)}; overflow: hidden">
            <div aria-hidden="true" style="width: {px(84)}; height: {px(96)}; clip-path: polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%); background: linear-gradient(160deg, {rc[0]}, {rc[1]}); display: flex; align-items: center; justify-content: center; {HEAD_F}; font-weight: 800; font-size: {px(38)}; color: {rc[2]}">?</div>
            <div style="{MONO_F}; font-size: {px(11)}; letter-spacing: .2em; color: {rc[2]}">??? · {set_code}</div>
            {tier}
            <div style="{BODY_F}; font-size: {px(12)}; color: #8FA3C8; text-align: center; padding: 0 {px(10)}">{sub}</div>
          </div>'''
    t = TYPES[kind]
    frame = HOLO_FRAME if state == "holo" else t["frame"]
    holo_cls = ' class="v4-holo"' if state == "holo" else ""
    hdr_color = "#172033" if state == "holo" else "#FFFFFF"
    new_badge = (f'<div style="position: absolute; top: {px(-8)}; right: {px(-8)}; background: #172033; color: #FFFFFF; {MONO_F}; font-size: {px(11)}; letter-spacing: .14em; padding: {px(4)} {px(8)}; border-radius: 3px; box-shadow: 0 4px 10px rgba(14,26,51,.25)">NEW!</div>' if state == "new" else "")
    holo_overlay = (f'<div aria-hidden="true" class="v4-holo" style="position: absolute; inset: 0; border-radius: 10px; pointer-events: none; mix-blend-mode: soft-light; background: linear-gradient(115deg, transparent 15%, rgba(255,255,255,.75) 32%, rgba(240,171,252,.6) 42%, rgba(125,211,252,.6) 52%, transparent 70%)"></div>' if state == "holo" else "")
    shape_size = 0.40 * w
    return f'''<div role="img" aria-label="{t['label']} card: {name}, {RARITY[rarity][1].lower()}, {stars} of 3 stars{', holographic' if state == 'holo' else ''}" style="position: relative; flex: none; width: {w}px; height: {h}px; border-radius: 10px; padding: {px(8)}; box-sizing: border-box; display: flex; flex-direction: column; text-align: left; box-shadow: 0 1px 0 rgba(255,255,255,.55) inset, 0 12px 26px rgba(14,26,51,.20)">
            <div aria-hidden="true"{holo_cls} style="position: absolute; inset: 0; border-radius: 10px; background: {frame}"></div>
            <div style="position: relative; display: flex; justify-content: space-between; align-items: center; {MONO_F}; font-size: {px(11)}; letter-spacing: .14em; color: {hdr_color}; padding: {px(2)} {px(4)} {px(6)}"><span>{t['mark']} {t['label']}</span><span>{set_code} · {num}</span></div>
            <div style="position: relative; flex: 1 1 0; border-radius: 6px; overflow: hidden; background: radial-gradient(ellipse at 50% 42%, {t['glow']} 0%, #0E1A33 68%); display: flex; align-items: center; justify-content: center">
              <div aria-hidden="true" class="v4-twinkle" style="position: absolute; inset: 0; background-image: radial-gradient(1px 1px at 20% 30%, #fff 50%, transparent 51%), radial-gradient(1px 1px at 75% 20%, #BAE6FD 50%, transparent 51%), radial-gradient(1px 1px at 60% 80%, #fff 50%, transparent 51%), radial-gradient(1px 1px at 30% 75%, #F5D0FE 50%, transparent 51%)"></div>
              {art_svg if art_svg else f'<div aria-hidden="true" style="width: {shape_size}px; height: {shape_size}px; clip-path: {t["clip"]}; background: linear-gradient(160deg, rgba(255,255,255,.95), rgba(255,255,255,.35))"></div>'}
            </div>
            <div style="position: relative; margin-top: {px(7)}; background: #FFFFFF; border-radius: 6px; padding: {px(9)} {px(10)} {px(8)}; display: flex; flex-direction: column; gap: {px(4)}">
              {f'<div style="{MONO_F}; font-size: {px(9.5)}; letter-spacing: .14em; text-transform: uppercase; color: #566072">{eyebrow}</div>' if eyebrow else ''}
              <div style="{HEAD_F}; font-weight: 800; font-size: {px(17)}; line-height: 1.1; color: #172033">{name}</div>
              <div style="{BODY_F}; font-size: {px(11.5)}; color: #566072">{props}</div>
              <div style="{BODY_F}; font-style: italic; font-size: {px(12)}; color: #172033">“{flavor}”</div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-top: {px(2)}">{stars_html(stars, round(15 * s)) if kind != 'help' else f'<span style="{MONO_F}; font-size: {px(10)}; color: #566072; letter-spacing: .1em">TOOL · NO STARS</span>'}<span style="{MONO_F}; font-size: {px(10)}; letter-spacing: .12em; color: {RARITY[rarity][2]}">{RARITY[rarity][0]} {RARITY[rarity][1]}</span></div>
            </div>
            <div aria-hidden="true" style="position: absolute; inset: 0; border-radius: 10px; pointer-events: none; background: linear-gradient(165deg, rgba(255,255,255,.42) 0%, rgba(255,255,255,0) 32%)"></div>
            {holo_overlay}
            {new_badge}
          </div>'''


def stamp(name, level="easy", d=104, rot=-8, earned=True):
    if not earned:
        return f'''<div role="img" aria-label="Stamp not earned yet" style="flex: none; width: {d}px; height: {d}px; border-radius: 50%; border: 2px dashed #C9C1B0; display: flex; align-items: center; justify-content: center; {MONO_F}; font-size: 12px; letter-spacing: .14em; color: #6F6858">???</div>'''
    col = C[level]
    return f'''<div role="img" aria-label="Stamp earned: {name}, {level}" style="flex: none; width: {d}px; height: {d}px; border-radius: 50%; border: 3px solid {col}; box-sizing: border-box; padding: 4px; transform: rotate({rot}deg); opacity: .92">
          <div style="width: 100%; height: 100%; border-radius: 50%; border: 1.5px solid {col}; box-sizing: border-box; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; text-align: center; color: {col}; background: repeating-radial-gradient(circle at 30% 30%, rgba(255,255,255,0) 0 3px, rgba(255,255,255,.18) 3px 4px)">
            {f'<span style="{MONO_F}; font-size: {round(9 * d / 104, 1)}px; letter-spacing: .14em">{level.upper()}</span>' if d >= 70 else ''}
            <span style="{HEAD_F}; font-weight: 800; font-size: {round(11.5 * d / 104, 1)}px; line-height: 1.05; text-transform: uppercase; padding: 0 {max(2, round(6 * d / 104))}px">{name}</span>
            {f'<span style="{MONO_F}; font-size: {round(8.5 * d / 104, 1)}px; letter-spacing: .14em">AIGO ★</span>' if d >= 70 else ''}
          </div>
        </div>'''


def label(text, color="#566072"):
    return f'<div style="{MONO_F}; font-size: 11px; letter-spacing: .18em; text-transform: uppercase; color: {color}">{text}</div>'


def btn(text, href="#", kind="primary"):
    base = f"text-decoration: none; display: inline-block; {MONO_F}; font-weight: 500; font-size: 13px; letter-spacing: .14em; text-transform: uppercase; {CUT}"
    if kind == "primary":
        return f'<a href="{href}" style="{base}; background: #172033; color: #FFFFFF; padding: 14px 22px">{text}</a>'
    if kind == "blue":
        return f'<a href="{href}" style="{base}; background: #3B82FF; color: #050611; padding: 14px 22px">{text}</a>'
    if kind == "light":
        return f'<a href="{href}" style="{base}; background: #FFFFFF; color: #172033; padding: 14px 22px">{text}</a>'
    return f'<a href="{href}" style="text-decoration: none; display: inline-block; {MONO_F}; font-weight: 500; font-size: 13px; letter-spacing: .14em; text-transform: uppercase; border: 1.5px solid #172033; color: #172033; padding: 12.5px 20px">{text}</a>'


def kicker(n, text, color="#566072"):
    return f'<div style="{MONO_F}; font-size: 12px; letter-spacing: .2em; color: {color}">{n} / {text.upper()}</div>'

def h1(text, size=64):
    return f'<h1 style="margin: 8px 0 0; {DISPLAY}; font-size: {size}px; line-height: .9">{text}</h1>'


def header(active=""):
    links = [("Collection", "V4Collection.dc.html"), ("Console", "V4Console.dc.html"), ("Guide", "V4Guide.dc.html"), ("Progress", "V4Progress.dc.html"), ("Premium", "V4Pass.dc.html")]
    nav = ""
    for n, href in links:
        on = n == active
        nav += f'<a href="{href}"{' aria-current="page"' if on else ''} style="text-decoration: none; color: {'#FFFFFF' if on else '#9FB0CF'}; border-bottom: 2px solid {'#6AF7FF' if on else 'transparent'}; padding: 6px 0">{n}</a>'
    return f'''<header style="{night_sky()}">
    <div style="max-width: 1240px; margin: 0 auto; padding: 14px 24px; display: flex; flex-wrap: wrap; align-items: center; gap: 12px 34px">
      <a href="V4Landing.dc.html" aria-label="AIGO Collection home" style="text-decoration: none; display: flex; align-items: baseline; gap: 10px"><span style="{DISPLAY}; font-size: 26px; letter-spacing: .18em; color: #FFFFFF">AIGO</span><span style="{MONO_F}; font-size: 11px; letter-spacing: .3em; color: #6AF7FF">COLLECTION</span></a>
      <nav aria-label="App" style="display: flex; flex-wrap: wrap; gap: 26px; {MONO_F}; font-size: 12.5px; letter-spacing: .14em; text-transform: uppercase">{nav}</nav>
      <div style="margin-left: auto; display: flex; gap: 8px; align-items: center; {MONO_F}; font-size: 10.5px; letter-spacing: .12em">
        <span style="background: #FDE68A; color: #172033; padding: 5px 8px">DEMO · SAMPLE PLAYER</span>
        <span style="border: 1px solid #3B4D74; color: #E2E8F0; padding: 5px 8px">JOHN · MENTOR</span>
      </div>
    </div>
  </header>
'''
