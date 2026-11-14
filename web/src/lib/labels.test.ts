import { describe, expect, it } from "vitest";
import { lessonLabel, lessonPosition, lessonsPhrase, setLabel } from "./labels";

describe("labels", () => {
  it("maps ids to player-facing names", () => {
    expect(setLabel("m1")).toBe("Set 01");
    expect(setLabel("m8")).toBe("Set 08");
    expect(lessonLabel("m1.1")).toBe("Lesson 1.1");
    expect(lessonLabel("m3.boss")).toBe("Final");
    expect(lessonPosition("m2.3")).toBe("Set 02 · Lesson 2.3");
    expect(lessonPosition("m1.boss")).toBe("Set 01 · Final");
  });
});

describe("lessonsPhrase", () => {
  it("spells the count and names the final task", () => {
    expect(lessonsPhrase(3)).toBe("three short lessons and a final task");
    expect(lessonsPhrase(3, false)).toBe("three short lessons");
  });
});
