"""Concept art for Set 01 items (placeholder illustrations; final art by the Captain later)."""

def _spark(x, y, r=6, o=.9):
    q = r / 4
    return f'<path d="M{x} {y-r} L{x+q} {y-q} L{x+r} {y} L{x+q} {y+q} L{x} {y+r} L{x-q} {y+q} L{x-r} {y} L{x-q} {y-q} Z" fill="#FFFFFF" opacity="{o}"/>'

BRASS = '<linearGradient id="aigoBrass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFF4C2"/><stop offset=".3" stop-color="#F8C65A"/><stop offset=".68" stop-color="#C9841C"/><stop offset="1" stop-color="#6E400C"/></linearGradient>'

KEY = f'''<svg viewBox="0 0 200 200" aria-hidden="true" style="position: relative; width: 92%; height: 92%">
  <defs>{BRASS}<radialGradient id="aigoKeyGlow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#BFDBFE" stop-opacity=".7"/><stop offset="1" stop-color="#60A5FA" stop-opacity="0"/></radialGradient>
  <radialGradient id="aigoKeyGem" cx=".35" cy=".35" r=".7"><stop offset="0" stop-color="#E0F2FE"/><stop offset=".45" stop-color="#60A5FA"/><stop offset="1" stop-color="#1E3A8A"/></radialGradient></defs>
  <circle cx="100" cy="100" r="84" fill="url(#aigoKeyGlow)"/>
  <g transform="rotate(-38 100 100)">
    <rect x="80" y="93" width="96" height="14" rx="5" fill="url(#aigoBrass)"/>
    <rect x="86" y="95" width="86" height="3" rx="1.5" fill="#FFFBEB" opacity=".75"/>
    <rect x="128" y="104" width="11" height="24" rx="2" fill="url(#aigoBrass)"/>
    <rect x="145" y="104" width="11" height="34" rx="2" fill="url(#aigoBrass)"/>
    <rect x="162" y="104" width="11" height="18" rx="2" fill="url(#aigoBrass)"/>
    <rect x="74" y="86" width="10" height="28" rx="3" fill="url(#aigoBrass)"/>
    <circle cx="48" cy="100" r="27" fill="none" stroke="url(#aigoBrass)" stroke-width="13"/>
    <circle cx="48" cy="100" r="33" fill="none" stroke="#FFF4C2" stroke-width="1.2" opacity=".55"/>
    <circle cx="48" cy="100" r="10" fill="url(#aigoKeyGem)" stroke="#FFF4C2" stroke-width="2"/>
  </g>
  {_spark(150, 48, 7)}{_spark(42, 150, 5, .7)}{_spark(166, 150, 4, .6)}
</svg>'''

LOCK_HOLES = ""
import math
for i, a in enumerate([-90, -18, 54, 126, 198]):
    x = 100 + 27 * math.cos(math.radians(a)); y = 136 + 27 * math.sin(math.radians(a))
    fill = "#FDE68A" if i == 0 else "#2E1065"
    LOCK_HOLES += f'<circle cx="{x:.1f}" cy="{y - 2:.1f}" r="5" fill="{fill}"/><rect x="{x - 2:.1f}" y="{y:.1f}" width="4" height="8" rx="1" fill="{fill}"/>'

LOCK = f'''<svg viewBox="0 0 200 200" aria-hidden="true" style="position: relative; width: 92%; height: 92%">
  <defs><radialGradient id="aigoLockGlow" cx=".5" cy=".55" r=".5"><stop offset="0" stop-color="#F5D0FE" stop-opacity=".7"/><stop offset="1" stop-color="#E879F9" stop-opacity="0"/></radialGradient>
  <linearGradient id="aigoSilver" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".5" stop-color="#CBD5E1"/><stop offset="1" stop-color="#64748B"/></linearGradient>
  <linearGradient id="aigoLockBody" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FAE8FF"/><stop offset=".3" stop-color="#E879F9"/><stop offset=".7" stop-color="#A21CAF"/><stop offset="1" stop-color="#4A044E"/></linearGradient></defs>
  <circle cx="100" cy="112" r="86" fill="url(#aigoLockGlow)"/>
  <path d="M64 98 V70 a36 36 0 0 1 72 0 V98" fill="none" stroke="url(#aigoSilver)" stroke-width="15" stroke-linecap="round"/>
  <rect x="42" y="88" width="116" height="94" rx="18" fill="url(#aigoLockBody)"/>
  <rect x="49" y="95" width="102" height="80" rx="13" fill="none" stroke="#FFFFFF" stroke-opacity=".45" stroke-width="2"/>
  <circle cx="100" cy="136" r="38" fill="#3B0764" opacity=".35"/>
  {LOCK_HOLES}
  <circle cx="56" cy="102" r="3.5" fill="#FAE8FF"/><circle cx="144" cy="102" r="3.5" fill="#FAE8FF"/><circle cx="56" cy="168" r="3.5" fill="#FAE8FF"/><circle cx="144" cy="168" r="3.5" fill="#FAE8FF"/>
  {_spark(160, 46, 7)}{_spark(36, 64, 5, .7)}
</svg>'''

