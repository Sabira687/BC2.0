"""v4.1 landing: the v3 landing's design (the Captain's favourite) carrying the v4 concept."""
import sys, json
sys.path.insert(0, sys.argv[1])
from gen4_common import card, TAIL
from gen4_art import ITEMS

DISPLAY = "font-family: 'Barlow Condensed', sans-serif; font-weight: 800; text-transform: uppercase"
MONO = "font-family: 'IBM Plex Mono', monospace"
H2 = f"margin: 14px 0 18px; {DISPLAY}; font-size: clamp(44px, 5.4vw, 76px); line-height: .88"
H2_TIGHT = f"margin: 14px 0 0; {DISPLAY}; font-size: clamp(44px, 5.4vw, 76px); line-height: .88"
CUT = "clip-path: polygon(16px 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%, 0 16px)"
CUT_S = "clip-path: polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)"
STARS = ("background-color: #050611; background-image: radial-gradient(1px 1px at 22px 34px, rgba(238,242,255,.45) 50%, transparent 51%), "
         "radial-gradient(1px 1px at 150px 96px, rgba(106,247,255,.4) 50%, transparent 51%), radial-gradient(1.5px 1.5px at 96px 170px, rgba(238,242,255,.35) 50%, transparent 51%), "
         "radial-gradient(1px 1px at 270px 222px, rgba(255,138,217,.35) 50%, transparent 51%); background-size: 190px 190px, 250px 250px, 340px 340px, 430px 430px")


def kicker(text, color):
    return f'<div style="{MONO}; font-size: 13px; letter-spacing: .2em; color: {color}">{text}</div>'


def cta(text, href, big=True):
    pad, fs, cut = ("20px 40px", "16px", CUT) if big else ("16px 30px", "14px", CUT_S)
    return f'<a href="{href}" style="text-decoration: none; display: inline-block; background: #3B82FF; color: #050611; padding: {pad}; {MONO}; font-weight: 500; font-size: {fs}; letter-spacing: .16em; text-transform: uppercase; {cut}">{text}</a>'


