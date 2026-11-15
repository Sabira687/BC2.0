import { describe, expect, it } from "vitest";
import { formatNext, nextLesson, reminderDelay, validateSchedule, TIMES } from "./schedule";

const ok = { days: ["Tue", "Fri"], time: "18:00", remind: 20 };

describe("validateSchedule", () => {
  it("accepts a valid schedule", () => expect(validateSchedule(ok)).toEqual(ok));
  it("rejects bad input", () => {
    expect(validateSchedule(null)).toBeNull();
    expect(validateSchedule({ ...ok, days: [] })).toBeNull();
    expect(validateSchedule({ ...ok, days: ["Funday"] })).toBeNull();
    expect(validateSchedule({ ...ok, days: ["Tue", "Tue"] })).toBeNull();
    expect(validateSchedule({ ...ok, time: "18:15" })).toBeNull();
    expect(validateSchedule({ ...ok, time: "25:00" })).toBeNull();
    expect(validateSchedule({ ...ok, remind: 15 })).toBeNull();
  });
  it("time grid is 07:00-22:00", () => {
    expect(TIMES[0]).toBe("07:00");
    expect(TIMES[TIMES.length - 1]).toBe("22:00");
  });
});

describe("nextLesson", () => {
  const s = validateSchedule(ok)!;
  it("same day later", () => {
    // 2026-11-17 is a Tuesday
    expect(nextLesson(s, new Date(2026, 10, 17, 9, 0))).toMatchObject({ day: "Tue", time: "18:00" });
  });
  it("rolls to next listed day", () => {
    expect(nextLesson(s, new Date(2026, 10, 17, 19, 0)).day).toBe("Fri");
  });
  it("wraps to next week", () => {
    expect(nextLesson(s, new Date(2026, 10, 20, 19, 0)).day).toBe("Tue");
  });
  it("formats", () => {
    expect(formatNext(s, new Date(2026, 10, 17, 9, 0))).toBe("Next lesson: Tue 18:00 · reminder 20 min before");
  });
  it("reminder delay", () => {
    expect(reminderDelay(s, new Date(2026, 10, 17, 17, 0))).toBe(40 * 60000);
    expect(reminderDelay(s, new Date(2026, 10, 17, 17, 50))).toBeNull();
  });
});
