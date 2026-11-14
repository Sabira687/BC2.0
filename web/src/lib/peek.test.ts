import { describe, expect, it } from "vitest";
import { peekItem } from "./peek";
import { createInitialState } from "./progress";
import { seededRandom } from "./testutil";
import { allTokens } from "./tokens";
import { MODULES, TESTS } from "./content";
import { fillPlaceholders } from "./generator";
import { buildProgram } from "./program";
import type { AppState, ItemId, Style } from "./types";

const fresh = (): AppState => createInitialState(seededRandom(7));
const withStyle = (s: AppState, style: Style, name = s.profile.name): AppState => ({ ...s, profile: { ...s.profile, style, name } });

const ids: ItemId[] = [...MODULES.flatMap((m) => [`learn:${m.id}` as ItemId, `test:${m.id}` as ItemId]), "help"];
const flat = (p: ReturnType<typeof peekItem>) => JSON.stringify(p);

describe("peekItem", () => {
  it("tunedFor shows the current name, style, goal and job", () => {
    const s = withStyle(fresh(), "mentor", "Anna");
    const p = peekItem(s, "learn:m1", 2048);
    const get = (l: string) => p.tunedFor.find((x) => x.label === l)?.value;
    expect(get("Name")).toBe("Anna");
    expect(get("Style")).toBe("Mentor");
    expect(get("Goal")).toBeTruthy();
    expect(get("Work")).toBeTruthy();
  });

  it("LEARN: styleDiff is not empty and Mentor differs from Straight talk", () => {
    const d = peekItem(fresh(), "learn:m1", 2048).styleDiff;
    expect(d).not.toBeNull();
    expect(d!.mentor.length).toBeGreaterThan(0);
    expect(d!.straight.length).toBeGreaterThan(0);
    expect(d!.mentor).not.toEqual(d!.straight);
  });

  it("LEARN has lessons, checks, format and markers; TEST describes only the structure", () => {
    const l = peekItem(fresh(), "learn:m1", 2048);
    expect(l.sections.length).toBeGreaterThanOrEqual(3);
    expect(l.sections.flatMap((s) => s.lines).join("\n")).toContain("ITEM ACTIVATED");
    const t = peekItem(fresh(), "test:m1", 2048);
    expect(t.sections.flatMap((s) => s.lines).join("\n")).toMatch(/10\/10\/10\/35\/35/);
    expect(t.sizeKb).toBeGreaterThan(0);
  });

  it("never reveals tokens, correct answers, hint answers or a RESULT CODE (all items, both styles)", () => {
    for (const style of ["mentor", "straight", "game"] as const) {
      const s = withStyle(fresh(), style);
      const secretStrings: string[] = [];
      const program = buildProgram(s.profile);
      for (const t of Object.values(TESTS)) {
        for (const q of t!.questions) secretStrings.push(q.options[q.answer]!, (q.hint.answer ?? ""));
        for (const p of t!.practical) for (const c of p.checklist) secretStrings.push(c, fillPlaceholders(c, program.project, s.profile));
        for (const p of t!.practical) secretStrings.push(p.hint.answer ?? "", fillPlaceholders(p.hint.answer ?? "", program.project, s.profile));
        for (const q of t!.questions) secretStrings.push(fillPlaceholders(q.options[q.answer]!, program.project, s.profile));
      }
      for (const id of ids) {
        const out = flat(peekItem(s, id, 1000));
        for (const tok of allTokens(s.secrets)) expect(out, `${id} leaks token ${tok}`).not.toMatch(new RegExp(`(?<![A-Za-z0-9])${tok.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![A-Za-z0-9])`));
        for (const a of secretStrings.filter(Boolean)) expect(out, `${id} leaks answer`).not.toContain(JSON.stringify(a).slice(1, -1));
        expect(out).not.toMatch(/RESULT CODE\s*:/i);
        expect(out).not.toMatch(/SV1-/);
        expect(out).not.toContain(s.secrets.playerId);
      }
    }
  });

  it("is identical for different secrets (nothing secret flows in)", () => {
    const a = fresh();
    const b = createInitialState(seededRandom(99));
    expect(allTokens(a.secrets)).not.toEqual(allTokens(b.secrets));
    for (const style of ["mentor", "straight", "game"] as const)
      for (const id of ids) expect(flat(peekItem(withStyle(a, style), id, 3000))).toBe(flat(peekItem(withStyle(b, style), id, 3000)));
  });
});
