import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Image as ImageIcon, Star } from "lucide-react";
import { CONDITIONS, PHOTO_SLOTS } from "@/lib/catalog";
import { formatScore, formatUYU } from "@/lib/format";
import { isReputationVisible } from "@/lib/reputation";
import type { PublicItem, StorePage } from "@/lib/data/store";
import { StoreTopBar } from "./store-top-bar";
import { StoreAvatar } from "./store-avatar";
import { CreateStoreBanner, MadeWithFooter } from "./growth";
import { StoreTheme } from "./store-theme";
import { STORE_CONTAINER, StoreDesktopHeader } from "./store-desktop-header";
import { ViewTracker } from "./view-tracker";

const KIND_LABELS = Object.fromEntries(PHOTO_SLOTS.map((slot) => [slot.kind, slot.label]));

export function ItemDetailView({ page, item }: { page: StorePage; item: PublicItem }) {
  const { store, reputation } = page;
  const sold = item.status === "sold";

  return (
    <StoreTheme accentColor={store.accentColor}>
      <ViewTracker itemId={item.id} />
      <StoreDesktopHeader nick={store.nick} title={store.storeName} />

      <div className={STORE_CONTAINER}>
        <div className="lg:hidden">
          <StoreTopBar nick={store.nick} title={store.storeName} />
        </div>

        {/* En pantallas grandes: fotos a la izquierda, datos y botón a la derecha. */}
        <div className="flex flex-col gap-5 lg:grid lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-start lg:gap-10">
          <PhotoGallery item={item} />

          <div className="flex flex-col gap-5 lg:sticky lg:top-6">
            <div className="flex flex-col gap-2">
              <span className="self-start rounded-full bg-surface px-3 py-1 text-sm font-bold text-ink">
                {CONDITIONS[item.condition]}
              </span>
              <h1 className="text-[2rem] leading-[1.1]">{item.title}</h1>
              <p className="font-display text-3xl font-bold text-ink">{formatUYU(item.priceUyu)}</p>
            </div>

            {sold ? (
              <p className="flex min-h-14 items-center justify-center rounded-[var(--radius-button)] bg-highlight text-lg font-bold text-ink">
                ¡Vendido! Ya tiene dueño
              </p>
            ) : (
              <a
                href={`/api/quiero/${item.id}`}
                target="_blank"
                rel="nofollow noopener"
                className="flex min-h-14 items-center justify-center rounded-[var(--radius-button)] bg-accent text-lg font-bold text-white transition-colors hover:bg-accent-hover"
              >
                Lo quiero
              </a>
            )}

            {!sold && (
              <p className="-mt-2 text-center text-sm text-ink-muted">
                Reutilizalo solo conecta a las personas: el precio, el pago y la entrega los acuerdas directo con
                quien vende.{" "}
                <Link href="/terminos" className="underline underline-offset-2">
                  Más info
                </Link>
              </p>
            )}

            {item.defects && (
              <section className="rounded-3xl bg-highlight/40 p-4">
                <h2 className="font-sans text-base font-bold tracking-normal">Detalles que tiene</h2>
                <p className="mt-1 whitespace-pre-line">{item.defects}</p>
              </section>
            )}

            {item.description && (
              <section>
                <h2 className="font-sans text-base font-bold tracking-normal">Descripción</h2>
                <p className="mt-1 whitespace-pre-line text-ink-soft">{item.description}</p>
              </section>
            )}

            <Link
              href={`/${store.nick}`}
              className="flex items-center gap-3 rounded-3xl bg-surface p-4 transition-colors hover:bg-chip-off"
            >
              <StoreAvatar name={store.storeName} avatarUrl={store.avatarUrl} size={48} />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-bold text-ink">{store.storeName}</span>
                <span className="flex items-center gap-1 text-sm text-ink-muted">
                  {isReputationVisible(reputation) ? (
                    <>
                      <Star className="size-3.5 fill-highlight text-highlight" aria-hidden />
                      {formatScore(reputation.average!)}/9 · {reputation.reviewCount} calificaciones
                    </>
                  ) : (
                    "Nueva en Reutilizalo"
                  )}
                </span>
              </span>
              <span className="flex items-center gap-1 text-sm font-bold text-accent">
                Ver tienda <ArrowRight className="size-4" aria-hidden />
              </span>
            </Link>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-4 lg:mt-10">
          <CreateStoreBanner />
          <MadeWithFooter />
        </div>
      </div>
    </StoreTheme>
  );
}

function PhotoGallery({ item }: { item: PublicItem }) {
  if (item.photos.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-3xl bg-surface">
        <ImageIcon className="size-10 text-ink-muted" aria-hidden />
      </div>
    );
  }

  return (
    // Carrusel deslizable en celular; en pantallas grandes, foto principal grande y el resto debajo.
    <div className="-mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 [scrollbar-width:none] lg:mx-0 lg:grid lg:grid-cols-3 lg:overflow-visible lg:px-0">
      {item.photos.map((photo, index) => (
        <figure
          key={photo.kind}
          className={`relative aspect-square shrink-0 snap-center overflow-hidden rounded-3xl bg-surface ${
            item.photos.length === 1 ? "w-full" : "w-[85%]"
          } lg:w-auto ${index === 0 ? "lg:col-span-3" : ""}`}
        >
          <Image
            src={photo.url}
            alt={`${item.title} — ${KIND_LABELS[photo.kind]}`}
            fill
            sizes={index === 0 ? "(max-width: 1023px) 90vw, 560px" : "(max-width: 1023px) 90vw, 190px"}
            priority={index === 0}
            className={`object-cover ${item.status === "sold" ? "grayscale" : ""}`}
          />
          <figcaption className="absolute bottom-3 left-3 rounded-full bg-ink/80 px-3 py-1 text-xs font-bold text-white">
            {KIND_LABELS[photo.kind]} · {index + 1}/{item.photos.length}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
