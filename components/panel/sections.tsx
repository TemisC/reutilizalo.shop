import Image from "next/image";
import Link from "next/link";
import { Image as ImageIcon } from "lucide-react";
import type { Seller } from "@/lib/auth/session";
import type { SellerItem } from "@/lib/data/items";
import type { SellerReview } from "@/lib/data/reputation";
import { bestAndWorst, CRITERIA, isReputationVisible, type Reputation } from "@/lib/reputation";
import { formatScore, formatUYU } from "@/lib/format";
import { PRO_PRICE_UYU } from "@/lib/catalog";
import { buttonClasses } from "@/components/ui/button";
import { ItemActions } from "@/components/panel/item-actions";

export function ReputationCard({ reputation }: { reputation: Reputation }) {
  const enough = isReputationVisible(reputation);
  const extremes = enough ? bestAndWorst(reputation) : null;

  return (
    <section className="flex items-center gap-4 rounded-3xl bg-surface p-5 lg:p-6">
      <div className="flex size-20 shrink-0 flex-col items-center justify-center rounded-2xl bg-highlight text-ink">
        <span className="font-display text-3xl font-extrabold leading-none">
          {enough ? formatScore(reputation.average!) : "–"}
        </span>
        <span className="text-sm">de 9</span>
      </div>
      <div>
        <h2 className="font-sans text-lg font-bold tracking-normal">Tu reputación</h2>
        <p className="text-ink-muted">
          {enough ? (
            <>
              {reputation.reviewCount} calificaciones.
              {extremes && (
                <>
                  {" "}Lo mejor valorado: {CRITERIA[extremes.best[0]]} ({formatScore(extremes.best[1])}).
                  {extremes.worst &&
                    ` A mejorar: ${CRITERIA[extremes.worst[0]]} (${formatScore(extremes.worst[1])}).`}
                </>
              )}
            </>
          ) : (
            "Todavía no tienes calificaciones suficientes. Cuando vendas, pídele a tu comprador que te califique."
          )}
        </p>
      </div>
    </section>
  );
}

export function UsageCard({ seller, activeCount }: { seller: Seller; activeCount: number }) {
  const remaining = Math.max(0, seller.itemLimit - activeCount);
  const percent = Math.min(100, (activeCount / seller.itemLimit) * 100);

  return (
    <section className="flex flex-col gap-3 rounded-3xl bg-surface p-5 lg:justify-center lg:p-6">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-sans text-lg font-bold tracking-normal">Artículos publicados</h2>
        <p className="text-ink-muted">
          <span className="font-display text-2xl font-extrabold text-ink">{activeCount}</span> de{" "}
          {seller.itemLimit} {seller.plan === "free" ? "gratis" : "en Pro"}
        </p>
      </div>
      <div
        className="h-3 overflow-hidden rounded-full bg-chip-off"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={seller.itemLimit}
        aria-valuenow={activeCount}
        aria-label="Artículos activos"
      >
        <div className="h-full rounded-full bg-accent" style={{ width: `${percent}%` }} />
      </div>
      <p className="text-ink-muted">
        {remaining === 0
          ? "No te quedan lugares libres."
          : remaining === 1
            ? "Te queda 1 lugar libre."
            : `Te quedan ${remaining} lugares libres.`}
      </p>
    </section>
  );
}

const THUMB_COLORS = ["bg-[#e3ebe4]", "bg-[#f1e6d8]", "bg-[#efe1e5]", "bg-[#e3e7ef]"];

/** Columnas de la tabla de artículos en computadora (en celular cada artículo es una tarjeta). */
// La última columna tiene ancho fijo para que todas las filas queden alineadas.
const TABLE_COLUMNS = "lg:grid lg:grid-cols-[minmax(0,1fr)_96px_104px_172px] lg:items-center lg:gap-4";

export function ItemsTableHead() {
  return (
    <div
      className={`hidden border-b border-line pb-3 text-sm font-bold uppercase tracking-[0.08em] text-ink-muted ${TABLE_COLUMNS}`}
      aria-hidden
    >
      <span>Artículo</span>
      <span>Precio</span>
      <span>Interesados</span>
      <span className="text-right">Estado</span>
    </div>
  );
}

