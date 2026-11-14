import { notFound } from "next/navigation";
import type { ItemKind } from "@/lib/types";
import { ItemView } from "@/components/ItemView";
import { LIVE_KINDS, isItemKind } from "@/components/itemInfo";

export const dynamicParams = false;

export function generateStaticParams(): { kind: ItemKind }[] {
  return LIVE_KINDS.map((kind) => ({ kind }));
}

export default async function ItemPage({ params }: { params: Promise<{ kind: string }> }) {
  const { kind } = await params;
  if (!isItemKind(kind)) notFound();
  return <ItemView kind={kind} />;
}
