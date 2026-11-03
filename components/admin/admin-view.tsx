import Link from "next/link";
import { ArrowLeft, TriangleAlert } from "lucide-react";
import type { AdminStats, AdminStore } from "@/lib/data/admin";
import { PRO_PRICE_UYU } from "@/lib/catalog";
import { formatUYU } from "@/lib/format";
import { Logo } from "@/components/ui/logo";
import { SignupsChart } from "./signups-chart";

const dateLabel = new Intl.DateTimeFormat("es-UY", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "America/Montevideo",
});

function plural(count: number, one: string, many: string) {
  return `${count} ${count === 1 ? one : many}`;
}

/** 1830 → "1.830" */
function num(value: number) {
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function percent(part: number, total: number) {
  return total === 0 ? "–" : `${Math.round((part / total) * 100)} %`;
}

export function AdminView({ stats, stores }: { stats: AdminStats; stores: AdminStore[] }) {
  return (
    <>
      <header className="flex items-center justify-between lg:hidden">
        <Logo />
        <Link href="/panel" className="flex min-h-11 items-center gap-2 font-bold text-ink">
          <ArrowLeft className="size-4" aria-hidden /> Mi panel
        </Link>
      </header>

      <div className="flex flex-col gap-2">
        <h1 className="text-[2.4rem] leading-[1.05] lg:text-5xl">Administración</h1>
        <p className="text-ink-muted">
          Cómo va creciendo Reutilizalo. No incluye las cuentas del equipo.
        </p>
      </div>

      {stats.reportsOpen > 0 && (
        <p className="flex items-center gap-3 rounded-2xl bg-highlight p-4 font-bold text-ink">
          <TriangleAlert className="size-5 shrink-0" aria-hidden />
          {plural(stats.reportsOpen, "reporte abierto", "reportes abiertos")} sin revisar.
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        <section className="flex flex-col gap-1 rounded-3xl bg-ink p-6 text-white col-span-2 lg:row-span-2">
          <h2 className="font-sans text-xs font-medium uppercase tracking-[0.12em] text-white/70">
            Tiendas creadas
          </h2>
          <p className="font-display text-6xl font-extrabold leading-none text-white lg:text-7xl">
            {num(stats.storesTotal)}
          </p>
          <p className="mt-2 text-white/80">
            <strong className="text-highlight">+{stats.stores7d}</strong> esta semana ·{" "}
            <strong className="text-highlight">+{stats.stores30d}</strong> en 30 días
          </p>
          <p className="mt-auto pt-4 text-sm text-white/70">
            {plural(stats.storesWithItems, "tienda tiene", "tiendas tienen")} algo publicado (
            {percent(stats.storesWithItems, stats.storesTotal)} de las creadas).
          </p>
        </section>

        <Kpi label="Artículos publicados" value={stats.itemsActive} detail={`+${stats.items7d} esta semana`} />
        <Kpi label="Vendidos" value={stats.itemsSold} detail={plural(stats.reviewsTotal, "calificación", "calificaciones")} />
        <Kpi
          label="Toques en Lo quiero"
          value={stats.wantClicks7d}
          detail={`esta semana · ${num(stats.wantClicksTotal)} en total`}
        />
        <Kpi
          label="Plan Pro"
          value={stats.storesPro}
          detail={`${formatUYU(stats.storesPro * PRO_PRICE_UYU)} por mes`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <section className="rounded-3xl bg-surface p-6">
          <SignupsChart days={stats.signupsByDay} />
        </section>
        <section className="flex flex-col gap-1 rounded-3xl bg-surface p-6">
          <h2 className="font-sans text-xs font-medium uppercase tracking-[0.12em] text-ink-muted">
            Visitas a artículos
          </h2>
          <p className="font-display text-5xl font-extrabold leading-none text-ink">{num(stats.views7d)}</p>
          <p className="text-ink-muted">en los últimos 7 días</p>
          <p className="mt-auto pt-4 text-sm text-ink-muted">
            Se cuenta una visita por navegador, artículo y día; los robots no suman.
          </p>
        </section>
      </div>

      <section className="flex flex-col gap-3 lg:rounded-3xl lg:bg-surface lg:p-8">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-sans text-lg font-bold tracking-normal lg:text-2xl">Tiendas</h2>
          <p className="text-sm text-ink-muted">Las {stores.length} más recientes</p>
        </div>

        {stores.length === 0 ? (
          <p className="rounded-3xl bg-surface p-5 text-ink-muted lg:bg-canvas">
            Todavía no se creó ninguna tienda además de la del equipo.
          </p>
        ) : (
          <div>
            <div className="hidden border-b border-line pb-3 text-xs font-medium uppercase tracking-[0.12em] text-ink-muted lg:grid lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1.5fr)_64px_72px_72px_80px_120px] lg:gap-4">
              <span>Tienda</span>
              <span>Contacto</span>
              <span>Plan</span>
              <span className="text-right">Activos</span>
              <span className="text-right">Vendidos</span>
              <span className="text-right">Lo quiero</span>
              <span className="text-right">Alta</span>
            </div>
            <ul className="flex flex-col gap-3 lg:gap-0">
              {stores.map((store) => (
                <StoreRow key={store.id} store={store} />
              ))}
            </ul>
          </div>
        )}
      </section>
    </>
  );
}

function Kpi({ label, value, detail }: { label: string; value: number; detail: string }) {
  return (
    <section className="flex flex-col gap-1 rounded-3xl bg-surface p-5 md:p-6">
      <h2 className="font-sans text-xs font-medium uppercase tracking-[0.12em] text-ink-muted">{label}</h2>
      <p className="font-display text-3xl font-extrabold leading-none text-ink md:text-4xl">{num(value)}</p>
      <p className="text-sm text-ink-muted">{detail}</p>
    </section>
  );
}

function StoreRow({ store }: { store: AdminStore }) {
  const whatsappDigits = store.whatsapp.replace(/\D/g, "");
  return (
    <li className="flex flex-col gap-3 rounded-3xl bg-surface p-5 lg:grid lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1.5fr)_64px_72px_72px_80px_120px] lg:items-center lg:gap-4 lg:rounded-none lg:border-b lg:border-line lg:px-0 lg:py-4">
      <div className="min-w-0">
        <p className="truncate font-bold text-ink">{store.storeName}</p>
        <Link href={`/${store.nick}`} className="text-sm text-accent hover:underline">
          @{store.nick}
        </Link>
      </div>
      <div className="min-w-0 text-sm">
        <p className="truncate text-ink-soft" title={store.email}>
          {store.email}
        </p>
        <a
          href={`https://wa.me/${whatsappDigits}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent hover:underline"
        >
          {store.whatsapp}
        </a>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-muted lg:contents">
        <span className={`font-bold ${store.plan === "pro" ? "text-accent" : "text-ink-muted"}`}>
          {store.plan === "pro" ? "Pro" : "Gratis"}
        </span>
        <span className="lg:text-right">
          <span className="font-bold text-ink">{store.itemsActive}</span>
          <span className="lg:hidden"> activos</span>
        </span>
        <span className="lg:text-right">
          <span className="font-bold text-ink">{store.itemsSold}</span>
          <span className="lg:hidden"> vendidos</span>
        </span>
        <span className="lg:text-right">
          <span className="font-bold text-ink">{store.wantClicks}</span>
          <span className="lg:hidden"> Lo quiero</span>
        </span>
        <span className="lg:text-right">
          <span className="lg:hidden">Alta: </span>
          {dateLabel.format(new Date(store.createdAt)).replace(".", "")}
        </span>
      </div>
    </li>
  );
}
