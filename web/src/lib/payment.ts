/** Test-mode checkout state machine (no real payment): idle -> confirming -> active, cancel -> idle. */
export type PaymentPhase = "idle" | "confirming" | "active";
export type PaymentEvent = "pay" | "confirmed" | "cancel";

export const CONFIRM_MS = 1200;

export const PAYMENT_TEXT = {
  idle: "Get Premium · $7 / month",
  confirming: "confirming test payment_",
  active: "✓ PREMIUM ACTIVE · TEST MODE",
  activeNote: "The connector and the advanced paths arrive at launch. In this demo, your Set 01 stays exactly as it was.",
  badge: "TEST MODE · NO REAL CHARGE",
} as const;

export function initialPhase(subscriptionActive: boolean): PaymentPhase {
  return subscriptionActive ? "active" : "idle";
}

export function nextPhase(phase: PaymentPhase, event: PaymentEvent): PaymentPhase {
  switch (event) {
    case "pay":
      return phase === "idle" ? "confirming" : phase;
    case "confirmed":
      return phase === "confirming" ? "active" : phase;
    case "cancel":
      return "idle";
  }
}
