"use client";

import { useRef } from "react";
import { ChevronRight, Star, X } from "lucide-react";
import { CRITERIA, isReputationVisible, reputationLabel, type Criterion, type Reputation } from "@/lib/reputation";
import type { PublicReview } from "@/lib/data/store";
import { formatScore } from "@/lib/format";

const monthYear = new Intl.DateTimeFormat("es-UY", { month: "long", year: "numeric" });

export function ReputationBlock({
  reputation,
  reviews,
  nick,
}: {
  reputation: Reputation;
  reviews: PublicReview[];
  nick: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const visible = isReputationVisible(reputation);

  if (!visible) {
    return (
      <div className="flex items-center gap-3 rounded-3xl bg-surface p-4 lg:p-8">
        <span className="rounded-2xl bg-highlight px-3 py-2 text-sm font-bold text-ink">Nuevo</span>
        <p className="font-bold text-ink">Nueva en Reutilizalo</p>
      </div>
    );
  }

  const label = reputationLabel(reputation.average!);
  const count = reputation.reviewCount;
  const latest = reviews.find((review) => review.comment);
  const openDialog = () => dialogRef.current?.showModal();

  return (
    <>
      {/* Celular: resumen que abre el detalle. */}
      <button
        type="button"
        onClick={openDialog}
        className="flex items-center gap-4 rounded-3xl bg-surface p-4 text-left transition-colors hover:bg-chip-off lg:hidden"
      >
        <span className="flex items-center gap-1.5 rounded-2xl bg-highlight px-3 py-2 text-ink">
          <Star className="size-4 fill-current" aria-hidden />
          <span className="font-display text-xl font-extrabold">{formatScore(reputation.average!)}</span>
          <span className="text-sm">/9</span>
        </span>
        <span className="min-w-0 flex-1">
          {label && <span className="block font-bold text-ink">{label}</span>}
          <span className="block text-sm text-ink-muted">
            {count} {count === 1 ? "comprador calificó" : "compradores calificaron"} esta tienda
          </span>
        </span>
        <ChevronRight className="size-5 shrink-0 text-ink-muted" aria-hidden />
      </button>

      {/* Computadora: reputación desglosada a la vista. */}
      <section className="hidden flex-col gap-5 rounded-3xl bg-surface p-8 lg:flex" aria-label="Reputación">
        <div className="flex items-center gap-4">
          <span className="flex size-20 shrink-0 flex-col items-center justify-center rounded-2xl bg-highlight text-ink">
            <span className="font-display text-3xl font-extrabold leading-none">{formatScore(reputation.average!)}</span>
            <span className="text-sm">de 9</span>
          </span>
          <div className="min-w-0">
            {label && <p className="text-lg font-bold text-ink">{label}</p>}
            <p className="text-sm text-ink-muted">
              {count} {count === 1 ? "comprador calificó" : "compradores calificaron"} esta tienda
            </p>
          </div>
        </div>

        <CriteriaBars reputation={reputation} />

        {latest && (
          <figure className="flex flex-col gap-2 rounded-2xl bg-canvas p-4">
            <blockquote className="text-ink-soft">&ldquo;{latest.comment}&rdquo;</blockquote>
            <figcaption className="flex items-center gap-1 text-sm text-ink-muted">
              <Star className="size-3.5 fill-highlight text-highlight" aria-hidden />
              {formatScore(latest.score)} · {monthYear.format(new Date(latest.createdAt))}
            </figcaption>
          </figure>
        )}

        <button
          type="button"
          onClick={openDialog}
          className="self-start font-bold text-accent underline underline-offset-2"
        >
          Ver las {count} {count === 1 ? "reseña" : "reseñas"}
        </button>
      </section>

      <dialog
        ref={dialogRef}
        aria-labelledby="reputation-title"
        className="m-auto max-h-[85dvh] w-[calc(100%-2rem)] max-w-md rounded-3xl bg-canvas p-0 text-ink-soft backdrop:bg-ink/60"
        onClick={(event) => {
          // Cierra al tocar fuera del contenido.
          if (event.target === dialogRef.current) dialogRef.current.close();
        }}
      >
        <div className="flex flex-col gap-5 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 id="reputation-title" className="text-2xl">
                Reputación de @{nick}
              </h2>
              <p className="text-ink-muted">
                {formatScore(reputation.average!)} de 9 · {count}{" "}
                {count === 1 ? "calificación" : "calificaciones"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              aria-label="Cerrar"
              className="flex size-11 shrink-0 items-center justify-center rounded-full bg-surface"
            >
              <X className="size-5" aria-hidden />
            </button>
          </div>

          <div className="rounded-3xl bg-surface p-4">
            <CriteriaBars reputation={reputation} />
          </div>

          {reviews.some((review) => review.comment) && (
            <section className="flex flex-col gap-3">
              <h3 className="font-sans text-lg font-bold tracking-normal">Últimos comentarios</h3>
              <ul className="flex flex-col gap-3">
                {reviews
                  .filter((review) => review.comment)
                  .map((review) => (
                    <li key={review.id} className="flex flex-col gap-2 rounded-3xl bg-surface p-4">
                      <div className="flex items-center justify-between text-sm text-ink-muted">
                        <span className="flex items-center gap-1 font-bold text-ink">
                          <Star className="size-3.5 fill-highlight text-highlight" aria-hidden />
                          {formatScore(review.score)}
                        </span>
                        <span>{monthYear.format(new Date(review.createdAt))}</span>
                      </div>
                      <p>{review.comment}</p>
                      {review.sellerReply && (
                        <p className="rounded-2xl bg-chip-off p-3 text-sm">
                          <strong className="text-ink">Respuesta de @{nick}:</strong> {review.sellerReply}
                        </p>
                      )}
                    </li>
                  ))}
              </ul>
            </section>
          )}
        </div>
      </dialog>
    </>
  );
}

function CriteriaBars({ reputation }: { reputation: Reputation }) {
  return (
    <ul className="flex flex-col gap-3">
      {(Object.entries(reputation.byCriterion) as [Criterion, number | null][]).map(([criterion, value]) => (
        <li key={criterion} className="flex flex-col gap-1">
          <div className="flex justify-between text-sm">
            <span className="first-letter:uppercase">{CRITERIA[criterion]}</span>
            <span className="font-bold text-ink">{value === null ? "–" : formatScore(value)}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-chip-off">
            <div className="h-full rounded-full bg-accent" style={{ width: `${((value ?? 0) / 9) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
