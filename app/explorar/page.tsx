import type { Metadata } from "next";
import Link from "next/link";
import { Compass } from "lucide-react";
import { SiteFooter, SiteHeader, SITE_CONTAINER } from "@/components/landing/site-chrome";
import { buttonClasses } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Explorar",
  description: "Pronto vas a poder descubrir cosas usadas de todas las tiendas de Reutilizalo en un solo lugar.",
  robots: { index: false },
};

// Explorar se abre cuando haya suficientes tiendas (EXPLORE_OPEN en lib/catalog.ts). Mientras tanto, esta página.
export default function ExplorePage() {
  return (
    <>
      <SiteHeader />
      <main className={`${SITE_CONTAINER} flex flex-1 flex-col items-center justify-center gap-6 py-20 text-center`}>
        <span className="flex size-16 items-center justify-center rounded-3xl bg-highlight text-ink">
          <Compass className="size-8" aria-hidden />
        </span>
        <h1 className="max-w-xl text-[2.4rem] leading-[1.05] md:text-5xl">Explorar está en construcción</h1>
        <p className="max-w-lg text-lg text-ink-muted">
          Estamos juntando tiendas para que encuentres de todo en un solo lugar. Mientras tanto, cada vendedor
          comparte su tienda con su propio link.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href="/crear" className={buttonClasses("primary", "lg")}>
            Crear mi tienda gratis
          </Link>
          <Link href="/" className={buttonClasses("secondary", "lg")}>
            Volver al inicio
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
