import Link from "next/link";
import { ArrowRight, ChevronRight, Compass } from "lucide-react";

/** Elemento de crecimiento 2: banner oscuro. */
export function CreateStoreBanner() {
  return (
    <section className="flex flex-col gap-4 rounded-3xl bg-ink p-6 text-white md:flex-row md:items-end md:justify-between md:gap-10 md:p-10">
      <div className="flex flex-col gap-4 md:max-w-xl">
        <span className="self-start rounded-full bg-highlight px-3 py-1 text-sm font-bold text-ink">GRATIS</span>
        <h2 className="text-[2rem] leading-[1.1] text-white">
          ¿Quieres crear tu propia tienda para vender tus cositas usadas entre tus conocidos?
        </h2>
        <p className="text-white/80">
          Sube hasta 5 artículos sin pagar nada, recibe tu link reutilizalo.shop/tunombre y ponlo en tu bio
          de Instagram.
        </p>
      </div>
      <div className="flex flex-col gap-4 md:w-72 md:shrink-0">
        <Link
          href="/crear"
          className="flex min-h-14 items-center justify-center gap-2 rounded-[var(--radius-button)] bg-white text-lg font-bold text-ink transition-colors hover:bg-chip-off"
        >
          Crear mi tienda gratis <ArrowRight className="size-5" aria-hidden />
        </Link>
        <p className="text-center text-sm text-white/70">Sin tarjeta · Lista en 2 minutos</p>
      </div>
    </section>
  );
}

/** Elemento de crecimiento 3: link a Explorar (los Pro pueden ocultarlo). */
export function ExploreCard() {
  return (
    <Link
      href="/explorar"
      className="flex items-center gap-4 rounded-3xl bg-surface p-4 transition-colors hover:bg-chip-off lg:px-8 lg:py-6"
    >
      <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-highlight text-ink">
        <Compass className="size-6" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-bold text-ink">¿No encontraste lo que buscabas?</span>
        <span className="block text-sm text-ink-muted">Descubre más cosas cerca tuyo</span>
      </span>
      <ChevronRight className="size-5 shrink-0 text-ink lg:hidden" aria-hidden />
      <span className="hidden shrink-0 items-center gap-1 font-bold text-accent lg:flex">
        Ir a Explorar <ArrowRight className="size-4" aria-hidden />
      </span>
    </Link>
  );
}

/** Elemento de crecimiento 4: pie obligatorio. */
export function MadeWithFooter() {
  return (
    <footer className="pb-4 pt-2 text-center text-ink-muted">
      Hecho con{" "}
      <Link href="/" className="font-bold text-accent underline underline-offset-2">
        reutilizalo.shop
      </Link>
    </footer>
  );
}
