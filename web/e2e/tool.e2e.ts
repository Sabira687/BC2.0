/**
 * Live e2e helper. Modes (env E2E_MODE):
 *   gen    → fresh John state in $E2E_DIR ($E2E_STYLE mentor|straight):
 *            state.json, learn.txt, test.txt, help.txt
 *   decode → apply the TEST result code $E2E_CODE to $E2E_DIR/state.json,
 *            print the decoded result and write the updated state
 *   hint   → read $E2E_DIR/conversation.json, write the hint panel's answer
 *            to hint.txt (empty when there is none) and print the hint; also
 *            run the console's capture on the last reply (like /console does),
 *            print what it found and save the updated state
 */
import { it } from "vitest";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { applyResultCode, createInitialState, createItem } from "@/lib/progress";
import { generateHelp, generateLearn, generateTest } from "@/lib/generator";
import { validateState } from "@/lib/store";
import { hintFor, lastStatus } from "@/lib/console";
import { applyCaptured, captureFromAssistant } from "@/lib/capture";
import { validateConversation } from "@/lib/conversation";
import type { AppState } from "@/lib/types";
import { JOHN } from "@/lib/profile";

const dir = process.env.E2E_DIR ?? "";
const appUrl = process.env.E2E_APP_URL ?? "http://localhost:3000";

function writeItems(state: AppState) {
  const ctx = { profile: state.profile, secrets: state.secrets, results: state.results, subscribed: state.subscription.active, appUrl };
  writeFileSync(join(dir, "state.json"), JSON.stringify(state, null, 2));
  writeFileSync(join(dir, "learn.txt"), generateLearn(ctx, "m1").text);
  writeFileSync(join(dir, "test.txt"), generateTest(ctx, "m1").text);
  writeFileSync(join(dir, "help.txt"), generateHelp(state).text);
}

it("e2e tool", () => {
  if (!dir) return;
  mkdirSync(dir, { recursive: true });
  if (process.env.E2E_MODE === "gen") {
    const style = process.env.E2E_STYLE === "straight" ? "straight" : "mentor";
    let s = createInitialState(undefined, { ...JOHN, style });
    for (const id of ["learn:m1", "test:m1", "help"] as const) s = createItem(s, id);
    writeItems(s);
    console.log(`player ${s.secrets.playerId}`);
  } else if (process.env.E2E_MODE === "hint") {
    const state = validateState(JSON.parse(readFileSync(join(dir, "state.json"), "utf8")));
    const conv = validateConversation(JSON.parse(readFileSync(join(dir, "conversation.json"), "utf8")));
    if (!state || !conv) throw new Error("bad state or conversation");
    const last = conv[conv.length - 1];
    let next = state;
    if (last?.role === "assistant") {
      const c = captureFromAssistant(last.content, lastStatus(conv));
      next = applyCaptured(state, c);
      console.log("CAPTURE " + JSON.stringify({ found: c, learnStars: next.learnStars, stamps: next.stamps, helpUsed: next.helpUsed }));
      if (next !== state) writeFileSync(join(dir, "state.json"), JSON.stringify(next, null, 2));
    }
    const h = hintFor(next, conv);
    writeFileSync(join(dir, "hint.txt"), h.answer ?? "");
    writeFileSync(join(dir, "hint.json"), JSON.stringify({ todo: h.todo, action: h.action ?? null, resultCode: h.resultCode ?? null, status: h.status ?? null }));
    console.log("HINT", JSON.stringify(h));
  } else if (process.env.E2E_MODE === "decode") {
    const state = validateState(JSON.parse(readFileSync(join(dir, "state.json"), "utf8")));
    if (!state) throw new Error("bad state.json");
    const r = applyResultCode(state, process.env.E2E_CODE ?? "");
    if (!r.ok) {
      console.log(`DECODE ERROR: ${r.error}`);
      return;
    }
    console.log("DECODED " + JSON.stringify({ result: r.result, cleared: r.cleared, isBest: r.isBest, unlocked: r.unlocked, newAchievements: r.newAchievements }));
    writeItems(r.state);
  }
});