export function ItemRow({ item, index, showViews }: { item: SellerItem; index: number; showViews: boolean }) {
  const dimmed = item.status === "hidden" ? "opacity-60" : "";
  const price = formatUYU(item.priceUyu);
  const interested = item.interestedCount === 1 ? "1 persona" : `${item.interestedCount} personas`;
  const views = item.viewCount === 1 ? "1 visita" : `${item.viewCount} visitas`;

  return (
    <li
      className={`flex items-center gap-3 rounded-3xl bg-surface p-3 lg:rounded-none lg:border-b lg:border-line lg:px-0 lg:py-4 lg:last:border-b-0 ${TABLE_COLUMNS}`}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3 lg:gap-4">
        <Link
          href={`/panel/articulos/${item.id}`}
          className={`relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl ${THUMB_COLORS[index % THUMB_COLORS.length]}`}
          aria-label={`Editar ${item.title}`}
        >
          {item.mainPhotoUrl ? (
            <Image src={item.mainPhotoUrl} alt="" fill sizes="64px" className="object-cover" />
          ) : (
            <ImageIcon className="size-6 text-ink-muted" aria-hidden />
          )}
        </Link>
        <div className={`min-w-0 flex-1 ${dimmed}`}>
          <p className="truncate text-ink lg:line-clamp-2 lg:whitespace-normal lg:text-lg">{item.title}</p>
          <p className="whitespace-nowrap font-display text-lg font-bold text-ink lg:hidden">{price}</p>
          {/* Estadísticas del plan Pro, en celular debajo del precio. */}
          {showViews && (
            <p className="truncate text-sm text-ink-muted lg:hidden">
              {views} · {item.interestedCount} {item.interestedCount === 1 ? "interesado" : "interesados"}
            </p>
          )}
        </div>
      </div>
      <p className={`hidden whitespace-nowrap font-display text-xl font-bold text-ink lg:block ${dimmed}`}>{price}</p>
      <div className="hidden text-ink-muted lg:block">
        <p>{interested}</p>
        {showViews && <p className="text-sm">{views}</p>}
      </div>
      <div className="lg:flex lg:justify-end">
        <ItemActions itemId={item.id} status={item.status} />
      </div>
    </li>
  );
}

const relativeTime = new Intl.RelativeTimeFormat("es-UY", { numeric: "auto" });

function timeAgo(date: string) {
  const days = Math.round((Date.now() - new Date(date).getTime()) / 86_400_000);
  if (days < 7) return relativeTime.format(-days, "day");
  if (days < 30) return relativeTime.format(-Math.round(days / 7), "week");
  return relativeTime.format(-Math.round(days / 30), "month");
}

/** Últimas calificaciones (solo computadora, columna derecha del panel). */
export function RecentReviews({ reviews }: { reviews: SellerReview[] }) {
  return (
    <section
      id="calificaciones"
      className="hidden scroll-mt-6 flex-col gap-4 rounded-3xl bg-surface p-8 lg:flex"
    >
      <h2 className="font-sans text-2xl font-bold tracking-normal">Calificaciones recientes</h2>
      {reviews.length === 0 ? (
        <p className="text-ink-muted">
          Todavía no tienes calificaciones. Cuando vendas, pídele a tu comprador que te califique.
        </p>
      ) : (
        <ul className="flex flex-col">
          {reviews.map((review) => (
            <li key={review.id} className="flex gap-4 border-b border-line py-4 first:pt-0 last:border-b-0 last:pb-0">
              <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-highlight font-display text-xl font-extrabold text-ink">
                {formatScore(review.score)}
              </span>
              <div className="min-w-0">
                {review.comment && <p className="text-lg text-ink">&ldquo;{review.comment}&rdquo;</p>}
                <p className="mt-1 text-sm text-ink-muted">
                  {[review.buyerName, review.itemTitle, timeAgo(review.createdAt)].filter(Boolean).join(" · ")}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function ProCard() {
  return (
    <section className="mt-6 flex flex-col gap-3 rounded-3xl bg-highlight p-6 text-ink">
      <p className="text-sm font-bold uppercase tracking-[0.12em]">Plan Pro</p>
      <h2 className="text-3xl leading-tight">¿Tienes más de 5 cosas para vender?</h2>
      <p>
        Publica hasta 50 artículos y aparece en Explorar, donde te ve mucha más gente. {formatUYU(PRO_PRICE_UYU)} al mes.
      </p>
      <Link href="/#planes" className={`${buttonClasses("dark", "lg")} mt-2`}>
        Ver planes
      </Link>
    </section>
  );
}
