import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStorePage } from "@/lib/data/store";
import { formatUYU } from "@/lib/format";
import { CONDITIONS } from "@/lib/catalog";
import { ItemDetailView } from "@/components/store/item-detail-view";
import { STORE_CONTAINER } from "@/components/store/store-desktop-header";

async function findItem(nick: string, itemId: string) {
  const page = await getStorePage(nick.toLowerCase());
  const item = page?.items.find((candidate) => candidate.id === itemId);
  return page && item ? { page, item } : null;
}

export async function generateMetadata({ params }: PageProps<"/[nick]/[itemId]">): Promise<Metadata> {
  const { nick, itemId } = await params;
  const found = await findItem(nick, itemId);
  if (!found) return { title: "Artículo no encontrado" };

  const { page, item } = found;
  const title = `${item.title} · ${formatUYU(item.priceUyu)}`;
  const description = `${CONDITIONS[item.condition]}. En la tienda de @${page.store.nick} en Reutilizalo.`;

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: `/${page.store.nick}/${item.id}` },
    openGraph: {
      type: "website",
      title,
      description,
      url: `/${page.store.nick}/${item.id}`,
      siteName: "Reutilizalo",
      locale: "es_UY",
      images: item.mainPhotoUrl ? [{ url: item.mainPhotoUrl, alt: item.title }] : undefined,
    },
    twitter: { card: item.mainPhotoUrl ? "summary_large_image" : "summary" },
  };
}

export default function ItemPage({ params }: PageProps<"/[nick]/[itemId]">) {
  return (
    <main className="flex w-full flex-1 flex-col">
      <Suspense fallback={<ItemSkeleton />}>
        <ItemContent params={params} />
      </Suspense>
    </main>
  );
}

async function ItemContent({ params }: { params: Promise<{ nick: string; itemId: string }> }) {
  const { nick, itemId } = await params;
  const found = await findItem(nick, itemId);
  if (!found) notFound();
  return <ItemDetailView page={found.page} item={found.item} />;
}

function ItemSkeleton() {
  return (
    <div className={STORE_CONTAINER} aria-hidden>
      <div className="h-12 rounded-full bg-surface" />
      <div className="flex flex-col gap-5 lg:grid lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-10">
        <div className="aspect-square rounded-3xl bg-surface" />
        <div className="h-24 rounded-2xl bg-surface" />
      </div>
    </div>
  );
}
