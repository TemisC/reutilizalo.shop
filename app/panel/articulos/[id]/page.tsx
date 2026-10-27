import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireSeller } from "@/lib/auth/session";
import { getSellerItem } from "@/lib/data/items";
import { photoPathFromUrl } from "@/lib/images/storage";
import { BackButton } from "@/components/ui/back-button";
import { ItemForm } from "@/components/panel/item-form";
import { PANEL_CONTAINER } from "@/components/panel/panel-sidebar";

export const metadata: Metadata = {
  title: "Editar artículo",
};

export default function EditItemPage({ params }: PageProps<"/panel/articulos/[id]">) {
  return (
    <main className={PANEL_CONTAINER}>
      <header className="lg:hidden">
        <BackButton href="/panel" />
      </header>
      <h1 className="text-[2.4rem] leading-[1.05] lg:text-5xl">Editar artículo</h1>
      <Suspense fallback={<div className="h-96 rounded-3xl bg-surface" aria-hidden />}>
        <EditItemContent params={params} />
      </Suspense>
    </main>
  );
}

async function EditItemContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const seller = await requireSeller();
  const item = /^[0-9a-f-]{36}$/i.test(id) ? await getSellerItem(seller.id, id) : null;
  if (!item) notFound();

  if (item.status === "removed_by_admin") {
    return (
      <p className="rounded-3xl bg-surface p-5 text-ink-muted">
        Este artículo fue retirado por moderación y no se puede editar.
      </p>
    );
  }

  return (
    <ItemForm
      userId={seller.id}
      itemId={item.id}
      initial={{
        title: item.title,
        description: item.description ?? "",
        price: String(item.priceUyu),
        category: item.category,
        condition: item.condition,
        defects: item.defects ?? "",
        honestyConfirmed: false,
        photos: item.photos.flatMap((photo) => {
          const path = photoPathFromUrl(photo.url);
          return path ? [{ kind: photo.kind, path, url: photo.url }] : [];
        }),
      }}
    />
  );
}
