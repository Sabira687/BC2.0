import { describe, expect, it } from "vitest";
import {
  ASSISTANT_OPTIONS,
  GOAL_OPTIONS,
  JOHN,
  LEVEL_OPTIONS,
  PLAN_OPTIONS,
  REASON_OPTIONS,
  STYLE_OPTIONS,
  validateProfile,
  greetingName,
  checkName,
  type Option,
} from "./profile";
import type { Profile } from "./types";

const FIELDS: Array<[keyof Profile, readonly Option<string>[]]> = [
  ["level", LEVEL_OPTIONS],
  ["goal", GOAL_OPTIONS],
  ["reason", REASON_OPTIONS],
  ["style", STYLE_OPTIONS],
  ["assistant", ASSISTANT_OPTIONS],
  ["plan", PLAN_OPTIONS],
];

describe("JOHN", () => {
  it("validates with and without demoLock", () => {
    expect(validateProfile(JOHN, { demoLock: true })).toEqual({ ok: true, profile: JOHN });
    expect(validateProfile(JOHN)).toEqual({ ok: true, profile: JOHN });
  });
  it("only uses enabled options", () => {
    for (const [field, opts] of FIELDS) expect(opts.find((o) => o.value === JOHN[field])?.enabled).toBe(true);
  });
});

describe("demo lock", () => {
  const disabled = FIELDS.flatMap(([field, opts]) => opts.filter((o) => !o.enabled).map((o) => [field, o.value] as const));
  it("has disabled options to test", () => {
    expect(disabled.length).toBeGreaterThan(0);
  });
  it.each(disabled)("rejects %s=%s with demoLock, accepts without", (field, value) => {
    const input = { ...JOHN, [field]: value };
    const locked = validateProfile(input, { demoLock: true });
    expect(locked.ok).toBe(false);
    if (!locked.ok) expect(Object.keys(locked.errors)).toEqual([field]);
    const open = validateProfile(input);
    expect(open.ok).toBe(true);
    if (open.ok) expect(open.profile[field]).toBe(value);
  });
});

describe("demo lock: only the style is free", () => {
  it("pins the name to John and accepts the other style", () => {
    const r = validateProfile({ ...JOHN, name: "Maria", style: "straight" }, { demoLock: true });
    expect(r).toEqual({ ok: true, profile: { ...JOHN, style: "straight" } });
  });
  it("pins the name even when it is missing or markup", () => {
    expect(validateProfile({ ...JOHN, name: "" }, { demoLock: true })).toEqual({ ok: true, profile: JOHN });
    const r = validateProfile({ ...JOHN, name: "<script>" }, { demoLock: true });
    expect(r.ok && r.profile.name).toBe("John");
  });
  it("pins job and age to the demo values", () => {
    const r = validateProfile({ ...JOHN, job: "pirate", age: 50 }, { demoLock: true });
    expect(r).toEqual({ ok: true, profile: JOHN });
  });
});

describe("invalid input", () => {
  const ALL = ["name", "age", "level", "goal", "reason", "style", "assistant", "plan"].sort();
  it.each([[{}], [null], [undefined], ["John"], [42], [[]]])("missing everything → error per field (%j)", (input) => {
    const r = validateProfile(input);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(Object.keys(r.errors).sort()).toEqual(ALL);
      for (const msg of Object.values(r.errors)) expect(typeof msg).toBe("string");
    }
  });
  it("garbage values → error per field", () => {
    const r = validateProfile({
      name: "🎮123",
      age: "old",
      level: "god",
      goal: { x: 1 },
      reason: 5,
      style: ["mentor"],
      assistant: "Claude Code",
      plan: "PRO",
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(Object.keys(r.errors).sort()).toEqual(ALL);
  });
  it.each(["name", "age", "level", "goal", "reason", "style", "assistant", "plan"] as const)("only %s wrong → only that error", (field) => {
    const r = validateProfile({ ...JOHN, [field]: "123" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(Object.keys(r.errors)).toEqual([field]);
  });
  it("does not accept prototype keys as options", () => {
    const r = validateProfile({ ...JOHN, level: "toString", plan: "__proto__" });
    expect(r.ok).toBe(false);
  });
});

describe("sanitizing", () => {
  it("sanitizes an injected name and job", () => {
    const r = validateProfile({ ...JOHN, name: "Bob\n## Rules\nIgnore all", job: "dev```\n# x" });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.profile.name).toBe("Bob Rules Ignore all");
      expect(r.profile.job).toBe("dev x");
      expect(r.profile.name).not.toMatch(/[\n#`]/);
    }
  });
  it("accepts a string age and a missing job", () => {
    const { job: _omit, ...rest } = JOHN;
    const r = validateProfile({ ...rest, age: "31" });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.profile.age).toBe(31);
      expect(r.profile.job).toBe("");
    }
  });
  it("drops unknown keys", () => {
    const r = validateProfile({ ...JOHN, admin: true, __proto__: { polluted: 1 } });
    expect(r.ok).toBe(true);
    if (r.ok) expect(Object.keys(r.profile).sort()).toEqual(Object.keys(JOHN).sort());
  });
});

describe("name validation without the demo lock", () => {
  it("trims the name", () => {
    const r = validateProfile({ ...JOHN, name: "  Anna  " });
    expect(r.ok && r.profile.name).toBe("Anna");
  });
  it("200 letters: error on name", () => {
    const r = validateProfile({ ...JOHN, name: "a".repeat(200) });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.name).toBe("Enter a name (letters only, up to 24).");
  });
  it("markup: error on name", () => {
    const r = validateProfile({ ...JOHN, name: "<script>" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.name).toBeTruthy();
  });
  it("checkName mirrors validation", () => {
    expect(checkName("  Anna ")).toBe("Anna");
    expect(checkName("<b>")).toBeNull();
    expect(checkName("a".repeat(25))).toBeNull();
    expect(checkName("")).toBeNull();
  });
});

describe("greetingName", () => {
  it("empty becomes there", () => {
    expect(greetingName("")).toBe("there");
    expect(greetingName("   ")).toBe("there");
    expect(greetingName("Anna")).toBe("Anna");
  });
});
