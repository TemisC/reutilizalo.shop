import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { requireSeller } from "@/lib/auth/session";
import { countActiveItems } from "@/lib/data/items";
import { BackButton } from "@/components/ui/back-button";
import { buttonClasses } from "@/components/ui/button";
import { ItemForm } from "@/components/panel/item-form";
import { PANEL_CONTAINER } from "@/components/panel/panel-sidebar";

export const metadata: Metadata = {
  title: "Publicar un artículo",
};

export default function PublishPage() {
  return (
    <main className={PANEL_CONTAINER}>
      <Suspense fallback={<PublishSkeleton />}>
        <PublishContent />
      </Suspense>
    </main>
  );
}

async function PublishContent() {
  const seller = await requireSeller();
  const activeCount = await countActiveItems(seller.id);
  const atLimit = activeCount >= seller.itemLimit;

  const counter = (
    <p className="text-ink-muted">
      Artículo {Math.min(activeCount + 1, seller.itemLimit)} de {seller.itemLimit}
      {seller.plan === "free" ? " gratis" : ""}
    </p>
  );

  return (
    <>
      {/* En computadora se vuelve con el menú lateral. */}
      <header className="flex items-center justify-between lg:hidden">
        <BackButton href="/panel" />
        {counter}
      </header>
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-x-10">
        <div className="flex items-end justify-between gap-4">
          <h1 className="text-[2.4rem] leading-[1.05] lg:text-5xl">Publicar un artículo</h1>
          <div className="hidden pb-1 lg:block">{counter}</div>
        </div>
      </div>

      {atLimit ? (
        <section className="flex flex-col gap-4 rounded-3xl bg-highlight p-6 text-ink lg:max-w-xl">
          <h2 className="text-2xl">Llegaste a tu límite de artículos</h2>
          <p>
            {seller.plan === "free"
              ? "Con el plan gratis puedes tener 5 artículos activos. Marca alguno como vendido u ocúltalo, o pásate a Pro para publicar hasta 50."
              : "Marca alguno como vendido u ocúltalo para publicar otro."}
          </p>
          <Link href="/panel" className={buttonClasses("dark", "lg")}>
            Volver a mi panel
          </Link>
        </section>
      ) : (
        <ItemForm userId={seller.id} />
      )}
    </>
  );
}

function PublishSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-hidden>
      <div className="h-11 rounded-2xl bg-surface" />
      <div className="h-24 rounded-2xl bg-surface" />
      <div className="h-44 rounded-3xl bg-highlight/60" />
      <div className="grid grid-cols-2 gap-3">
        <div className="aspect-square rounded-3xl bg-surface" />
        <div className="aspect-square rounded-3xl bg-surface" />
      </div>
    </div>
  );
}
