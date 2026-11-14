import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import * as marketing from "./marketing";
import * as guide from "./content/guide";
import { PROJECTS, TONES, MODULES, TECHNIQUES, PRO_MOVES, TESTS } from "./content";
import { ITEMS, HELP_ITEM } from "./content/items";
import { CATALOG } from "./content/catalog";
import { REPLAY_LEARN_L11, REPLAY_LEARN_L11_USER, REPLAY_HELP, REPLAY_HELP_HISTORY } from "./content/replays";
import { itemPageModel } from "./itempage";
import { helpInstructions, learnInstructions, testInstructions, generateHelp, generateLearn, generateTest } from "./generator";
import { JOHN } from "./profile";
import { createInitialState } from "./progress";
import { seededRandom } from "./testutil";
import type { ItemId, Profile, Style } from "./types";

/** Words that must never show to players (the demo strip is called "QUICK DEMO · 3 MIN"). */
const BANNED = /jury|judge|hackathon|office jobs/i;

const SRC = join(process.cwd(), "src");

function files(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules") continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) files(p, out);
    else if (/\.(tsx?|css)$/.test(name) && !/\.(test|e2e)\./.test(name)) out.push(p);
  }
  return out;
}

describe("copy guard: no banned words in anything players can see", () => {
  it("marketing, guide and content data", () => {
    for (const [name, data] of Object.entries({ ...marketing, ...guide })) {
      if (typeof data === "function") continue;
      expect(JSON.stringify(data), name).not.toMatch(BANNED);
    }
    expect(JSON.stringify({ PROJECTS, TONES, MODULES, TECHNIQUES, PRO_MOVES, TESTS, ITEMS, HELP_ITEM, CATALOG })).not.toMatch(BANNED);
  });

  it("the Quick Demo strip carries the decided wording", () => {
    expect(marketing.QUICK_DEMO_STEPS).toHaveLength(4);
  });

  it("generated LEARN / TEST / HELP, instructions and pasted text, in every style", () => {
    for (const style of ["straight", "mentor", "game"] as Style[]) {
      const profile: Profile = { ...JOHN, style };
      const state = { ...createInitialState(seededRandom(3)), profile };
      const ctx = { profile, secrets: state.secrets, appUrl: "http://localhost:3000" };
      const all = [
        learnInstructions(ctx, "m1"),
        testInstructions(ctx, "m1"),
        helpInstructions(ctx),
        generateLearn(ctx, "m1").text,
        generateTest(ctx, "m1").text,
        generateHelp(ctx).text,
      ].join("\n");
      expect(all, style).not.toMatch(BANNED);
    }
  });

  it("the free path does not mention the Premium Promotion Kit or say level-up", () => {
    const FREE_ONLY = /promotion kit|level-up|level up/i;
    for (const style of ["straight", "mentor", "game"] as Style[]) {
      const profile: Profile = { ...JOHN, style };
      const state = { ...createInitialState(seededRandom(3)), profile };
      const ctx = { profile, secrets: state.secrets, appUrl: "http://localhost:3000" };
      const all = [
        learnInstructions(ctx, "m1"),
        testInstructions(ctx, "m1"),
        helpInstructions(ctx),
        generateLearn(ctx, "m1").text,
        generateTest(ctx, "m1").text,
        generateHelp(ctx).text,
      ].join("\n");
      expect(all, style).not.toMatch(FREE_ONLY);
    }
    expect(JSON.stringify({ PROJECTS, TONES })).not.toMatch(FREE_ONLY);
    const st = createInitialState(seededRandom(3));
    for (const id of ["learn:m1", "test:m1", "help"] as ItemId[]) expect(JSON.stringify(itemPageModel(st, id)), id).not.toMatch(FREE_ONLY);
    expect(JSON.stringify([REPLAY_LEARN_L11, REPLAY_LEARN_L11_USER, REPLAY_HELP, REPLAY_HELP_HISTORY])).not.toMatch(FREE_ONLY);
  });

  it("every source file (components, app, lib, styles): identifiers, class names, JSX text and string literals", () => {
    const list = files(SRC);
    expect(list.length).toBeGreaterThan(50);
    for (const f of list) expect(readFileSync(f, "utf8"), f).not.toMatch(BANNED);
  });
});
