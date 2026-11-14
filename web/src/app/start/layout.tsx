import { Caveat } from "next/font/google";
import type { ReactNode } from "react";

// Handwriting for the questionnaire notebook only. Self-hosted by next/font (CSP font-src 'self').
const caveat = Caveat({ subsets: ["latin", "cyrillic"], weight: ["500", "700"], variable: "--font-hand", display: "swap" });

export default function StartLayout({ children }: { children: ReactNode }) {
  return <div className={caveat.variable}>{children}</div>;
}
