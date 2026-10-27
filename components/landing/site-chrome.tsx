import Link from "next/link";
import { Logo } from "@/components/ui/logo";

/** Ancho de las páginas institucionales (landing, términos, privacidad). */
export const SITE_CONTAINER = "mx-auto w-full max-w-6xl px-5 md:px-10";

export function SiteHeader() {
  return (
    <header className={`${SITE_CONTAINER} flex flex-wrap items-center justify-between gap-x-6 gap-y-3 py-5`}>
      <Logo className="text-2xl" />
      <nav aria-label="Principal" className="flex flex-wrap items-center gap-x-1 gap-y-2">
        <Link href="/#como-funciona" className={navLink}>
          Cómo funciona
        </Link>
        <Link href="/#planes" className={navLink}>
          Planes
        </Link>
        <Link href="/login" className={navLink}>
          Iniciar sesión
        </Link>
        <Link
          href="/crear"
          className="ml-1 flex min-h-11 items-center rounded-full bg-ink px-5 font-bold text-white transition-colors hover:bg-ink-soft"
        >
          Crear mi tienda
        </Link>
      </nav>
    </header>
  );
}

const navLink = "flex min-h-11 items-center rounded-full px-3 text-ink-soft transition-colors hover:bg-surface hover:text-ink";

export function SiteFooter() {
  return (
    <footer
      className={`${SITE_CONTAINER} flex flex-col gap-3 py-8 text-sm text-ink-muted md:flex-row md:items-center md:justify-between`}
    >
      <p>© reutilizalo.shop · Hecho en Montevideo</p>
      <nav aria-label="Pie de página" className="flex flex-wrap gap-x-5 gap-y-2">
        <Link href="/#como-funciona" className={footerLink}>
          Cómo funciona
        </Link>
        <Link href="/#planes" className={footerLink}>
          Planes
        </Link>
        <Link href="/terminos" className={footerLink}>
          Términos de uso
        </Link>
        <Link href="/privacidad" className={footerLink}>
          Privacidad
        </Link>
      </nav>
    </footer>
  );
}

const footerLink = "text-accent underline underline-offset-2 hover:text-accent-hover";
