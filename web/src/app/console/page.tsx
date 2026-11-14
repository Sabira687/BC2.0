import type { Metadata } from "next";
import { Suspense } from "react";
import { ConsoleView } from "@/components/console/ConsoleView";

export const metadata: Metadata = { title: "Your lesson with Claude" };

export default function ConsolePage() {
  return (
    <Suspense>
      <ConsoleView />
    </Suspense>
  );
}
