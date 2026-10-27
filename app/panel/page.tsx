import { Suspense } from "react";
import type { Metadata } from "next";
import { requireSeller } from "@/lib/auth/session";
import { getSellerItems } from "@/lib/data/items";
import { getRecentReviews, getReputation } from "@/lib/data/reputation";
import { PanelView } from "@/components/panel/panel-view";
import { PANEL_CONTAINER } from "@/components/panel/panel-sidebar";

export const metadata: Metadata = {
  title: "Mi panel",
};

export default function PanelPage() {
  return (
    <main className={PANEL_CONTAINER}>
      <Suspense fallback={<PanelSkeleton />}>
        <PanelContent />
      </Suspense>
    </main>
  );
}

async function PanelContent() {
  const seller = await requireSeller();
  const [items, reputation, reviews] = await Promise.all([
    getSellerItems(seller.id),
    getReputation(seller.id),
    getRecentReviews(seller.id),
  ]);
  return <PanelView seller={seller} items={items} reputation={reputation} reviews={reviews} />;
}

function PanelSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-hidden>
      <div className="h-12 rounded-2xl bg-surface" />
      <div className="h-24 rounded-2xl bg-surface" />
      <div className="h-48 rounded-3xl bg-ink/90" />
      <div className="h-28 rounded-3xl bg-surface" />
      <div className="h-28 rounded-3xl bg-surface" />
    </div>
  );
}
