# AIGO Collection v4 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the v3 item collection in `web/` into v4 "collectible skill cards": activation line, stars (instead of ranks), stamp book, set badge with holographic variant, automatic progress capture in the AIGO console, and a demo fast-forward.

**Architecture:** Pure logic in `web/src/lib/` (stars, stamps, set badge, capture of assistant lines, fast-forward), driven by markers that the generated item text tells Claude to print. The console reads those markers from assistant messages and updates `AppState`; the TEST result code stays the bridge for the user's own Claude. UI changes are wiring only; visual styling comes later from the design canvas.

**Tech Stack:** Next.js App Router, TypeScript strict, Vitest (existing `web/`).

**Spec:** `spec/06-collection-v4-design.md` (approved, incl. section 10). Background: `analysis/15-mechanics-proposal.md`, `analysis/16-design-proposal.md`.

## Global Constraints

- Nothing random, no per-card purchases, no streaks, no "don't lose your progress" copy, no points/currency/leaderboards.
- Stars and stamps only for **verified** skill (a check Claude actually passed).
- Item text must still work pasted into claude.ai (text/markdown only inside chat).
- Exact markers Claude prints (one per line, case-insensitive matching, tolerant to extra spaces and to ★/☆ vs ⭐):
  - `▶ ITEM ACTIVATED · LEARN · <set title>` / `▶ ITEM ACTIVATED · TEST · <set title>` / `▶ ITEM ACTIVATED · HELP`
  - `✅ CHECK PASSED · ★★☆` (LEARN, after a lesson clears; stars = lessons cleared: L1.1 → ★☆☆, L1.2 → ★★☆, L1.3 + boss → ★★★)
  - `STAMP EARNED · <technique name>` (technique names from `content/techniques.ts`)
  - `TEST COMPLETE · ★★★ · 92/100` followed by `RESULT CODE: …`
  - `HELP USED`
