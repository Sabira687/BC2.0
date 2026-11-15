# AIGO Collection

**Collectible cards that teach you AI skills, inside your own AI.**

Each card is a digital item with its own story: the **Three-Tooth Key**, the **Proving Lock**, the **Pocket Compass**. Paste a card into your AI and it teaches you one skill on your real work: emails, reports, meeting notes. Stars and stamps come only when the AI checks what you did. Collect the set, earn the stamps, keep every card. No streaks, no timers, nothing random.

**Live: [aigo-collection.vercel.app](https://aigo-collection.vercel.app)** · no sign-up, works in the browser and on a phone.

## Try it in 3 minutes

1. **Start** — the questionnaire is pre-filled for a sample player, John. Change the name to yours, pick a teaching style (Mentor or Straight talk).
2. **Collection** — open Set 01: the Key (LEARN), the Lock (TEST) and the Compass (HELP).
3. **Console → Lesson** — press **Use this answer**, then **Send**. The live AI checks your ask; watch `✅ CHECK PASSED · ★☆☆` and your first stamp arrive.
4. **Console → Work chat** — load the sample chat, press **Use Compass**: one better move, then back to normal chat.
5. **Progress** — press **Fast-forward John** to see a finished set: the skill sky lit up, the stamp passport, a holographic Proving Lock (90/100 ★★★).
6. **Take the test** — the Proving Lock opens in the console: five tasks checked live, then **See your result ▸** opens the score screen.

Prefer your own AI? Copy any item from the collection into a new chat. The test ends with a **result code**; paste it on the Progress page and your stars come home.

Come back on schedule: question 9 of the questionnaire sets lesson days, a time and a reminder.

## How it works

```
item text (hidden instructions)  →  your AI chat  →  marker lines  →  AIGO progress
                                     ▶ ITEM ACTIVATED · LEARN · Three-Tooth Key
                                     ✅ CHECK PASSED · ★★☆
                                     ✦ STAMP EARNED · Explicit format
                                     TEST COMPLETE · ★★★ · 90/100  +  RESULT CODE: SV1-…
```

- **Items are generated per player** from the questionnaire (name, goal, teaching style) — not hard-coded text.
- **In the AIGO console** (in-browser chat on the Claude API) progress is captured automatically from the AI's marker lines.
- **In your own AI** the bridge is the result code: per-player token tables make it hard to forge; the site re-computes the score from the task tokens and rejects mismatches, foreign codes and repeats.
- Lessons are laid out with plain-text frames (`━━━`, `┌─ YOUR TURN`, `[✓]`) that read well both in the terminal-style console and in any AI chat.

## Plans

| | Free (at launch) | Premium · $7/month |
|---|---|---|
| Items | Core path: 7 skills, 21 items | + Power user and Automator paths, 24 Legendary items |
| Where | AIGO console and your own AI | + **AIGO Connector** (MCP): your collection inside your AI, progress saves itself |
| Extras | Skill sky, stamp passport, holo items, item updates | + new items every month, Promotion Kit, priority support |

This demo runs on a trimmed Free plan (Set 01). The Premium checkout is simulated in test mode: no card, no charge.

## Tech

- **Next.js 16** (App Router), **React 19**, **TypeScript strict**, **Vitest** — all game logic is pure functions in `web/src/lib/` with 1,080 unit tests.
- **Claude API** only on the server (`web/src/app/api/chat/route.ts`): key in server env, same-origin check, body and message caps, per-IP and global rate limits, no conversation logging (token counts only).
- Player state lives in the browser (localStorage); no accounts, no personal data on the server.
- Strict security headers (CSP, no-referrer, frame-ancestors none); fonts self-hosted.

## Run locally

```bash
cd web
npm install
cp .env.example .env.local   # set ANTHROPIC_API_KEY (server-side only)
npm run dev                  # http://localhost:3000
npm test                     # unit tests
npm run build                # production build
```

Without a key everything works except the live AI console, which explains how to use your own AI instead.

## Repository map

| Folder | What's inside |
|---|---|
| `web/` | The product: Next.js app, game logic, item generator, tests ([web/README.md](web/README.md)) |
| `design/` | Design system and the approved canvas: boards, clickable previews, generators |
| `spec/` | Product specs: user journey, item generation, learning design, progress, screens, v4–v5 design |
| `docs/` | Pitch deck (PDF), audience research, project brief, implementation plans, end-to-end test scenario |
| `analysis/` | Research on what made classic collecting games work (and what to leave behind) |
| `items/` | Early hand-written item drafts |

## Team

SKaiCode.
