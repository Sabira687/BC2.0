import type { Metadata } from "next";
import { ProView } from "@/components/ProView";

export const metadata: Metadata = { title: "Premium" };

export default function ProPage() {
  return <ProView />;
}
