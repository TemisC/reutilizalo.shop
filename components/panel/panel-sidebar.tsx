import Link from "next/link";
import { LogOut } from "lucide-react";
import { requireSeller, type Seller } from "@/lib/auth/session";
import { logout } from "@/lib/actions/auth";
import { greetingName, initialOf } from "@/lib/site";
import { Logo } from "@/components/ui/logo";
import { buttonClasses } from "@/components/ui/button";
import { PanelNav } from "./panel-nav";

/** Contenedor de las páginas del panel: columna de celular, ancho completo junto al menú en computadora. */
export const PANEL_CONTAINER =
  "mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-5 pb-12 pt-5 md:max-w-3xl md:px-8 lg:max-w-[1280px] lg:px-12 lg:py-10";

/** Menú lateral oscuro del panel, solo en computadora (en celular se mantiene la navegación actual). */
export async function PanelSidebar() {
  const seller = await requireSeller();
  return <PanelSidebarView seller={seller} />;
}

export function PanelSidebarView({ seller }: { seller: Seller }) {
  return (
    <aside className="sticky top-0 hidden h-dvh w-62 shrink-0 flex-col gap-8 overflow-y-auto bg-ink p-5 text-white lg:flex">
      <Logo tone="light" className="px-3 pt-3 text-2xl" />

      <PanelNav nick={seller.nick} />

      <div className="mt-auto flex flex-col gap-5">
        {seller.plan === "free" && (
          <section className="flex flex-col gap-3 rounded-3xl bg-highlight p-5 text-ink">
            <p className="text-sm font-bold uppercase tracking-[0.12em]">Plan Pro</p>
            <p>Hasta 50 artículos y apareces en Explorar.</p>
            <Link href="/#planes" className={buttonClasses("dark")}>
              Ver planes
            </Link>
          </section>
        )}

        <div className="flex items-center gap-3 px-1">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent font-display text-lg font-extrabold text-white">
            {initialOf(seller.storeName)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-bold">{greetingName(seller.storeName)}</p>
            <p className="text-sm text-white/70">{seller.plan === "pro" ? "Plan Pro" : "Plan gratis"}</p>
          </div>
          <form action={logout}>
            <button
              type="submit"
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
              className="flex size-10 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            >
              <LogOut className="size-5" aria-hidden />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
