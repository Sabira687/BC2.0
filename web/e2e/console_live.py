"""
Live check of the in-browser console through the real /api/chat route.

Usage: python3 -I e2e/console_live.py <scratch-dir> <base-url> <script-file>
The script file has one step per line:
  item:learn | item:save | item:help   send that item (from <dir>/learn.txt …)
  hint                                 send the hint panel's ready answer (hintFor)
  text:<message>                       send a literal message
Writes <dir>/conversation.json, appends a transcript to <dir>/transcript.txt and
prints per-turn timing (time to first chunk, total, chunks) to show streaming.
"""
import json, os, subprocess, sys, time, urllib.request, urllib.error

d, base, script = sys.argv[1], sys.argv[2].rstrip("/"), sys.argv[3]
web = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
conv_path = os.path.join(d, "conversation.json")
conv = json.load(open(conv_path)) if os.path.exists(conv_path) else []
log = open(os.path.join(d, "transcript.txt"), "a", encoding="utf-8")

def tool(mode):
    env = dict(os.environ, E2E_DIR=d, E2E_MODE=mode)
    subprocess.run(["npx", "vitest", "run", "--config", "vitest.e2e.config.ts"], cwd=web, env=env, capture_output=True)

def hint():
    json.dump(conv, open(conv_path, "w"))
    tool("hint")
    return open(os.path.join(d, "hint.txt"), encoding="utf-8").read(), json.load(open(os.path.join(d, "hint.json")))

def send(text):
    conv.append({"role": "user", "content": text})
    body = json.dumps({"messages": conv}).encode()
    req = urllib.request.Request(base + "/api/chat", data=body, method="POST",
        headers={"content-type": "application/json", "origin": base})
    t0 = time.time(); first = None; chunks = 0; out = b""
    try:
        with urllib.request.urlopen(req, timeout=300) as r:
            while True:
                c = r.read1(4096)
                if not c: break
                if first is None: first = time.time() - t0
                chunks += 1; out += c
    except urllib.error.HTTPError as e:
        conv.pop()
        return None, f"HTTP {e.code}: {e.read().decode()}", (0, time.time() - t0, 0)
    reply = out.decode("utf-8")
    conv.append({"role": "assistant", "content": reply})
    return reply, None, (first or 0, time.time() - t0, chunks)

for n, step in enumerate(l.strip() for l in open(script) if l.strip()):
    if step.startswith("item:"):
        msg = open(os.path.join(d, step[5:] + ".txt"), encoding="utf-8").read(); label = step
    elif step == "hint":
        msg, h = hint(); label = f"hint (todo: {h['todo']})"
        if not msg: print(f"#{n} no hint answer: {h}"); break
    else:
        msg = step[5:]; label = "text"
    reply, err, (ttfb, total, chunks) = send(msg)
    shown = msg if not step.startswith("item:") else f"[{step[5:].upper()} item, {len(msg)} chars]"
    print(f"\n===== #{n} USER ({label}): {shown}")
    log.write(f"\n===== USER: {shown}\n")
    if err: print("ERROR", err); log.write("ERROR " + err + "\n"); break
    print(f"----- CLAUDE (first chunk {ttfb:.1f}s, total {total:.1f}s, {chunks} chunks):\n{reply}")
    log.write(f"----- CLAUDE:\n{reply}\n")
json.dump(conv, open(conv_path, "w"))
h_msg, h = hint()
print("\n===== FINAL HINT:", json.dumps(h))