HEAD = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>AIGO Collection</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&amp;family=IBM+Plex+Mono:wght@400;500&amp;family=IBM+Plex+Sans:wght@400;500;600&amp;family=Montserrat:wght@600;700;800&amp;family=Open+Sans:ital,wght@0,400;0,600;1,400&amp;display=swap" rel="stylesheet">
<style>
body{margin:0;background:#050611}
a{color:#EEF2FF}a:hover{color:#6AF7FF}
.glitch{position:relative;display:inline-block}
.glitch::before,.glitch::after{content:attr(data-text);position:absolute;left:0;top:0;width:100%;height:100%}
.glitch::before{color:#FF5AF1;transform:translate(-4px,0);clip-path:inset(0 0 62% 0);animation:aigoG1 3.1s infinite steps(1);mix-blend-mode:screen}
.glitch::after{color:#00FFD1;transform:translate(4px,0);clip-path:inset(58% 0 0 0);animation:aigoG2 2.7s infinite steps(1);mix-blend-mode:screen}
@keyframes aigoG1{0%{clip-path:inset(0 0 62% 0)}20%{clip-path:inset(30% 0 40% 0);transform:translate(-6px,0)}40%{clip-path:inset(70% 0 5% 0)}60%{clip-path:inset(10% 0 80% 0);transform:translate(-2px,0)}80%{clip-path:inset(45% 0 30% 0)}}
@keyframes aigoG2{0%{clip-path:inset(58% 0 0 0)}25%{clip-path:inset(5% 0 75% 0);transform:translate(6px,0)}50%{clip-path:inset(80% 0 2% 0)}75%{clip-path:inset(35% 0 45% 0);transform:translate(2px,0)}}
@keyframes aigoFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-14px)}}
@keyframes aigoShimmer{0%{background-position:0% 50%}100%{background-position:200% 50%}}
@keyframes aigoBlink{0%,49%{opacity:1}50%,100%{opacity:0}}
@keyframes aigoDash{to{stroke-dashoffset:-160}}
@keyframes aigoBounce{0%,100%{transform:translateY(0)}50%{transform:translateY(8px)}}
@keyframes v4Sheen{0%{background-position:0% 50%}100%{background-position:250% 50%}}
@keyframes v4Twinkle{0%,100%{opacity:.35}50%{opacity:.9}}
.aigo-float{animation:aigoFloat 4.2s ease-in-out infinite}
.aigo-holo{background:linear-gradient(120deg,#6AF7FF,#FF8AD9,#3B82FF,#00FFD1,#6AF7FF);background-size:200% 200%;animation:aigoShimmer 5s linear infinite}
.aigo-blink{animation:aigoBlink 1s infinite}
.aigo-bounce{animation:aigoBounce 1.6s ease-in-out infinite}
.v4-holo{background-size:250% 250%;animation:v4Sheen 4.5s linear infinite}
.v4-twinkle{animation:v4Twinkle 3s ease-in-out infinite}
@media (prefers-reduced-motion: reduce){.glitch::before,.glitch::after,.aigo-float,.aigo-holo,.aigo-blink,.aigo-bounce,.v4-holo,.v4-twinkle{animation:none}}
</style>
</helmet>
<div style="background: #050611; color: #EEF2FF; font-family: 'IBM Plex Sans', system-ui, sans-serif; overflow: hidden">
"""

# ---------------- 00 hero ----------------
demo_steps = [("01", "Open Set 01: your first 3 cards"), ("02", "Paste the Key, pass a lesson"), ("03", "Use the Compass in Work chat"), ("04", "Fast-forward John: holo + badge")]
hero = f'''
  <section onMouseMove="{{{{move}}}}" style="position: relative; min-height: 760px; display: flex; flex-direction: column; {STARS}; overflow: hidden">
    <div aria-hidden="true" style="position: absolute; left: {{{{glowX}}}}px; top: {{{{glowY}}}}px; width: 360px; height: 360px; pointer-events: none; opacity: {{{{glowO}}}}; background-image: radial-gradient(1.5px 1.5px at 22px 34px, #EEF2FF 50%, transparent 51%), radial-gradient(1.5px 1.5px at 150px 96px, #6AF7FF 50%, transparent 51%), radial-gradient(2px 2px at 96px 170px, #EEF2FF 50%, transparent 51%), radial-gradient(1.5px 1.5px at 270px 222px, #FF8AD9 50%, transparent 51%); background-size: 190px 190px, 250px 250px, 340px 340px, 430px 430px; background-position: {{{{bgX}}}}px {{{{bgY}}}}px; -webkit-mask-image: radial-gradient(circle, #000 0%, transparent 70%); mask-image: radial-gradient(circle, #000 0%, transparent 70%)"></div>
    <sc-for list="{{{{trail}}}}" as="d" hint-placeholder-count="0">
      <div aria-hidden="true" style="position: absolute; left: {{{{d.x}}}}px; top: {{{{d.y}}}}px; width: {{{{d.s}}}}px; height: {{{{d.s}}}}px; background: {{{{d.c}}}}; opacity: {{{{d.o}}}}; pointer-events: none; transform: translate(-50%, -50%) rotate(45deg)"></div>
    </sc-for>
    <header style="position: relative; max-width: 1240px; width: 100%; box-sizing: border-box; margin: 0 auto; padding: 22px 24px; display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 16px">
      <span style="display: flex; align-items: baseline; gap: 12px"><span style="{DISPLAY}; font-size: 30px; letter-spacing: .18em">AIGO</span><span style="{MONO}; font-size: 12px; letter-spacing: .3em; color: #6AF7FF">COLLECTION</span></span>
      <nav aria-label="Main" style="display: flex; flex-wrap: wrap; gap: 26px; {MONO}; font-size: 13px; letter-spacing: .14em; text-transform: uppercase">
        <a href="#idea" style="text-decoration: none">Idea</a><a href="#vault" style="text-decoration: none">Items</a><a href="#path" style="text-decoration: none">Path</a><a href="#plans" style="text-decoration: none">Plans</a><a href="#roadmap" style="text-decoration: none">Roadmap</a>
      </nav>
    </header>
    <div style="position: relative; flex: 1; max-width: 1240px; width: 100%; box-sizing: border-box; margin: 0 auto; padding: 40px 24px 0; display: flex; flex-direction: column; justify-content: center">
      <div style="{MONO}; font-size: 13px; letter-spacing: .2em; color: #6AF7FF">&gt; COLLECTIBLE CARDS THAT TURN YOUR AI INTO YOUR COACH<span class="aigo-blink">_</span></div>
      <h1 style="margin: 22px 0 0; {DISPLAY}; font-size: clamp(72px, 12vw, 184px); line-height: .82; letter-spacing: -.01em">
        <span class="glitch" data-text="Collect.">Collect.</span><br>
        <span style="color: transparent; -webkit-text-stroke: 2px #EEF2FF">Learn.</span><br>
        <span style="color: #3B82FF">Level up.</span>
      </h1>
      <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 28px; margin-top: 44px">
        {cta("Start your collection ▸", "V4Start.dc.html")}
        <p style="margin: 0; max-width: 430px; color: #B8C0D9; line-height: 1.55">Every card is a digital item with its own story. Paste it into Claude and the AI becomes your coach for one skill, on your real work. Stars and stamps come only when Claude checks what you did.</p>
      </div>
    </div>
    <div style="position: relative; max-width: 1240px; width: 100%; box-sizing: border-box; margin: 48px auto 0; padding: 0 24px">
      <div style="border: 1px solid #1E2A3D; background: rgba(5,6,17,.82); display: flex; flex-wrap: wrap">
        <a href="V4Collection.dc.html" style="text-decoration: none; flex: 1 1 200px; padding: 16px 20px; border-right: 1px solid #1E2A3D; {MONO}; font-size: 12px; letter-spacing: .16em; color: #6AF7FF">QUICK DEMO · 3 MIN ▸<br><span style="color: #8A97AD">sample player John is ready</span></a>
        {"".join(f'<div style="flex: 1 1 180px; padding: 16px 20px; {"border-right: 1px solid #1E2A3D" if n != "04" else ""}"><span style="{MONO}; color: #3B82FF">{n}</span> {t}</div>' for n, t in demo_steps)}
      </div>
    </div>
    <a href="#idea" style="position: relative; align-self: center; margin: 40px 0 28px; text-decoration: none; display: flex; flex-direction: column; align-items: center; gap: 10px; {MONO}; font-size: 12px; letter-spacing: .2em; color: #B8C0D9">LEARN MORE
      <span class="aigo-bounce" aria-hidden="true" style="display: block; width: 18px; height: 18px; border-right: 2px solid #6AF7FF; border-bottom: 2px solid #6AF7FF; transform: rotate(45deg)"></span></a>
  </section>
'''

# ---------------- 01 idea ----------------
idea = f'''
  <section id="idea" style="background: #3B82FF; color: #050611; clip-path: polygon(0 9%, 100% 0, 100% 91%, 0 100%); margin-top: -40px; position: relative">
    <div style="max-width: 1240px; margin: 0 auto; padding: 130px 24px; display: flex; flex-wrap: wrap; gap: 40px; align-items: center">
      <div aria-hidden="true" style="flex: 1 1 200px; {DISPLAY}; font-size: 160px; line-height: .8; color: transparent; -webkit-text-stroke: 2px #050611">01</div>
      <div style="flex: 3 1 520px">
        <div style="{MONO}; font-size: 13px; letter-spacing: .2em">THE IDEA</div>
        <h2 style="{H2}">The best teacher<br>for the AI is the AI.</h2>
        <p style="margin: 0 0 18px; max-width: 620px; {MONO}; font-size: 14px; letter-spacing: .06em">BUILT FOR: people who know AI matters and don't know where to start.</p>
        <p style="margin: 0; max-width: 640px; font-size: 19px; line-height: 1.55">AIGO is a collection of digital items. Each card has a story and a power: the Key teaches, the Lock tests, the Compass helps you mid-task. Paste a card into the AIGO lesson or into your own Claude, and the AI becomes your coach for that skill. Collect the set, earn the stamps, keep every card.</p>
      </div>
    </div>
  </section>
'''

# ---------------- 02 vault ----------------
VAULT = [
    dict(kind="learn", state="normal", rarity="common", set_code="S01", sub=""),
    dict(kind="test", state="normal", rarity="common", set_code="S01", sub=""),
    dict(kind="help", state="normal", rarity="common", set_code="S01", sub=""),
    dict(kind="learn", state="locked", rarity="rare", set_code="S05", sub="Free · after the demo"),
    dict(kind="learn", state="locked", rarity="legendary", set_code="S12", sub="Premium"),
]
PROPS = {"learn": "Learn · 3 lessons", "test": "Test · 5 tasks", "help": "Help · ~1 min"}
FLAV = {"learn": "Ask once.", "test": "Prove it.", "help": "One move."}
vault_cards = ""
for i, v in enumerate(VAULT):
    if v["state"] == "locked":
        c = card(v["kind"], "", "", v["sub"], "", 0, 108, "locked", v["set_code"], v["rarity"])
    else:
        c = card(v["kind"], "", f"{i + 1}/3", PROPS[v["kind"]], FLAV[v["kind"]], 0, 128)
    vault_cards += f'''<button onMouseEnter="{{{{pick{i}}}}}" onFocus="{{{{pick{i}}}}}" onClick="{{{{pick{i}}}}}" aria-label="Inspect item {i + 1}" class="aigo-float" style="animation-delay: {i * .6}s; background: none; border: 0; padding: 0; cursor: pointer; border-radius: 12px; opacity: {{{{op{i}}}}}; outline: 2px solid {{{{rim{i}}}}}; outline-offset: 4px; transition: opacity .3s">{c}</button>'''

vault = f'''
  <section id="vault" style="background: radial-gradient(ellipse at 50% 70%, #2A0A55 0%, #1B0036 45%, #050611 100%); padding: 110px 24px 120px; margin-top: -30px">
    <div style="max-width: 1240px; margin: 0 auto; display: flex; flex-wrap: wrap; gap: 48px; align-items: center">
      <div style="flex: 1 1 360px; max-width: 460px">
        {kicker("02 / THE VAULT", "#FF8AD9")}
        <h2 style="{H2}">Every item<br><span class="aigo-holo" style="-webkit-background-clip: text; background-clip: text; color: transparent">has a story.</span></h2>
        <p style="margin: 0 0 26px; color: #D9CFF0; line-height: 1.6; font-size: 17px">A card is not a lesson file. It's an item: its own art, a short story that helps the skill stick, a rarity and a number in its set. Inside sit hidden instructions only your AI reads.</p>
        <div style="border: 1px solid {{{{panel.accent}}}}; background: rgba(5,6,17,.55); padding: 22px; min-height: 178px">
          <div style="{MONO}; font-size: 12px; letter-spacing: .16em; color: {{{{panel.accent}}}}">{{{{panel.tag}}}}</div>
          <div style="{DISPLAY}; font-size: 32px; margin-top: 6px">{{{{panel.name}}}}</div>
          <div style="color: #E6DDF7; font-style: italic; line-height: 1.55; margin-top: 6px">{{{{panel.lore}}}}</div>
          <div style="color: #B9AED4; line-height: 1.5; margin-top: 10px; font-size: 15px">{{{{panel.teach}}}}</div>
        </div>
        <div style="{MONO}; font-size: 12px; letter-spacing: .14em; color: #9E8FC0; margin-top: 12px">HOVER AN ITEM TO INSPECT IT</div>
      </div>
      <div style="flex: 1 1 660px; position: relative; height: 500px; display: flex; justify-content: center">
        <div aria-hidden="true" style="position: absolute; bottom: 120px; left: 50%; width: 640px; height: 360px; transform: translateX(-50%); background: linear-gradient(0deg, rgba(106,247,255,.28), rgba(255,138,217,.06) 70%, transparent); clip-path: polygon(14% 100%, 86% 100%, 100% 0, 0 0)"></div>
        <div style="position: absolute; top: 140px; left: 0; right: 0; display: flex; justify-content: center; align-items: flex-end; gap: 12px">{vault_cards}</div>
        <div aria-hidden="true" style="position: absolute; bottom: 40px; left: 50%; transform: translateX(-50%); width: 640px; height: 90px; background: #0E0420; border: 1px solid #5B2E8F; clip-path: polygon(0 0, 100% 0, 92% 100%, 8% 100%)"></div>
        <div aria-hidden="true" style="position: absolute; bottom: 124px; left: 50%; transform: translateX(-50%); width: 660px; height: 14px; background: #5B2E8F"></div>
        <div aria-hidden="true" style="position: absolute; bottom: 64px; left: 50%; transform: translateX(-50%); {MONO}; font-size: 12px; letter-spacing: .3em; color: #FF8AD9; white-space: nowrap">AIGO · SET 01 · THE CLEAR ASK</div>
      </div>
    </div>
  </section>
'''

# ---------------- 03 path ----------------
PATH_D = "M120 320 C 200 320, 235 130, 315 130 S 420 300, 500 300 S 605 140, 685 140 S 800 260, 880 260"
path = f'''
  <section id="path" style="background: #050611; border-top: 1px solid #12324A; padding: 100px 24px 110px">
    <div style="max-width: 1240px; margin: 0 auto">
      <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-end; gap: 20px">
        <div>{kicker("03 / THE PATH", "#00FFD1")}<h2 style="{H2_TIGHT}">How the AI<br>teaches you</h2></div>
        <span style="{MONO}; font-size: 12px; letter-spacing: .16em; color: #7FA7B8">HOVER A POINT ON THE PATH</span>
      </div>
      <div style="overflow-x: auto; margin-top: 30px">
        <div onMouseLeave="{{{{unlock}}}}" style="position: relative; min-width: 900px; aspect-ratio: 1000 / 440">
          <svg viewBox="0 0 1000 440" aria-hidden="true" style="position: absolute; inset: 0; width: 100%; height: 100%">
            <path d="{PATH_D}" fill="none" stroke="#12324A" stroke-width="10"></path>
            <path d="{PATH_D}" pathLength="100" fill="none" stroke="#00FFD1" stroke-opacity=".35" stroke-width="10" stroke-dasharray="{{{{pathFill}}}} 100" style="transition: stroke-dasharray .9s ease"></path>
            <path d="{PATH_D}" fill="none" stroke="#00FFD1" stroke-width="2" stroke-dasharray="6 10" style="animation: aigoDash 4s linear infinite"></path>
          </svg>
          <sc-for list="{{{{stops}}}}" as="s" hint-placeholder-count="5">
            <div style="position: absolute; left: {{{{s.left}}}}; top: {{{{s.top}}}}; transform: translate(-50%, -50%)">
              <button onMouseEnter="{{{{s.pick}}}}" onFocus="{{{{s.pick}}}}" onClick="{{{{s.pick}}}}" aria-label="{{{{s.title}}}}" style="width: 46px; height: 46px; border-radius: 50%; border: 2px solid #00FFD1; background: {{{{s.bg}}}}; color: {{{{s.fg}}}}; {MONO}; font-size: 14px; cursor: pointer">{{{{s.n}}}}</button>
            </div>
          </sc-for>
          <sc-for list="{{{{stops}}}}" as="s" hint-placeholder-count="5">
            <div style="position: absolute; left: {{{{s.left}}}}; top: {{{{s.boxTop}}}}; transform: translateX(-50%); width: 196px; box-sizing: border-box; border: 1px solid {{{{s.border}}}}; transition: border-color .4s; background: #07121C; padding: 12px 14px">
              <div style="font-family: 'Barlow Condensed', sans-serif; font-weight: 700; font-size: 21px; text-transform: uppercase; color: #EEF2FF">{{{{s.title}}}}</div>
              <div style="margin-top: 6px; font-size: 14px; line-height: 1.45; color: {{{{s.textColor}}}}; font-family: {{{{s.font}}}}">{{{{s.shown}}}}</div>
            </div>
          </sc-for>
        </div>
      </div>
    </div>
  </section>
'''

# ---------------- 04 what you get ----------------
benefits = ["every card is an item: its own art, story, rarity and number",
            "lessons on your real work: emails, reports, meeting notes",
            "stars and stamps only when Claude checks what you did",
            "a stamp book that reads like a list of what you can do",
            "help mid-task: one better move, then back to work",
            "starts in your browser, then works in your own Claude",
            "nothing expires: no streaks, no timers, no lectures"]
get = f'''
  <section style="background: #020403; padding: 100px 24px; border-top: 1px solid #0F3B22">
    <div style="max-width: 1240px; margin: 0 auto; display: flex; flex-wrap: wrap; gap: 48px; align-items: center">
      <div style="flex: 1 1 300px">{kicker("04 / WHAT YOU GET", "#39FF88")}<h2 style="{H2_TIGHT}">Not a course.<br><span style="color: #39FF88">A skill you can show.</span></h2></div>
      <div style="flex: 2 1 520px; background: #000; border: 1px solid #1F6B40">
        <div style="padding: 10px 16px; border-bottom: 1px solid #1F6B40; {MONO}; font-size: 12px; color: #39FF88; display: flex; justify-content: space-between"><span>john@aigo-vault:~</span><span>[ ■ ▲ ● ]</span></div>
        <div style="padding: 22px 20px; {MONO}; font-size: 15px; line-height: 1.9; color: #B6FFD3">
          <div><span style="color: #39FF88">$</span> aigo --benefits</div>
          {"".join(f'<div><span style="color: #39FF88">[+]</span> {b}</div>' for b in benefits)}
          <div><span style="color: #39FF88">$</span> <span class="aigo-blink" style="display: inline-block; width: 10px; height: 18px; background: #39FF88; vertical-align: middle"></span></div>
        </div>
      </div>
    </div>
  </section>
'''

# ---------------- 05 the good parts only ----------------
kept = [("Pack openings", "Pokémon TCG, Hearthstone", "A card reveal, with nothing random"),
        ("Holo foils", "Hearthstone golden cards", "Earned for mastery: 90+ on the test"),
        ("Rarity and set numbers", "trading cards", "● ◆ ★ show how deep a skill goes"),
        ("Stamp books", "Club Penguin", "Each stamp is a skill you used"),
        ("Secret codes", "Webkinz, cheat codes", "Result codes bring progress home"),
        ("“???” silhouettes", "Pokédex", "You see what's ahead")]
left = ["Streaks and daily guilt", "Random loot boxes", "Timers and energy", "Leaderboards", "In-app coins"]
kept_html = "".join(f'<div style="border: 1px solid #5B1F52; background: rgba(255,138,217,.06); padding: 16px 18px"><div style="{MONO}; font-size: 11px; letter-spacing: .16em; color: #FF8AD9">KEPT · {src.upper()}</div><div style="font-family: \'Barlow Condensed\', sans-serif; font-weight: 700; font-size: 24px; text-transform: uppercase; margin-top: 4px">{t}</div><div style="color: #E5CFE0; font-size: 15px; margin-top: 2px">{d}</div></div>' for t, src, d in kept)
left_html = "".join(f'<li style="{DISPLAY}; font-size: 26px; color: #8C6E86; text-decoration: line-through; text-decoration-color: #FF8AD9; padding: 4px 0">{t}</li>' for t in left)
good = f'''
  <section style="background: radial-gradient(ellipse at 15% 30%, #3A0A2E 0%, #12030F 55%, #050611 100%); padding: 100px 24px; border-top: 1px solid #3A1236">
    <div style="max-width: 1240px; margin: 0 auto">
      {kicker("05 / THE GOOD PARTS ONLY", "#FF8AD9")}
      <h2 style="{H2}">We kept the magic.<br><span style="color: #FF8AD9">We left the guilt.</span></h2>
      <p style="margin: 0 0 40px; max-width: 680px; color: #E5CFE0; font-size: 17px; line-height: 1.6">We grew up collecting, and some of us learned real skills while we did it. Neopets taught a generation HTML. AIGO takes the parts of old games that felt like magic and points them at the skill that matters at work now.</p>
      <div style="display: flex; flex-wrap: wrap; gap: 32px; align-items: flex-start">
        <div style="flex: 2 1 560px; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px">{kept_html}</div>
        <div style="flex: 1 1 280px; border: 1px dashed #5B1F52; padding: 20px 22px">
          <div style="{MONO}; font-size: 11px; letter-spacing: .16em; color: #9E7A97">LEFT BEHIND</div>
          <ul style="list-style: none; margin: 10px 0 0; padding: 0">{left_html}</ul>
        </div>
      </div>
    </div>
  </section>
'''


# ---------------- 06 plans ----------------
def ticket(name, price, per, items, holo, rotate):
    strip = '<div class="aigo-holo" aria-hidden="true" style="width: 22px; flex: none"></div>' if holo else '<div aria-hidden="true" style="width: 22px; flex: none; background: #3B82FF"></div>'
    lis = "".join(f'<li style="padding: 4px 0">▸ {i}</li>' for i in items)
    side = "CANCEL ANYTIME" if holo else "FREE FOREVER"
    return f'''<div style="position: relative; flex: 1 1 400px; max-width: 520px; transform: rotate({rotate}deg)">
          <div aria-hidden="true" style="position: absolute; inset: 12px -12px -12px 12px; border: 1px solid {'#FF8AD9' if holo else '#3B82FF'}"></div>
          <div style="position: relative; display: flex; background: #EEF2FF; color: #050611; height: 100%">
            {strip}
            <div style="flex: 1; padding: 26px 26px 22px; border-right: 2px dashed #9AA6C4">
              <div style="{MONO}; font-size: 12px; letter-spacing: .2em">AIGO · {name}</div>
              <div style="display: flex; align-items: flex-end; gap: 8px; margin-top: 10px"><span style="{DISPLAY}; font-size: 80px; line-height: .8">{price}</span><span style="{MONO}; font-size: 14px; padding-bottom: 6px">{per}</span></div>
              <ul style="list-style: none; margin: 18px 0 0; padding: 0; font-size: 15px; line-height: 1.55">{lis}</ul>
            </div>
            <div style="width: 60px; flex: none; display: flex; align-items: center; justify-content: center"><span style="writing-mode: vertical-rl; transform: rotate(180deg); {MONO}; font-size: 12px; letter-spacing: .3em">{side}</span></div>
          </div>
        </div>'''


free_items = ["<b>Core path:</b> 7 skills, 21 cards", "Lessons in AIGO and in your own Claude", "Stars, stamp book, set badges, holo cards", "Result codes from your own Claude", "Cards updated when Claude changes"]
prem_items = ["Everything in Free", "<b>AIGO Connector</b> for Claude: your collection inside Claude, progress saves itself", "<b>Full path:</b> Power user and Automator, 24 more ★ Legendary cards", "<b>New cards every month</b>, after each Claude release", "<b>Promotion Kit:</b> your proven skills on one page for your manager", "Priority support"]
plans = f'''
  <section id="plans" style="background: radial-gradient(ellipse at 80% 20%, #0B1A3A 0%, #050611 60%); padding: 100px 24px; border-top: 1px solid #1E2A3D">
    <div style="max-width: 1240px; margin: 0 auto">
      <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-end; gap: 24px; margin-bottom: 48px">
        <div>{kicker("06 / PLANS", "#6AF7FF")}<h2 style="{H2_TIGHT}">Start free.<br>Go further for less than a lunch.</h2></div>
        <div style="max-width: 420px; border: 1px solid #1E2A3D; background: rgba(5,6,17,.6); padding: 16px 18px; {MONO}; font-size: 12.5px; line-height: 1.7; color: #B8C0D9"><span style="color: #6AF7FF; letter-spacing: .16em">IN THIS DEMO</span><br>Set 01 of the Free plan: 3 cards, the AIGO lesson, Work chat, stars, stamps and result codes. Premium checkout runs in test mode.</div>
      </div>
      <div style="display: flex; flex-wrap: wrap; gap: 40px; justify-content: center; align-items: stretch">
        {ticket("FREE", "$0", "/ FOREVER", free_items, False, 1.2)}
        {ticket("PREMIUM", "$7", "/ MONTH", prem_items, True, -1.6)}
      </div>
      <div style="display: flex; flex-wrap: wrap; gap: 14px; align-items: center; justify-content: center; margin-top: 44px">
        {cta("Start free ▸", "V4Start.dc.html", False)}
        <a href="V4Pass.dc.html" style="text-decoration: none; border: 1px solid #FF8AD9; color: #FFD6F7; padding: 15px 28px; {MONO}; font-size: 14px; letter-spacing: .16em">SEE PREMIUM</a>
      </div>
    </div>
  </section>
'''

# ---------------- 07 roadmap: big plan, real parts ----------------
phases = [("NOW", "This demo", "#6AF7FF", ["Set 01: Key, Lock, Compass", "AIGO lesson on the Claude API", "Work chat with the Help card", "Stars, stamps, result codes", "Premium checkout in test mode"], "Live today. Try it as John."),
          ("NEXT", "Free at launch", "#3B82FF", ["Sets 02–07: the core path", "21 cards with their own art and stories", "Card updates when Claude changes"], "Same lesson and test templates. New sets are writing, not new code."),
          ("THEN", "Premium", "#FF8AD9", ["AIGO Connector for Claude", "Power user and Automator paths", "Monthly card drops", "Promotion Kit, priority support"], "The connector is an MCP server: Claude already supports custom connectors, even on the free plan. The Kit exports data AIGO already stores.")]
phase_html = ""
for i, (tag, t, col, items, why) in enumerate(phases):
    lis = "".join(f'<li>▸ {x}</li>' for x in items)
    glow = f"box-shadow: 0 0 14px {col};" if i == 0 else ""
    phase_html += f'''<div style="padding: 26px 24px; {'border-right: 1px solid #1E2A3D;' if i < 2 else ''} display: flex; flex-direction: column; gap: 12px">
          <div style="display: flex; align-items: center; gap: 12px"><span style="width: 14px; height: 14px; transform: rotate(45deg); background: {col}; {glow}"></span><span style="{MONO}; font-size: 12px; letter-spacing: .2em; color: {col}">{tag}</span></div>
          <div style="{DISPLAY}; font-size: 34px">{t}</div>
          <ul style="list-style: none; margin: 0; padding: 0; font-size: 15px; line-height: 1.75; color: #D5DBEC">{lis}</ul>
          <div style="margin-top: auto; border-top: 1px dashed #1E2A3D; padding-top: 12px; {MONO}; font-size: 12.5px; line-height: 1.6; color: #8A97AD"><span style="color: {col}; letter-spacing: .14em">WHY IT'S REAL ·</span> {why}</div>
        </div>'''
roadmap = f'''
  <section id="roadmap" style="background: #050611; padding: 100px 24px; border-top: 1px solid #1E2A3D">
    <div style="max-width: 1240px; margin: 0 auto">
      {kicker("07 / ROADMAP", "#6AF7FF")}
      <h2 style="{H2}">Big plan.<br><span style="color: #3B82FF">Real parts.</span></h2>
      <p style="margin: 0 0 40px; max-width: 680px; color: #B8C0D9; font-size: 17px; line-height: 1.6">The demo is the core of the whole product, working today. Everything after it reuses the same parts.</p>
      <div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); border: 1px solid #1E2A3D">{phase_html}</div>
    </div>
  </section>
'''

# ---------------- contacts ----------------
contact_html = "".join(f'<div><div style="font-size: 11px; letter-spacing: .2em; color: #8A97AD">{k}</div><div style="margin-top: 6px">{v}</div></div>' for k, v in [("EMAIL", "[EMAIL]"), ("TELEGRAM", "[@HANDLE]"), ("GITHUB", "[REPO LINK]"), ("TEAM", "SKaiCode")])
contacts = f'''
  <section id="contacts" style="background-color: #050611; background-image: radial-gradient(1px 1px at 40px 60px, rgba(238,242,255,.4) 50%, transparent 51%), radial-gradient(1px 1px at 180px 20px, rgba(106,247,255,.4) 50%, transparent 51%); background-size: 220px 120px, 300px 140px; padding: 90px 24px 40px; border-top: 1px solid #1E2A3D">
    <div style="max-width: 1240px; margin: 0 auto">
      <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-end; gap: 32px; border-bottom: 1px solid #1E2A3D; padding-bottom: 48px">
        <h2 style="margin: 0; {DISPLAY}; font-size: clamp(56px, 8vw, 120px); line-height: .85">It's not<br><span style="color: #3B82FF">too late.</span></h2>
        {cta("Start your collection ▸", "V4Start.dc.html")}
      </div>
      <div style="display: flex; flex-wrap: wrap; gap: 24px 64px; padding: 36px 0; {MONO}; font-size: 14px">{contact_html}</div>
      <div style="{MONO}; font-size: 12px; letter-spacing: .16em; color: #8A97AD">AIGO COLLECTION · 2026 · YOUR CARDS WAIT FOR YOU</div>
    </div>
  </section>
'''

acc = ["#6AF7FF", "#FF5AF1", "#39FF88", "#67E8F9", "#FCD34D"]
teach = {"learn": "Teaches: write an ask the AI gets right the first time. 3 lessons on your work, ~10 min.",
         "test": "Tests: 5 tasks on your work, scored out of 100. 90 or more turns the card holographic.",
         "help": "Helps: paste it mid-task and get one better move. About a minute."}
panels = []
for i, v in enumerate(VAULT):
    if v["state"] == "locked" and v["rarity"] == "rare":
        panels.append(dict(accent=acc[i], tag="ITEM · ??? · SET 05 · ◆ RARE · FREE", name="Locked item", lore="You'll see it later.", teach="Comes with the free core path after the demo."))
    elif v["state"] == "locked":
        panels.append(dict(accent=acc[i], tag="ITEM · ??? · SET 12 · ★ LEGENDARY · PREMIUM", name="Locked item", lore="You'll see it later.", teach="Part of the Automator path: Claude Code, agents and connectors."))
    else:
        nm, lore = ITEMS[v["kind"]]
        panels.append(dict(accent=acc[i], tag=f"ITEM · {v['kind'].upper()} · SET 01 · {i + 1}/3 · ● COMMON", name=nm, lore=lore, teach=teach[v["kind"]]))

stops = [("01", "You answer", "One minute: your job, your goal, how you like to learn.", 120, 320),
         ("02", "Open your cards", "Set 01 is made for you: the Key, the Lock and the Compass, each revealed in its pocket.", 315, 130),
         ("03", "Activate", "Paste a card into the AIGO lesson or your own Claude. It answers ▶ ITEM ACTIVATED and becomes your coach.", 500, 300),
         ("04", "Learn on real work", "Short lessons with your emails and reports. A star or a stamp only when Claude checks the result.", 685, 140),
         ("05", "Prove it", "The Lock: five tasks on your work. 90+ makes the card holographic; a result code brings it home.", 880, 260)]

JS = """class Component extends DCLogic {
  constructor(props) { super(props); this.state = { trail: [], gx: -999, gy: -999, item: 0, stop: 0, lock: false }; this.seq = 0; }
  componentDidMount() {
    this.timer = setInterval(() => { const t = this.state.trail || []; if (t.length) this.setState({ trail: t.slice(1) }); }, 60);
    this.pathTimer = setInterval(() => { if (!this.state.lock) this.setState({ stop: ((this.state.stop || 0) + 1) % 5 }); }, 2400);
  }
  componentWillUnmount() { clearInterval(this.timer); clearInterval(this.pathTimer); }
  renderVals() {
    const self = this; const st = this.state || {}; const trail = st.trail || [];
    const colors = ['#6AF7FF', '#FF8AD9', '#EEF2FF', '#00FFD1'];
    const move = (e) => {
      const r = e.currentTarget.getBoundingClientRect(); const x = Math.round(e.clientX - r.left); const y = Math.round(e.clientY - r.top);
      const last = trail[trail.length - 1];
      if (last && Math.abs(last.x - x) + Math.abs(last.y - y) < 14) { self.setState({ gx: x, gy: y }); return; }
      self.seq += 1;
      const next = trail.concat([{ x: x + Math.round(Math.random() * 10 - 5), y: y + Math.round(Math.random() * 10 - 5), c: colors[self.seq % 4] }]).slice(-16);
      self.setState({ trail: next, gx: x, gy: y });
    };
    const panels = __PANELS__;
    const stopsData = __STOPS__;
    const item = st.item || 0;
    const stops = stopsData.map((s, i) => {
      const on = st.stop === i, done = i < (st.stop || 0), below = s[4] < 220;
      return { n: s[0], title: s[1], left: (s[3] / 10) + '%', top: (s[4] / 4.4) + '%',
        boxTop: below ? ((s[4] + 40) / 4.4) + '%' : ((s[4] - 180) / 4.4) + '%',
        bg: on ? '#00FFD1' : (done ? '#0B3B3A' : '#050611'), fg: on ? '#050611' : '#00FFD1', border: on ? '#00FFD1' : '#12324A',
        shown: on ? s[2] : '▒▒▒▒▒▒▒▒ ▒▒▒▒▒ ▒▒▒▒▒▒▒', textColor: on ? '#BFEFF0' : '#2C5868',
        font: on ? "'IBM Plex Sans', sans-serif" : "'IBM Plex Mono', monospace",
        pick: () => self.setState({ stop: i, lock: true }) };
    });
    const v = { move, glowX: st.gx - 180, glowY: st.gy - 180, glowO: st.gx < -100 ? 0 : 1, bgX: 180 - st.gx, bgY: 180 - st.gy,
      trail: trail.map((d, i) => ({ x: d.x, y: d.y, c: d.c, s: 3 + Math.round(i / 3), o: ((i + 1) / trail.length).toFixed(2) })),
      panel: panels[item], stops, pathFill: (st.stop || 0) * 25, unlock: () => self.setState({ lock: false }) };
    for (let i = 0; i < 5; i++) { v['pick' + i] = () => self.setState({ item: i }); v['op' + i] = item === i ? 1 : (i > 2 ? 0.55 : 0.75); v['rim' + i] = item === i ? panels[i].accent : 'transparent'; }
    return v;
  }
}""".replace("__PANELS__", json.dumps(panels)).replace("__STOPS__", json.dumps(stops))

body = hero + idea + vault + path + get + good + plans + roadmap + contacts
open(sys.argv[1] + "/project/V4Landing.dc.html", "w").write(HEAD + body + TAIL.format(w=1440, h=7050, js=JS))
print("ok")
