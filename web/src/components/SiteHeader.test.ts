import { describe, expect, it } from "vitest";
import { hidesAppHeader } from "./SiteHeader";

describe("hidesAppHeader", () => {
  it("hides only on the landing", () => {
    expect(hidesAppHeader("/")).toBe(true);
    for (const p of ["/collection", "/console", "/guide", "/progress", "/pro", "/start", "/item/x", "/result/abc"]) expect(hidesAppHeader(p)).toBe(false);
  });
});
