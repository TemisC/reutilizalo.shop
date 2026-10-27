import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStorePage } from "@/lib/data/store";
import { StoreView } from "@/components/store/store-view";
import { STORE_CONTAINER } from "@/components/store/store-desktop-header";

export async function generateMetadata({ params }: PageProps<"/[nick]">): Promise<Metadata> {
  const { nick } = await params;
  const page = await getStorePage(nick.toLowerCase());
  if (!page) return { title: "Tienda no encontrada" };

  const { store, items } = page;
  const description =
    store.bio ?? `Mira lo que vende @${store.nick} en Reutilizalo y escríbele directo por WhatsApp.`;
  const image = items.find((item) => item.mainPhotoUrl)?.mainPhotoUrl;

  return {
    title: { absolute: `${store.storeName} · reutilizalo.shop/${store.nick}` },
    description,
    alternates: { canonical: `/${store.nick}` },
    openGraph: {
      type: "website",
      title: store.storeName,
      description,
      url: `/${store.nick}`,
      siteName: "Reutilizalo",
      locale: "es_UY",
      images: image ? [{ url: image, alt: store.storeName }] : undefined,
    },
    twitter: { card: image ? "summary_large_image" : "summary" },
  };
}

export default function StorePage({ params }: PageProps<"/[nick]">) {
  return (
    <main className="flex w-full flex-1 flex-col">
      <Suspense fallback={<StoreSkeleton />}>
        <StoreContent params={params} />
      </Suspense>
    </main>
  );
}

async function StoreContent({ params }: { params: Promise<{ nick: string }> }) {
  const { nick } = await params;
  const page = await getStorePage(nick.toLowerCase());
  if (!page) notFound();
  return <StoreView page={page} />;
}

function StoreSkeleton() {
  return (
    <div className={STORE_CONTAINER} aria-hidden>
      <div className="h-12 rounded-full bg-surface" />
      <div className="flex items-center gap-4">
        <div className="size-18 rounded-full bg-surface" />
        <div className="h-16 flex-1 rounded-2xl bg-surface" />
      </div>
      <div className="h-20 rounded-3xl bg-surface" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <div className="h-72 rounded-3xl bg-surface" />
        <div className="h-72 rounded-3xl bg-surface" />
        <div className="hidden h-72 rounded-3xl bg-surface md:block" />
      </div>
    </div>
  );
}
