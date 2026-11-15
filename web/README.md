# AIGO Collection — web app

**AIGO Collection** (AIGO for short) **is a collection of skill cards for working with AI.** Each card
is a hidden instruction block you paste into Claude: Claude answers `▶ ITEM ACTIVATED · …` and turns
into a teacher, an examiner or a helper. Cards are grouped in **sets** (set = module = skill); mastery
is visible as **stars**, a **holographic** TEST card, a **stamp book** of verified techniques and a
**set badge**. Nothing is random, nothing is sold per card, no streaks, no points.

| Card | Mode | Stars | In the demo |
|---|---|---|---|
| **LEARN · Set N** | Theory and practice on your own work project | ★ per lesson cleared: 1.1 → ★, 1.2 → ★★, 1.3 + final challenge → ★★★ | Set 01 "The Clear Ask" |
| **TEST · Set N** | 5 tasks, score /100, result code | 50+ ★, 70+ ★★ (set passed), 90+ ★★★ (holographic) | Set 01 |
| **HELP** | One better move in the middle of real work | none | HELP |
| GAME / CHALLENGE | | | Coming soon |

**Set badge:** LEARN ★★★ + TEST ★★ or more + HELP used once (holographic with TEST ★★★).
**Stamps:** one per technique Claude verified in your own message (`STAMP EARNED · …`), plus a
gifted "Player One" stamp. Set 01 gives all three cards at once.

**Cards are items** (v4.1): Set 01's LEARN is the **Three-Tooth Key**, TEST the **Proving Lock**, HELP
the **Pocket Compass**, each with a short story, art and rarity (● Common sets 01–03, ◆ Rare 04–07,
★ Legendary Premium). Claude activates them by name: `▶ ITEM ACTIVATED · LEARN · Three-Tooth Key`.

**Tiers:** Free at launch = sets 01–07 (21 cards); **Premium $7/month** = AIGO Connector (MCP), Power
user + Automator paths (sets 08–15), monthly cards, Promotion Kit. **The demo is Set 01 only**: later
sets are labelled "Free · after the demo" / "Premium", and the Premium checkout is a clearly marked
test mode that opens nothing new in the demo.

The main scenario is to take a card to your own Claude (copy → paste → it activates). The built-in
**AI console** (`/console`, backed by the Claude API) is the quick try.

## Run

```bash
npm install
cp .env.example .env.local   # then set ANTHROPIC_API_KEY (server-side only)
npm run dev                  # http://localhost:3000
npm test                     # unit tests (Vitest)
npm run build                # production build
```

Without `ANTHROPIC_API_KEY` everything works except the console's replies: `/api/chat` answers
`503` with a clear message, and items can still be copied into claude.ai.

## What the user must provide

| What | Where | Needed for |
|---|---|---|
| `ANTHROPIC_API_KEY` | server env (`.env.local` locally, project env vars on the host) | the AI console |

The paywall is a **simulated** demo upgrade ($7/month, marked "demo"); no Stripe keys are used.

## Layout

```
src/lib/                 all logic, framework-free, unit-tested
  types.ts               domain types (profile, lessons, tests, hints, program, tokens, state)
  content/               library: 8 modules (m1 written in full with step hints), TEST · Module 1
                         (3 questions + 2 practical tasks with hints), projects, tones, HELP Pro moves,
                         technique codes
  profile.ts             questionnaire options (demo lock: Mentor / Straight talk selectable), validation
  sanitize.ts            user-text sanitizers (name, job, age, app URL)
  program.ts             profile + test results (+ subscription) → program
  generator.ts           LEARN / TEST / HELP text, base64-packed under a visible header
  encode.ts              UTF-8 base64, item header box, pack/unpack
  tokens.ts              per-player secret result tokens (crypto RNG, unambiguous alphabet)
  scoring.ts             10/10/10/35/35 scoring, stars (TEST by score, LEARN by lessons), pass mark (70)
  resultcode.ts          result code parsing/decoding, error messages
  progress.ts            collection (card statuses), result codes → results + stamps, set badge, achievements
                         (Player One, First Test, Set Clear), quests, paywall, demo fast-forward
  store.ts               versioned localStorage with full schema validation, reset
  console.ts             status-line parsing, result-code detection, hint for the current step/task
  capture.ts             reads Claude's marker lines (activation, CHECK PASSED ★, STAMP EARNED, HELP USED)
                         and applies them to the state (monotonic, idempotent)
  album.ts               collection album by set (counters, silhouettes, stars, holo) and stamp book
  notices.ts             console chips/notices ("LEARN card inserted", "Stamp earned: …")
  chat.ts                console request validation, limits, system prompt
  conversation.ts        console conversation persistence (validated; lesson and work chat separately)
  workchat.ts            Work chat: sample chat (demo data), hints, "Help used" → quest
  richtext.ts            tiny safe formatter (bold, lists, quotes) rendered as text nodes
  server/rateLimit.ts    in-memory per-IP / per-instance rate limiter
  client/useAigo.ts      the only React binding (useSyncExternalStore + storage events)
src/app/                 thin pages; src/app/api/chat/route.ts is the only server code
src/components/          minimal unstyled components (final UI comes from the design)
e2e/                     live check helpers (not part of npm test)
```

## Data flow

1. **Questionnaire** (`/start`): John is prefilled; the teaching style can be switched between
   Mentor and Straight talk (everything else is fixed in the demo). Stored in `localStorage`
   (`aigo:state:v4`; a v3 state is migrated on first load without data loss).