- TEST stars: score ≥90 → 3, ≥70 → 2, ≥50 → 1, else 0. LEARN stars: as above. HELP has no stars.
- Set badge: LEARN 3★ **and** TEST ≥2★ **and** HELP used at least once. Holographic: TEST 3★.
- Achievements: `player_one`, `first_test`, `set_clear` (rename of `module_clear`, title "Set Clear").
- Gifted progress: a `player_one` stamp is present from collection creation.
- Fast-forward button label: "Demo: fast-forward John", always marked as demo; it must go through the real encode → decode → apply path.
- Flavor text (English): LEARN m1 "Ask once. Get it right." · TEST m1 "Prove it in five tasks." · HELP "One better move, right when you need it."
- Testing rule: content checks via `claude -p` only (user's subscription); API key at most 1–2 smoke calls if `/api/chat` changes. Do not commit (the main session commits). Work only in `web/`.

## Review Focus

1. Claude's line differs slightly (extra spaces, ⭐ instead of ★, lowercase, missing `▶`) → capture still recognises it; unknown text is ignored, never throws.
2. The same conversation is re-read after reload or re-render → capture is idempotent (stars only go up, stamps are a set, help-used stays true).
3. Existing v3 state in localStorage (with `module_clear`, ranks) → migrates without data loss.
4. HELP item pasted in the Lesson tab or LEARN in Work chat → type is detected from the activation line, not from the tab.
5. Fast-forward pressed twice, or after real progress → idempotent; never lowers stars.

---

### Task 1: Stars and set badge model

**Files:**
- Modify: `web/src/lib/scoring.ts`, `web/src/lib/types.ts`, `web/src/lib/progress.ts`
- Test: `web/src/lib/scoring.test.ts`, `web/src/lib/progress.test.ts`

**Interfaces:**
- Produces: `type Stars = 0 | 1 | 2 | 3`; `testStars(score: number): Stars`; `learnStarsFor(lessonsCleared: { l1: boolean; l2: boolean; l3: boolean; boss: boolean }): Stars`; `AppState.learnStars: Partial<Record<ModuleId, Stars>>`; `AppState.stamps: StampId[]` where `type StampId = TechniqueCode | "player_one"`; `AppState.helpUsed: boolean`; `setBadge(state: AppState, module: ModuleId): { earned: boolean; holo: boolean }`; `AchievementId = "player_one" | "first_test" | "set_clear"`.

- [ ] **Step 1: Failing tests** — `testStars(89)===2`, `testStars(90)===3`, `testStars(70)===2`, `testStars(50)===1`, `testStars(49)===0`; `learnStarsFor({l1:true,l2:true,l3:true,boss:false})===2`, all true → 3; `setBadge` earned only when learn 3 ∧ test ≥2 ∧ helpUsed; holo only when test 3; `createInitialState().stamps` contains `"player_one"`; v3 state with `module_clear` loads as `set_clear`.
- [ ] **Step 2:** Run `npx vitest run src/lib/scoring.test.ts src/lib/progress.test.ts` → FAIL.
- [ ] **Step 3:** Implement; bump the store schema version in `store.ts` with a migration (ranks are derived, not stored; `module_clear` → `set_clear`; missing fields default to `{}`, `["player_one"]`, `false`).
- [ ] **Step 4:** Run the same command → PASS; full `npx vitest run` → PASS.

### Task 2: Generator markers

**Files:**
- Modify: `web/src/lib/generator.ts`, `web/src/lib/content/modules.ts` (flavor text), `web/src/components/itemInfo.ts`
- Test: `web/src/lib/generator.test.ts`

**Interfaces:**
- Consumes: Task 1 `Stars`.
- Produces: generated LEARN / TEST / HELP instructions that tell Claude to print the exact markers from Global Constraints; `ItemSummary.flavor: string`.

- [ ] **Step 1: Failing tests** — for both styles (mentor, straight), `learnInstructions` contains `▶ ITEM ACTIVATED · LEARN`, `CHECK PASSED`, `STAMP EARNED`; test instructions contain `▶ ITEM ACTIVATED · TEST` and `TEST COMPLETE`; help contains `▶ ITEM ACTIVATED · HELP` and `HELP USED`; no instruction text contains `Bronze`, `Silver`, `Gold`, `streak`; `itemSummary(JOHN,'m1').flavor === "Ask once. Get it right."` for LEARN.
- [ ] **Step 2:** Run `npx vitest run src/lib/generator.test.ts` → FAIL.
- [ ] **Step 3:** Implement; in LEARN instructions, `STAMP EARNED` is printed only after Claude has checked that the user's own message applied the technique.
- [ ] **Step 4:** Run → PASS.

### Task 3: Automatic capture in the console

**Files:**
- Create: `web/src/lib/capture.ts`
- Modify: `web/src/components/console/useConsoleChat.ts`
- Test: `web/src/lib/capture.test.ts`

**Interfaces:**
- Consumes: Task 1 state fields; `parseStatus` / `lastStatus` from `console.ts`; technique names from `content/techniques.ts`.
- Produces: `type Captured = { activated?: ItemKind; learnStars?: { module: ModuleId; stars: Stars }; stamps: TechniqueCode[]; helpUsed: boolean }`; `captureFromAssistant(text: string, status: Status | null): Captured`; `applyCaptured(state: AppState, c: Captured): AppState` (monotonic: stars max, stamps union, helpUsed OR).

- [ ] **Step 1: Failing tests** — fixtures: exact markers; `⭐⭐` variant; extra spaces and lowercase; unknown technique name ignored; repeated `applyCaptured` with the same input returns an equal state; HELP marker in a message without status sets `helpUsed`.
- [ ] **Step 2:** Run `npx vitest run src/lib/capture.test.ts` → FAIL.
- [ ] **Step 3:** Implement; call `applyCaptured(state, captureFromAssistant(text, lastStatus(messages)))` once per completed assistant message in both Lesson and Work chat.
- [ ] **Step 4:** Run → PASS.

### Task 4: Result code, result page and achievements

**Files:**
- Modify: `web/src/lib/progress.ts` (`applyResultCode`), `web/src/components/ResultView.tsx`, `web/src/components/ProgressView.tsx`
- Test: `web/src/lib/progress.test.ts`

**Interfaces:**
- Consumes: Tasks 1–3.
- Produces: applying a result code adds its techniques to `stamps`; result view shows stars (0–3) and a `holo` flag instead of rank; achievements computed with `set_clear`.

- [ ] **Step 1: Failing tests** — applying a perfect m1 code yields `testStars 3`, stamps include its techniques, `first_test` achieved; with learnStars 3 and helpUsed → `set_clear` achieved and `setBadge('m1').holo === true`.
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implement. **Step 4:** Run → PASS.

### Task 5: Demo fast-forward

**Files:**
- Modify: `web/src/lib/progress.ts`, `web/src/components/ProgressView.tsx`
- Test: `web/src/lib/progress.test.ts`

**Interfaces:**
- Produces: `fastForwardDemo(state: AppState): AppState` — sets m1 learnStars 3, `helpUsed` true, creates all three m1 cards, then applies `encodeResultCode(secrets, 'm1', perfect tasks, m1 techniques)` through `applyResultCode`; sets `state.demo.fastForwarded = true`.

- [ ] **Step 1: Failing tests** — after one call: `setBadge('m1')` earned and holo; calling twice equals calling once; after real progress with test 2★, fast-forward does not lower anything it doesn't own (test becomes 3★ only through the encoded code).
- [ ] **Step 2–4:** Run → FAIL, implement, run → PASS. Button "Demo: fast-forward John" on the progress page with a visible DEMO label.

### Task 6: UI wiring and copy

**Files:**
- Modify: `web/src/components/CollectionView.tsx`, `web/src/components/ItemView.tsx`, `web/src/components/console/ConsoleView.tsx`, `web/src/components/console/LessonView.tsx`, `web/src/components/console/Composer.tsx`, `web/src/components/ProgressView.tsx`, `web/src/app/page.tsx`

- [ ] **Step 1:** Collection grouped by set with counters ("1 / 3"), silhouettes for locked sets, stars and holo flag per card, flavor text.
- [ ] **Step 2:** Console: when the composer or last user message contains an item (`DATA_OPEN`), show an "inserted" chip with the card type and add a `data-card` attribute for the glow (styling later); show stars and newly earned stamps from capture.
- [ ] **Step 3:** Progress: stamp book (12 techniques + player_one; earned vs `???`), set badge with holo flag, fast-forward button.
- [ ] **Step 4:** Copy: "cards", "sets", "activate"; remove ranks and any streak wording; landing and item page present "take this card to your own Claude" as the main scenario.
- [ ] **Step 5:** `npm run build` and `npx vitest run` → PASS.

### Task 7: Live check

- [ ] **Step 1:** With `claude -p` / `claude -c -p` (subscription), run John's LEARN through L1.1 using the hint answer: output contains `▶ ITEM ACTIVATED · LEARN`, `CHECK PASSED · ★☆☆` (or equivalent) and at least one `STAMP EARNED`; feed the transcript to `captureFromAssistant` and confirm state.
- [ ] **Step 2:** Run TEST with hint answers: `TEST COMPLETE` with stars and a `RESULT CODE` that decodes with matching stars.
- [ ] **Step 3:** Run HELP on the spec §8 history: `▶ ITEM ACTIVATED · HELP` and `HELP USED`.
- [ ] **Step 4:** Report key output lines, any fixes, and the final test/build status.
