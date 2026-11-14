import { Suspense } from "react";
import { CollectionView } from "@/components/CollectionView";

export default function CollectionPage() {
  return (
    <Suspense fallback={<p>Loading…</p>}>
      <CollectionView />
    </Suspense>
  );
}
