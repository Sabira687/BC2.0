import type { SkyStar } from "@/lib/sky";

/** Set 01 constellation shaped like a key (canvas PERKS/LINKS). Viewbox leaves room for the labels on both sides. */
export const POS: Record<SkyStar["id"], [number, number]> = {
  l1: [0, 150],
  l2: [90, 60],
  l3: [180, 150],
  final: [90, 240],
  test: [300, 240],
  help: [480, 240],
  badge: [480, 320],
};
export const LINKS: [SkyStar["id"], SkyStar["id"]][] = [["l1", "l2"], ["l2", "l3"], ["l3", "final"], ["final", "l1"], ["final", "test"], ["test", "help"], ["help", "badge"], ["test", "badge"]];
export type Label = { dx: number; dy: number; anchor: "start" | "middle" | "end" };
export const LABEL: Record<SkyStar["id"], Label> = {
  l1: { dx: -18, dy: 5, anchor: "end" },
  l2: { dx: 0, dy: -22, anchor: "middle" },
  l3: { dx: 18, dy: 5, anchor: "start" },
  final: { dx: 0, dy: 34, anchor: "middle" },
  test: { dx: 0, dy: 34, anchor: "middle" },
  help: { dx: 0, dy: -22, anchor: "middle" },
  badge: { dx: 18, dy: 5, anchor: "start" },
};

/** viewBox [minX, minY, width, height]; the left margin fits the longest left-anchored label (see skygeom.test.ts). */
export const SKY_VIEWBOX = [-290, 10, 950, 350] as const;
export const SKY_LABEL_FONT = 15;
/** Approximate mono advance per character (em). */
export const MONO_EM = 0.62;

/** Horizontal extent [left, right] of a star's label (with the " ✓" / " · NEXT" suffix) in viewBox units. */
export function labelExtent(id: SkyStar["id"], text: string): [number, number] {
  const l = LABEL[id];
  const x = POS[id][0] + l.dx;
  const w = text.length * SKY_LABEL_FONT * MONO_EM;
  if (l.anchor === "end") return [x - w, x];
  if (l.anchor === "start") return [x, x + w];
  return [x - w / 2, x + w / 2];
}
