import type { LessonId, Module, ModuleId, ModuleTest, Technique, TechniqueCode } from "@/lib/types";
import { MODULES } from "./modules";
import { TECHNIQUES } from "./techniques";
import { TESTS } from "./tests";

export { MODULES } from "./modules";
export { TECHNIQUES } from "./techniques";
export { PROJECTS } from "./projects";
export { TONES } from "./tones";
export { PRO_MOVES } from "./proMoves";
export { TESTS } from "./tests";
export { ITEMS, HELP_ITEM, RARITY_META, itemFor, moduleOfItemName, rarityOfSet, tierOfSet, setNumberOf } from "./items";
export type { ItemDef, ItemInfo, Rarity, Tier } from "./items";

export function getModule(id: ModuleId): Module {
  const found = MODULES.find((m) => m.id === id);
  if (!found) throw new Error(`Unknown module: ${id}`);
  return found;
}

export function getTechnique(code: TechniqueCode): Technique {
  const found = TECHNIQUES.find((t) => t.code === code);
  if (!found) throw new Error(`Unknown technique: ${code}`);
  return found;
}

/** The TEST item for a module, if it is written. */
export function getTest(id: ModuleId): ModuleTest | undefined {
  return TESTS[id];
}

/** Every lesson id of m1..m8, in program order (32 ids). */
export const ALL_LESSON_IDS: readonly LessonId[] = MODULES.flatMap((m) => m.outline.map((o) => o.id));
export { CATALOG, CATALOG_COUNTS, catalogSet, findCatalogSet } from "./catalog";
export type { ArtKey, CatalogItem, CatalogSet } from "./catalog";
export { GUIDE_STEPS, GUIDE_WAYS, GUIDE_CHECKLIST, GUIDE_CONNECTOR } from "./guide";
export type { GuideStep, GuideVisual } from "./guide";

export interface LessonRef {
  id: LessonId;
  /** "1.3" */
  number: string;
  title: string;
  /** "Lesson 1.3 · Give It the Material" */
  label: string;
}

/** First written lesson whose techniques include the code (null while the set is only an outline). */
export function lessonForTechnique(code: TechniqueCode): LessonRef | null {
  for (const m of MODULES) {
    const l = m.lessons?.find((x) => x.techniques.includes(code));
    if (l) {
      const number = l.id.replace(/^m/, "");
      return { id: l.id, number, title: l.title, label: `Lesson ${number} · ${l.title}` };
    }
  }
  return null;
}
