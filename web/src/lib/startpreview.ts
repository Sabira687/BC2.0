/** First-reply preview for the Start screen, built from the real module and tone data (spec/03 §5, generator "Session start"). */
import type { ModuleId, Style } from "./types";
import { TONES, getModule } from "./content";
import { sanitizeName } from "./sanitize";
import { lessonsPhrase } from "./labels";

export interface FirstReply {
  styleLabel: string;
  /** What Claude says first (greeting by name, one-line promise, the question). */
  text: string;
  /** One real tone rule baked into the card for this style. */
  rule: string;
}

export function firstReply(style: Style, rawName: string, module: ModuleId = "m1"): FirstReply {
  const name = sanitizeName(rawName);
  const mod = getModule(module);
  const first = mod.outline[0];
  const finals = mod.outline.filter((o) => o.id.endsWith(".boss")).length;
  const lessons = lessonsPhrase(mod.outline.length - finals, finals > 0);
  const tone = TONES[style];
  const ask = first ? `Start with ${first.id.replace("m", "")} ${first.title}?` : "Ready to start?";
  const text =
    style === "straight"
      ? `${name}. ${mod.title}: ${lessons} on your own work. ${ask}`
      : `Hi ${name}! I'll teach you a new skill: ${mod.title}. ${lessons} on your own work, and I'll explain why each step matters. ${ask}`;
  return { styleLabel: tone.label, text, rule: tone.rules[0] ?? "" };
}
