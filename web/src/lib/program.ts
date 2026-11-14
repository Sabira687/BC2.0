/**
 * Profile + test results (+ subscription) → program (spec/02, spec/03 §2/§5).
 */
import type { AppState, Goal, Level, ModuleId, ModuleStatus, Plan, Profile, Program, ProjectId, Reason, TestResult } from "./types";
import { MODULES, PROJECTS, TONES } from "./content";
import { isPass } from "./scoring";

export const MODULES_BY_GOAL: Record<Goal, readonly ModuleId[]> = {
  everyday: ["m1", "m2", "m3", "m4"],
  power: ["m1", "m2", "m3", "m4", "m5", "m6"],
  automator: ["m1", "m2", "m3", "m4", "m5", "m6", "m7", "m8"],
  jarvis: ["m1", "m2", "m3", "m4", "m5", "m6", "m7", "m8"],
};

export const START_BY_LEVEL: Record<Level, ModuleId> = {
  chatbot: "m1",
  tried_agent: "m2",
  regular_agent: "m3",
};

export const PROJECT_BY_REASON: Record<Reason, ProjectId> = {
  grow_job: "promotion_kit",
  career_switch: "job_switch_kit",
  own_project: "launch_kit",
};

export const TASK_SIZE_BY_PLAN: Record<Plan, Program["taskSize"]> = {
  free: "compact",
  pro: "compact",
  max: "full",
};

export type Results = Partial<Record<ModuleId, TestResult>>;

/**
 * Build the program. A module is done when its TEST was passed (70+).
 * Without a subscription only the start module is open (first module free).
 */
export function buildProgram(profile: Profile, results: Results = {}, subscribed = false): Program {
  const ids = MODULES_BY_GOAL[profile.goal];
  const start = START_BY_LEVEL[profile.level];
  const startIdx = ids.indexOf(start);
  const passed = (id: ModuleId) => {
    const r = results[id];
    return r !== undefined && isPass(r.score);
  };
  const current = ids.slice(startIdx).find((id) => !passed(id)) ?? null;
  const locked = subscribed ? [] : ids.filter((id) => id !== start);

  const modules = ids.map((id, i) => {
    const module = MODULES.find((m) => m.id === id);
    if (!module) throw new Error(`missing module ${id}`);
    let status: ModuleStatus;
    if (passed(id)) status = "done";
    else if (locked.includes(id)) status = "locked";
    else if (id === current) status = "current";
    else if (i < startIdx) status = "skipped";
    else status = "upcoming";
    return { module, status };
  });

  return {
    modules,
    project: PROJECTS[PROJECT_BY_REASON[profile.reason]],
    tone: TONES[profile.style],
    current,
    watchMe: profile.level === "chatbot" ? "always" : "on_request",
    taskSize: TASK_SIZE_BY_PLAN[profile.plan],
    locked,
  };
}

/** The program as the player sees it right now (paywall applied). */
export function programOf(state: Pick<AppState, "profile" | "results" | "subscription">): Program {
  return buildProgram(state.profile, state.results, state.subscription.active);
}
