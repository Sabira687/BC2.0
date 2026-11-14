"""Rebuild project/canvas.json: keep v3 pages, add v4 boards listed in V4 (only those whose file exists)."""
import json, os, sys
C = sys.argv[1]
P = C + "/project/canvas.json"
c = json.load(open(P))
V4 = [  # file, title, w, h, x, y, interactive, fill
 ("V4Style.dc.html", "v4 · 00 Style board", 1440, 1420, 0, 0, False, False),
 ("V4Landing.dc.html", "v4 · 01 Landing", 1440, 7050, 1520, 0, True, True),
 ("V4Start.dc.html", "v4 · 02 Questionnaire", 1440, 1450, 3040, 0, True, True),
 ("V4Collection.dc.html", "v4 · 03 Collection", 1440, 2250, 4560, 0, True, True),
 ("V4Reveal.dc.html", "v4 · 03b Card reveal storyboard", 1440, 760, 4560, 2380, False, False),
 ("V4Card.dc.html", "v4 · 04 Item page", 1440, 1650, 6080, 0, True, True),
 ("V4Console.dc.html", "v4 · 05 Console · lesson", 1440, 1100, 7600, 0, True, True),
 ("V4WorkChat.dc.html", "v4 · 05b Console · work chat", 1440, 1100, 9120, 0, True, True),
 ("V4Guide.dc.html", "v4 · 05c Guide (set up)", 1440, 1250, 9120, 1200, False, True),
 ("V4Progress.dc.html", "v4 · 06 Progress: skill sky + stamp passport", 1440, 1640, 10640, 0, True, True),
 ("V4Result.dc.html", "v4 · 07 Test result", 1440, 1060, 12160, 0, True, True),
 ("V4Pass.dc.html", "v4 · 08 Premium", 1440, 1160, 13680, 0, True, True),
]
for k in [k for k in c["boards"] if k.startswith("V4")]:
    del c["boards"][k]
c["order"] = [o for o in c["order"] if not o.startswith("V4")]
for f, t, w, h, x, y, inter, fill in V4:
    if not os.path.exists(C + "/project/" + f):
        continue
    b = {"title": t, "w": w, "h": h, "x": x, "y": y, "page": "v4"}
    if inter: b["is_interactive"] = True
    if fill: b["expand"] = "fill"
    c["boards"][f] = b
    c["order"].append(f)
c["pages"] = [{"id": "v4", "name": "v4 · Collector's album"}, {"id": "landing", "name": "Landing (v3)"}, {"id": "app", "name": "Platform (v3)"}]
c["notes"]["v4title"] = {"kind": "title1", "maxW": 15000, "text": "AIGO Collection v4 · Collector's album", "x": 0, "y": -300, "page": "v4"}
c["launch"] = {"view": "canvas", "page": "v4"}
open(P, "w").write(json.dumps(c, ensure_ascii=False, indent=2))
print("boards:", [k for k in c["boards"] if k.startswith("V4")])
