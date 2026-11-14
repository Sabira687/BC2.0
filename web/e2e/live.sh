#!/usr/bin/env bash
# Live check without the API key: drives one of John's items (ITEM=learn|test,
# default test) through `claude -p` with no tools and the console's system
# prompt (a plain chat, like /api/chat), answering each step with the hint
# panel's ready answer, and decodes the RESULT CODE at the end.
# Usage: [ITEM=test] [STYLE=mentor] [WEAK_AT_TASK=4] e2e/live.sh <scratch-dir> [max-turns]
set -euo pipefail
E="$1"; MAX="${2:-14}"
WEB="$(cd "$(dirname "$0")/.." && pwd)"
SYS="$(cd "$WEB" && node -e 'const s=require("fs").readFileSync("src/lib/chat.ts","utf8");const m=s.match(/CONSOLE_SYSTEM_PROMPT = \[([\s\S]*?)\]\.join/);console.log(eval("["+m[1]+"]").join("\n"))')"
run_tool() { (cd "$WEB" && E2E_DIR="$E" E2E_MODE="$1" E2E_CODE="${2:-}" E2E_STYLE="${STYLE:-mentor}" npx vitest run --config vitest.e2e.config.ts --reporter=verbose 2>&1 | grep -E "^(HINT|DECODE|CAPTURE|player)" || true); }
mkdir -p "$E/work"
[ -f "$E/state.json" ] || run_tool gen
append() { python3 - "$E/conversation.json" "$1" "$2" <<'PY'
import json,sys,os
p,role,f=sys.argv[1],sys.argv[2],sys.argv[3]
c=json.load(open(p)) if os.path.exists(p) else []
c.append({"role":role,"content":open(f).read()})
json.dump(c,open(p,"w"))
PY
}
# CONTINUE=1 keeps the current conversation (claude -c) and starts from hint.txt.
if [ "${CONTINUE:-0}" = 1 ]; then cp "$E/hint.txt" "$E/msg.txt"; FIRST=0; else
  rm -f "$E/conversation.json"; cp "$E/${ITEM:-test}.txt" "$E/msg.txt"; FIRST=1; fi
for i in $(seq 1 "$MAX"); do
  append user "$E/msg.txt"
  echo "===== TURN $i  USER: $(head -c 160 "$E/msg.txt" | tr '\n' ' ')"
  if [ $FIRST = 1 ]; then
    (cd "$E/work" && claude -p "$(cat "$E/msg.txt")" --tools "" --system-prompt "$SYS" --model claude-opus-5-5 < /dev/null) > "$E/reply.txt" 2>&1; FIRST=0
  else
    (cd "$E/work" && claude -c -p "$(cat "$E/msg.txt")" --tools "" --system-prompt "$SYS" --model claude-opus-5-5 < /dev/null) > "$E/reply.txt" 2>&1
  fi
  echo "----- CLAUDE:"; cat "$E/reply.txt"; echo
  append assistant "$E/reply.txt"
  run_tool hint
  if grep -q '"action":"apply_result"' "$E/hint.json"; then
    CODE=$(python3 -c "import json;print(json.load(open('$E/hint.json'))['resultCode'])")
    echo "===== RESULT CODE FOUND: $CODE"; cp "$E/state.json" "$E/state.before.json"; run_tool decode "$CODE"; exit 0
  fi
  if [ ! -s "$E/hint.txt" ]; then echo "===== NO HINT ANSWER, stopping"; cat "$E/hint.json"; exit 1; fi
  cp "$E/hint.txt" "$E/msg.txt"
  # WEAK_AT_TASK=n: the first answer to TEST task n is a deliberately weak prompt.
  if [ -n "${WEAK_AT_TASK:-}" ] && grep -q "\"task\":${WEAK_AT_TASK}," "$E/hint.json" && [ ! -f "$E/weak.sent" ]; then
    printf 'write an email about the deadline' > "$E/msg.txt"; touch "$E/weak.sent"; fi
done
echo "===== MAX TURNS REACHED"
