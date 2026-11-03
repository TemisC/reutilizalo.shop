"use client";

import { useState } from "react";

type Day = { day: string; count: number };

const dayLabel = new Intl.DateTimeFormat("es-UY", { day: "numeric", month: "short", timeZone: "UTC" });

/** "2026-11-03" → "3 nov". Las fechas ya vienen en hora de Montevideo desde la base. */
function formatDay(day: string) {
  return dayLabel.format(new Date(`${day}T00:00:00Z`)).replace(".", "");
}

/** Barras de tiendas nuevas por día. Al pasar el mouse (o tocar) una columna muestra el número. */
export function SignupsChart({ days }: { days: Day[] }) {
  const [active, setActive] = useState<number | null>(null);
  const max = Math.max(1, ...days.map((d) => d.count));
  const shown = active === null ? null : days[active];

  return (
    <figure className="flex flex-col gap-3">
      <div className="flex min-h-6 items-baseline justify-between gap-3 text-sm">
        <figcaption className="text-ink-muted">Tiendas nuevas por día · últimos 30 días</figcaption>
        <p aria-live="polite" className="font-bold text-ink">
          {shown ? `${shown.count} ${shown.count === 1 ? "tienda" : "tiendas"} · ${formatDay(shown.day)}` : ""}
        </p>
      </div>

      <div className="relative h-44" onMouseLeave={() => setActive(null)}>
        {/* Líneas de referencia: tope y mitad. */}
        <div className="pointer-events-none absolute inset-x-0 top-0 border-t border-dashed border-line" />
        <div className="pointer-events-none absolute inset-x-0 top-1/2 border-t border-dashed border-line" />
        <span className="pointer-events-none absolute -top-2.5 right-0 bg-surface pl-1 text-xs text-ink-muted">
          {max}
        </span>

        <ol className="absolute inset-0 flex items-end gap-0.5 border-b border-line">
          {days.map((d, index) => (
            <li key={d.day} className="flex h-full flex-1 items-end">
              <button
                type="button"
                onMouseEnter={() => setActive(index)}
                onFocus={() => setActive(index)}
                onClick={() => setActive(index)}
                aria-label={`${formatDay(d.day)}: ${d.count} ${d.count === 1 ? "tienda nueva" : "tiendas nuevas"}`}
                className="flex h-full w-full items-end rounded-sm focus-visible:outline-2 focus-visible:outline-accent"
              >
                <span
                  className={`block w-full rounded-t-[4px] transition-colors ${
                    active === index ? "bg-ink" : "bg-accent"
                  }`}
                  style={{ height: d.count === 0 ? 0 : `${Math.max(4, (d.count / max) * 100)}%` }}
                />
              </button>
            </li>
          ))}
        </ol>
      </div>

      {days.length > 0 && (
        <div className="flex justify-between text-xs text-ink-muted" aria-hidden>
          <span>{formatDay(days[0].day)}</span>
          <span>{formatDay(days[Math.floor(days.length / 2)].day)}</span>
          <span>Hoy</span>
        </div>
      )}
    </figure>
  );
}
