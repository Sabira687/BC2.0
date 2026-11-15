/** Optional lesson schedule. Stored separately from the validated AppState. */
export const SCHEDULE_KEY = "aigo:schedule:v1";
export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
export type Day = (typeof DAYS)[number];
export const REMIND_OPTIONS = [10, 20, 30] as const;
export type Schedule = { days: Day[]; time: string; remind: 10 | 20 | 30 };

export const TIMES: string[] = Array.from({ length: 31 }, (_, i) => {
  const m = 7 * 60 + i * 30;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
});

function validTime(t: unknown): t is string {
  if (typeof t !== "string") return false;
  const m = /^(\d{2}):(\d{2})$/.exec(t);
  if (!m) return false;
  const h = Number(m[1]);
  return h >= 0 && h <= 23 && (m[2] === "00" || m[2] === "30");
}

export function validateSchedule(raw: unknown): Schedule | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (!Array.isArray(r.days) || r.days.length === 0) return null;
  const seen = new Set<string>();
  for (const d of r.days) {
    if (typeof d !== "string" || !(DAYS as readonly string[]).includes(d) || seen.has(d)) return null;
    seen.add(d);
  }
  if (!validTime(r.time)) return null;
  if (r.remind !== 10 && r.remind !== 20 && r.remind !== 30) return null;
  const days = DAYS.filter((d) => seen.has(d));
  return { days, time: r.time, remind: r.remind };
}

/** Next lesson at or after `now` (local time). */
export function nextLesson(schedule: Schedule, now: Date): { day: Day; time: string; at: Date } {
  const [h, m] = schedule.time.split(":").map(Number);
  for (let add = 0; add <= 7; add++) {
    const at = new Date(now.getFullYear(), now.getMonth(), now.getDate() + add, h, m, 0, 0);
    const day = DAYS[(at.getDay() + 6) % 7] as Day;
    if (schedule.days.includes(day) && at.getTime() >= now.getTime()) return { day, time: schedule.time, at };
  }
  // unreachable for a valid schedule
  return { day: schedule.days[0] as Day, time: schedule.time, at: now };
}

export function formatNext(schedule: Schedule, now: Date): string {
  const n = nextLesson(schedule, now);
  return `Next lesson: ${n.day} ${n.time} · reminder ${schedule.remind} min before`;
}

/** Milliseconds until the reminder should fire, or null if it is already past. */
export function reminderDelay(schedule: Schedule, now: Date): number | null {
  const n = nextLesson(schedule, now);
  const d = n.at.getTime() - schedule.remind * 60000 - now.getTime();
  return d >= 0 ? d : null;
}

export function loadSchedule(): Schedule | null {
  try {
    if (typeof localStorage === "undefined") return null;
    const s = localStorage.getItem(SCHEDULE_KEY);
    return s ? validateSchedule(JSON.parse(s)) : null;
  } catch {
    return null;
  }
}

export function saveSchedule(s: Schedule | null): void {
  try {
    if (typeof localStorage === "undefined") return;
    if (s) localStorage.setItem(SCHEDULE_KEY, JSON.stringify(s));
    else localStorage.removeItem(SCHEDULE_KEY);
  } catch {
    /* storage unavailable */
  }
}

const MAX_TIMEOUT = 2147483647;

/** Schedules a notification while the tab is open. Returns a cancel function. */
export function startReminder(schedule: Schedule | null): () => void {
  if (!schedule || typeof window === "undefined" || typeof Notification === "undefined") return () => {};
  const delay = reminderDelay(schedule, new Date());
  if (delay === null || delay > MAX_TIMEOUT) return () => {};
  const t = setTimeout(() => {
    if (Notification.permission === "granted") {
      new Notification("Lesson soon", { body: `Your lesson starts in ${schedule.remind} minutes.` });
    }
  }, delay);
  return () => clearTimeout(t);
}
