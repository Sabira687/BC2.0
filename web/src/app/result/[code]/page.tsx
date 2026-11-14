import type { Metadata } from "next";
import { ResultFromUrl } from "@/components/ResultFromUrl";

export const metadata: Metadata = { title: "Test result" };

/**
 * The code is read only in the browser (ResultFromUrl). This server component
 * deliberately ignores `params` so the code is never rendered or logged here.
 */
export default function ResultPage() {
  return (
    <ResultFromUrl />
  );
}