2. **First visit** creates a player: 5-char player ID and a **secret token table** — for each
   module's TEST a test token, right/wrong tokens for questions 1–3, pass/rewrite/fail tokens for
   practical tasks 4–5 and four score-bucket tokens, plus 12 technique tokens. All unique, random.
3. **Collection** (`/collection`): an album by set with counters ("1 / 3"), silhouettes for closed
   sets, stars, holo flag and flavor text per card. Set 01 gives LEARN, TEST and HELP at once. Card
   text is generated on the fly from the profile: sets by goal, start by level, project by reason,
   tone by style (the visible header names the style), task size by plan.
4. **Activation**: the first line of Claude's first reply to any card is
   `▶ ITEM ACTIVATED · LEARN|TEST · <set title>` or `▶ ITEM ACTIVATED · HELP`; the console shows a
   "<KIND> card inserted" chip (`data-card` on the composer) and reads the card type from that line,
   not from the tab.
5. **LEARN** in `/console` (or claude.ai): 7-step lessons; Claude ends every reply with
   `▮ LEARN · <player> · <lesson> · step n/7 <step>` and the hint panel shows the library hint for
   exactly that step. After a lesson's check Claude prints `✅ CHECK PASSED · ★★☆` and, only if the
   player's own message applied the technique, `STAMP EARNED · <technique>`. In the console these
   lines are **captured automatically** (`capture.ts`: tolerant to spacing, case, ⭐, markdown;
   stars only go up, stamps are a set). In your own Claude, LEARN progress isn't carried over;
   the TEST result code is the bridge.
6. **TEST**: 5 tasks with a status line `▮ TEST · <player> · m1 · task n/5 · score s/100`; hints for
   every task. It ends with `TEST COMPLETE · ★★★ · 92/100` and
   `RESULT CODE: SV1-<player>-<test>-<q1>-<q2>-<q3>-<p4>-<p5>-<stars>-<techniques…>` — Claude only
   copies tokens. The console offers "Add my result to my collection"; otherwise `/result/<code>` or
   the field on `/progress`. Techniques of passed practical tasks become stamps.
7. **Work chat** (second tab of `/console`): a normal chat with Claude through the same `/api/chat`,
   stored separately. "Load sample chat" (SAMPLE CHAT · DEMO DATA) inserts the spec/03 §8 history
   ("write me a report" → "no, shorter" → "no, more formal", pre-written replies); "Use Help" appends
   the player's HELP item, and Claude's one tip comes live (`▶ ITEM ACTIVATED · HELP` … `HELP USED`).
   Using Help marks HELP as used (needed for the set badge) and completes the Help quest.
8. **Decode** (`applyResultCode`): strict parsing (length caps, alphabet, case/whitespace/dash
   tolerance, pasted link or "RESULT CODE:" prefix accepted), wrong player, unknown/duplicate/
   conflicting tokens, mixed tests, missing tasks; the score is recomputed from the task tokens
   and must match the stars token. Same code twice → "already counted"; the best score per
   set is kept; 70+ (★★) passes the set (in the demo nothing beyond Set 01 opens).
9. **Progress** (`/progress`): stamp book (Player One + 12 techniques, Easy / Medium / Hard, earned
   or "???"), set badges (holographic at TEST ★★★), achievements Player One / First Test / Set Clear.
   **"Demo: fast-forward John"** (marked DEMO ONLY) gives Set 01 LEARN ★★★ and HELP used, then builds
   a TEST code (10/10/0/35/35 = 90 ★★★, holographic, one "thing to practice") and applies it through
   the real encode → decode → apply path; pressing it again changes nothing and it never lowers
   progress. Before it runs, the current state is saved as a validated snapshot
   (`aigo:demo-snapshot:v4`); **"Back to now"** restores it. "See John's test result" shows the
   Result screen for the demo result.

## Security notes

- No secrets in the browser; the API key is read only by `/api/chat`.
- `/api/chat`: same-origin only, body ≤ 400 KB (streamed cap), message ≤ 40k chars, conversation
  ≤ 80 messages / 250k chars, 12 req/min and 300/day per IP (platform IP, not the spoofable first
  `X-Forwarded-For` hop) plus a per-instance cap, bounded output, logs only token counts (never
  content), client disconnect aborts the upstream call.
- User text embedded into items (name, job) is sanitized so it can't add lines, headings or fences.
- Everything read from `localStorage` is validated field by field; stored scores are recomputed
  from task outcomes, never trusted; anything off → fresh state.
- CSP and security headers in `next.config.ts`; `Referrer-Policy: no-referrer` keeps result codes
  out of referrers; no `dangerouslySetInnerHTML` anywhere.
- Code protection is deliberately light (per the spec): tokens are random per player, hidden in
  base64 — readable if someone looks for them, unguessable by accident.

## Live check

`ITEM=test e2e/live.sh <scratch-dir>` runs John's TEST card through `claude -p` (the user's Claude
subscription) with tools disabled and the console's system prompt, answering every task with the
hint panel's ready answer (`WEAK_AT_TASK=4` sends a weak prompt first to exercise the rewrite), then
decodes the printed result code with the real decoder. `ITEM=learn` does the same for LEARN. After
every reply the console's capture runs too (`CAPTURE` lines: stars, stamps, help used).
The API key is used only for a short `/api/chat` smoke test.
