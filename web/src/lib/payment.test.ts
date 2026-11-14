import { describe, expect, it } from "vitest";
import { PAYMENT_TEXT, initialPhase, nextPhase } from "./payment";
import { PRICE_USD_PER_MONTH } from "./generator";

describe("test checkout state machine", () => {
  it("starts from the stored subscription", () => {
    expect(initialPhase(false)).toBe("idle");
    expect(initialPhase(true)).toBe("active");
  });
  it("goes idle -> confirming -> active", () => {
    const c = nextPhase("idle", "pay");
    expect(c).toBe("confirming");
    expect(nextPhase(c, "confirmed")).toBe("active");
  });
  it("ignores out-of-order events", () => {
    expect(nextPhase("idle", "confirmed")).toBe("idle");
    expect(nextPhase("confirming", "pay")).toBe("confirming");
    expect(nextPhase("active", "pay")).toBe("active");
  });
  it("cancel returns to idle from any phase", () => {
    expect(nextPhase("active", "cancel")).toBe("idle");
    expect(nextPhase("confirming", "cancel")).toBe("idle");
  });
  it("button text carries the real price and is marked as a test", () => {
    expect(PAYMENT_TEXT.idle).toContain(`$${PRICE_USD_PER_MONTH}`);
    expect(PAYMENT_TEXT.badge).toMatch(/TEST MODE/);
  });
});

describe("PAYMENT_TEXT strip wording", () => {
  it("confirming and active lines", () => {
    expect(PAYMENT_TEXT.confirming).toBe("confirming test payment_");
    expect(PAYMENT_TEXT.active).toBe("✓ PREMIUM ACTIVE · TEST MODE");
    expect(PAYMENT_TEXT.activeNote).toMatch(/arrive at launch/);
  });
});