TICKS = ""
for i in range(16):
    a = math.radians(i * 22.5); r1 = 44 if i % 4 == 0 else 48
    TICKS += f'<line x1="{100 + r1 * math.sin(a):.1f}" y1="{108 - r1 * math.cos(a):.1f}" x2="{100 + 53 * math.sin(a):.1f}" y2="{108 - 53 * math.cos(a):.1f}" stroke="#DCFCE7" stroke-width="{2.2 if i % 4 == 0 else 1.2}" opacity=".85"/>'

COMPASS = f'''<svg viewBox="0 0 200 200" aria-hidden="true" style="position: relative; width: 92%; height: 92%">
  <defs>{BRASS}<radialGradient id="aigoCompGlow" cx=".5" cy=".55" r=".5"><stop offset="0" stop-color="#BBF7D0" stop-opacity=".65"/><stop offset="1" stop-color="#4ADE80" stop-opacity="0"/></radialGradient>
  <radialGradient id="aigoCompFace" cx=".4" cy=".35" r=".75"><stop offset="0" stop-color="#166534"/><stop offset="1" stop-color="#052E16"/></radialGradient>
  <linearGradient id="aigoNeedle" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F0FDF4"/><stop offset="1" stop-color="#22C55E"/></linearGradient></defs>
  <circle cx="100" cy="108" r="86" fill="url(#aigoCompGlow)"/>
  <circle cx="100" cy="30" r="10" fill="none" stroke="url(#aigoBrass)" stroke-width="5"/>
  <circle cx="100" cy="108" r="68" fill="url(#aigoBrass)"/>
  <circle cx="100" cy="108" r="58" fill="url(#aigoCompFace)"/>
  {TICKS}
  <text x="100" y="72" text-anchor="middle" font-family="Montserrat, sans-serif" font-weight="800" font-size="12" fill="#F0FDF4">N</text>
  <g transform="rotate(32 100 108)">
    <path d="M100 62 L110 108 L90 108 Z" fill="url(#aigoNeedle)"/>
    <path d="M100 154 L110 108 L90 108 Z" fill="#CBD5E1" opacity=".85"/>
  </g>
  <circle cx="100" cy="108" r="7" fill="url(#aigoBrass)" stroke="#FFF4C2" stroke-width="1.5"/>
  <path d="M62 82 A46 46 0 0 1 98 60" fill="none" stroke="#FFFFFF" stroke-opacity=".35" stroke-width="4" stroke-linecap="round"/>
  {_spark(162, 52, 7)}{_spark(40, 160, 5, .7)}
</svg>'''

ART = {"learn": KEY, "test": LOCK, "help": COMPASS}

ITEMS = {  # Set 01 items: name, lore (draft, the Captain may rewrite)
    "learn": ("Three-Tooth Key", "Forged for doors that never open on the first knock. Its three teeth are who you are, what you need and how it should look. Miss one and the lock just spins."),
    "test": ("Proving Lock", "Five keyholes, no hints. It doesn't care how you learned, only whether your key is cut right."),
    "help": ("Pocket Compass", "It won't walk the road for you. Lost mid-task? It points once, toward one better move, then goes quiet."),
}
RARITY = {"common": ("●", "COMMON", "#475569"), "rare": ("◆", "RARE", "#0E7490"), "legendary": ("★", "LEGENDARY", "#B45309")}
