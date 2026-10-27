import Link from "next/link";
import { Link2 } from "lucide-react";
import { storeUrl } from "@/lib/site";
import { Logo } from "@/components/ui/logo";
import { ShareButton } from "./share-button";

/** Contenedor de las páginas públicas de una tienda: columna de celular, ancho completo en computadora. */
export const STORE_CONTAINER =
  "mx-auto flex w-full max-w-md flex-1 flex-col gap-5 px-5 pb-6 pt-5 md:max-w-3xl md:px-8 lg:max-w-7xl lg:px-10 lg:pt-10";

/** Encabezado blanco de la tienda, solo en computadora (en celular va StoreTopBar). */
export function StoreDesktopHeader({ nick, title }: { nick: string; title: string }) {
  return (
    <header className="hidden border-b border-line bg-surface lg:block">
      <div className="mx-auto grid h-18 max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-6 px-10">
        <Logo className="justify-self-start" />
        <Link
          href={`/${nick}`}
          className="flex min-h-11 items-center gap-2 rounded-full bg-canvas px-5 text-ink-soft"
        >
          <Link2 className="size-4 shrink-0" aria-hidden />
          <span>
            reutilizalo.shop/ <strong className="font-bold text-ink">{nick}</strong>
          </span>
        </Link>
        <nav className="flex items-center justify-end gap-2" aria-label="Reutilizalo">
          <ShareButton url={storeUrl(nick)} title={title} labeled />
          <Link href="/explorar" className="flex min-h-11 items-center rounded-full px-4 font-bold text-ink hover:bg-canvas">
            Explorar
          </Link>
          <Link
            href="/crear"
            className="flex min-h-11 items-center rounded-full bg-ink px-5 font-bold text-white transition-colors hover:bg-ink/85"
          >
            Crear mi tienda
          </Link>
        </nav>
      </div>
    </header>
  );
}
