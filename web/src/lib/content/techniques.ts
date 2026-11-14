import type { Technique } from "@/lib/types";

/** Technique codes from spec/03 §9 (v2, Claude Chat), in result-token order. */
export const TECHNIQUES: readonly Technique[] = [
  { code: "1", name: "Brief formula: context + goal + format" },
  { code: "2", name: "Explicit output format" },
  { code: "3", name: "Your own material instead of retelling" },
  { code: "4", name: "Iterate instead of starting over" },
  { code: "5", name: "Ask for options" },
  { code: "6", name: "Examples and templates" },
  { code: "7", name: "Role" },
  { code: "8", name: "Structure for long documents" },
  { code: "9", name: "Fact-checking and sources" },
  { code: "A", name: "Ask the AI to critique its answer" },
  { code: "B", name: "Projects and standing instructions" },
  { code: "C", name: "Artifacts" },
];

/** Short names Claude may print on a STAMP EARNED line, matched to a technique (normalized by capture). */
export const TECHNIQUE_ALIASES: Readonly<Record<string, readonly string[]>> = {
  "1": ["Brief formula"],
  "2": ["Explicit format", "Output format"],
  "3": ["Your own material"],
  "4": ["Iterate"],
  "9": ["Fact-checking", "Fact checking"],
  A: ["Critique"],
  B: ["Projects"],
};
