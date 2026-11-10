import Link from "next/link";
import { TriangleAlert } from "lucide-react";
import type { AdminReferralStats, AdminReferrer, ReferralGroup } from "@/lib/data/admin";

/** Porcentaje de vacías entre las que ya tuvieron 7 días para publicar (las recientes no cuentan). */
function emptyRate(group: ReferralGroup) {
  const settled = group.published + group.empty;
  return settled === 0 ? null : Math.round((group.empty / settled) * 100);
}

function plural(count: number, one: string, many: string) {
  return `${count} ${count === 1 ? one : many}`;
}

const COLUMNS =
  "lg:grid lg:grid-cols-[minmax(0,1.2fr)_64px_88px_64px_80px_64px_minmax(0,1.4fr)] lg:items-center lg:gap-4";

export function ReferralsSection({ stats, referrers }: { stats: AdminReferralStats; referrers: AdminReferrer[] }) {
  const referredRate = emptyRate(stats.referred);
  const organicRate = emptyRate(stats.organic);
  // Aviso solo con datos suficientes: al menos 5 invitadas con 7 días o que ya publicaron.
  const suspicious =
    referredRate !== null &&
    stats.referred.published + stats.referred.empty >= 5 &&
    referredRate - (organicRate ?? 0) >= 15;

  return (
    <section className="flex flex-col gap-4 lg:rounded-3xl lg:bg-surface lg:p-8">
      <div className="flex flex-col gap-1">
        <h2 className="font-sans text-lg font-bold tracking-normal lg:text-2xl">Invitaciones</h2>
        <p className="text-sm text-ink-muted">
          Una tienda vacía nunca publicó nada y tiene más de 7 días. Las de menos de 7 días sin publicar son
          recientes: todavía pueden hacerlo.
        </p>
      </div>

      {suspicious && (
        <p className="flex items-center gap-3 rounded-2xl bg-highlight p-4 font-bold text-ink">
          <TriangleAlert className="size-5 shrink-0" aria-hidden />
          Las tiendas invitadas quedan vacías bastante más que las que llegan solas. Revisa las señales de la
          tabla.
        </p>
      )}

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_220px] lg:gap-4">
        <GroupCard title="Llegaron invitadas" group={stats.referred} rate={referredRate} />
        <GroupCard title="Llegaron solas" group={stats.organic} rate={organicRate} />
        <div className="flex flex-col gap-1 rounded-3xl bg-surface p-5 md:col-span-2 lg:col-span-1 lg:bg-canvas">
          <h3 className="font-sans text-xs font-medium uppercase tracking-[0.12em] text-ink-muted">
            Lugares extra entregados
          </h3>
          <p className="font-display text-4xl font-extrabold leading-none text-ink">{stats.bonusSlots}</p>
          <p className="text-sm text-ink-muted">artículos gratis de más, entre todas las tiendas</p>
        </div>
      </div>

      {referrers.length === 0 ? (
        <p className="rounded-3xl bg-surface p-5 text-ink-muted lg:bg-canvas">
          Todavía nadie se registró con un link de invitación.
        </p>
      ) : (
        <div>
          <div
            className={`hidden border-b border-line pb-3 text-xs font-medium uppercase tracking-[0.12em] text-ink-muted ${COLUMNS}`}
          >
            <span>Quién invita</span>
            <span className="text-right">Invitó</span>
            <span className="text-right">Publicaron</span>
            <span className="text-right">Vacías</span>
            <span className="text-right">Recientes</span>
            <span className="text-right">Ganó</span>
            <span>Señales</span>
          </div>
          <ul className="flex flex-col gap-3 lg:gap-0">
            {referrers.map((referrer) => (
              <ReferrerRow key={referrer.id} referrer={referrer} />
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function GroupCard({ title, group, rate }: { title: string; group: ReferralGroup; rate: number | null }) {
  const segments = [
    { key: "published", value: group.published, className: "bg-accent", label: group.published === 1 ? "publicó" : "publicaron" },
    { key: "recent", value: group.recent, className: "bg-highlight", label: group.recent === 1 ? "reciente" : "recientes" },
    { key: "empty", value: group.empty, className: "bg-ink-muted", label: group.empty === 1 ? "vacía" : "vacías" },
  ];

  return (
    <div className="flex flex-col gap-3 rounded-3xl bg-surface p-5 lg:bg-canvas">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-sans text-xs font-medium uppercase tracking-[0.12em] text-ink-muted">{title}</h3>
        <p className="text-sm text-ink-muted">{plural(group.total, "tienda", "tiendas")}</p>
      </div>
      <p className="text-ink-muted">
        <span className="font-display text-4xl font-extrabold leading-none text-ink">
          {rate === null ? "–" : `${rate} %`}
        </span>{" "}
        vacías
      </p>
      {group.total > 0 && (
        <div className="flex h-2.5 gap-0.5 overflow-hidden rounded-full" aria-hidden>
          {segments
            .filter((segment) => segment.value > 0)
            .map((segment) => (
              <span key={segment.key} className={segment.className} style={{ flexGrow: segment.value }} />
            ))}
        </div>
      )}
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-muted">
        {segments.map((segment) => (
          <li key={segment.key} className="flex items-center gap-1.5">
            <span className={`size-2.5 rounded-full ${segment.className}`} aria-hidden />
            <strong className="text-ink">{segment.value}</strong> {segment.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ReferrerRow({ referrer }: { referrer: AdminReferrer }) {
  const signals = [
    referrer.sameWhatsapp > 0 && `${referrer.sameWhatsapp} con su mismo WhatsApp`,
    referrer.similarEmail > 0 && `${referrer.similarEmail} con email parecido`,
    referrer.burst > 0 && `${referrer.burst} creadas seguidas`,
  ].filter((signal): signal is string => Boolean(signal));

  return (
    <li
      className={`flex flex-col gap-3 rounded-3xl bg-surface p-5 lg:rounded-none lg:border-b lg:border-line lg:bg-transparent lg:px-0 lg:py-4 ${COLUMNS}`}
    >
      <div className="min-w-0">
        <p className="truncate font-bold text-ink">{referrer.storeName}</p>
        <Link href={`/${referrer.nick}`} className="text-sm text-accent hover:underline">
          @{referrer.nick}
        </Link>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-muted lg:contents">
        <Count value={referrer.invited} label="invitó" />
        <Count value={referrer.published} label={referrer.published === 1 ? "publicó" : "publicaron"} />
        <Count value={referrer.empty} label={referrer.empty === 1 ? "vacía" : "vacías"} strong={referrer.empty > 0} />
        <Count value={referrer.recent} label={referrer.recent === 1 ? "reciente" : "recientes"} />
        <Count value={referrer.bonus} label={referrer.bonus === 1 ? "lugar ganado" : "lugares ganados"} />
      </div>
      {signals.length === 0 ? (
        <p className="text-sm text-ink-muted">Sin señales raras</p>
      ) : (
        <ul className="flex flex-wrap gap-1.5">
          {signals.map((signal) => (
            <li
              key={signal}
              className="inline-flex items-center gap-1 rounded-full bg-highlight px-2.5 py-1 text-xs font-bold text-ink"
            >
              <TriangleAlert className="size-3.5" aria-hidden /> {signal}
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

function Count({ value, label, strong = false }: { value: number; label: string; strong?: boolean }) {
  return (
    <span className="lg:text-right">
      <span className={`font-bold ${strong ? "text-red-700" : "text-ink"}`}>{value}</span>
      <span className="lg:hidden"> {label}</span>
    </span>
  );
}
