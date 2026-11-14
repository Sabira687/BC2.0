import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { createInitialState } from "@/lib/progress";
import { seededRandom } from "@/lib/testutil";

let search = "";
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: () => {} }),
  usePathname: () => "/collection",
  useSearchParams: () => new URLSearchParams(search),
}));
vi.mock("@/lib/client/useAigo", () => ({
  useAigo: () => ({ state: createInitialState(seededRandom(7)), actions: { viewCollection: () => {}, createItem: () => {} } }),
}));

import { CollectionView } from "./CollectionView";

const html = (qs: string) => {
  search = qs;
  return renderToStaticMarkup(createElement(CollectionView));
};

describe("CollectionView render", () => {
  it.each(["", "by=set", "by=skill", "by=rarity", "by=rarity&type=learn", "by=skill&type=help&locked=0", "by=xyz&type=zzz&locked=maybe", "locked=0"])("renders without throwing: ?%s", (qs) => {
    expect(html(qs)).toContain("Your collection");
  });

  it("rarity view shows rarity headings and pressed state", () => {
    const h = html("by=rarity");
    expect(h).toContain("★ Legendary");
    expect(h).toContain("● Common");
    expect(h).toMatch(/aria-pressed="true"[^>]*>RARITY/);
  });

  it("invalid params fall back to the SET view", () => {
    expect(html("by=xyz")).toMatch(/aria-pressed="true"[^>]*>SET</);
  });

  it("fresh player: one OPEN SET 01 button (tile and next step), no per-card Create buttons", () => {
    const h = html("");
    expect((h.match(/OPEN SET 01/g) ?? []).length).toBe(2);
    expect(h).toContain("3 items made for you");
    expect(h).not.toContain("Create LEARN card");
    expect(h).not.toContain("Create TEST card");
    expect(h).not.toContain("Create HELP card");
  });
});
