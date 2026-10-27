import { BookOpen, Lamp, MessageSquare, Shirt, Volleyball, type LucideIcon } from "lucide-react";
import { formatUYU } from "@/lib/format";
import { initialOf } from "@/lib/site";

const SAMPLE_ITEMS: { title: string; price: number; icon: LucideIcon; color: string }[] = [
  { title: "Campera de jean", price: 900, icon: Shirt, color: "bg-[#e3ebe4]" },
  { title: "Lámpara nórdica", price: 650, icon: Lamp, color: "bg-[#f1e6d8]" },
  { title: "Pack de 4 novelas", price: 500, icon: BookOpen, color: "bg-[#e3e7ef]" },
  { title: "Pelota de vóley", price: 400, icon: Volleyball, color: "bg-[#efe1e5]" },
];

/**
 * Columna derecha de Crear tienda y Login, solo en computadora: muestra cómo se ve una tienda.
 * En Crear tienda se completa en vivo con el link y el nombre que se van escribiendo.
 */
export function StorePreview({
  title,
  nick,
  storeName,
}: {
  title: string;
  nick: string;
  storeName: string;
}) {
  return (
    <aside className="sticky top-10 hidden flex-col gap-8 rounded-[2rem] bg-ink p-10 text-white lg:flex">
      <h2 className="text-[2.2rem] leading-[1.05] text-white">{title}</h2>

      {/* Ilustración: no son datos reales. */}
      <div className="flex flex-col gap-4 rounded-3xl bg-canvas p-5 text-ink shadow-2xl" aria-hidden>
        <p className="self-start rounded-full bg-surface px-4 py-2 text-sm text-ink-soft">
          reutilizalo.shop/ <strong className="font-bold text-ink">{nick}</strong>
        </p>
        <div className="flex items-center gap-3">
          <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-accent font-display text-2xl font-extrabold text-white">
            {initialOf(storeName || nick)}
          </span>
          <div className="min-w-0">
            <p className="truncate font-display text-xl font-extrabold leading-tight">{storeName}</p>
            <p className="truncate text-sm text-ink-muted">@{nick} · Montevideo</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {SAMPLE_ITEMS.map(({ title: itemTitle, price, icon: Icon, color }) => (
            <div key={itemTitle} className="flex flex-col gap-2 rounded-2xl bg-surface p-2">
              <span className={`flex aspect-[4/3] items-center justify-center rounded-xl ${color}`}>
                <Icon className="size-7 text-ink-muted" />
              </span>
              <div className="flex items-end justify-between gap-2 px-1">
                <p className="truncate text-sm text-ink-soft">{itemTitle}</p>
                <p className="shrink-0 font-display font-bold">{formatUYU(price)}</p>
              </div>
              <span className="flex min-h-9 items-center justify-center gap-1.5 rounded-xl bg-accent text-sm font-bold text-white">
                <MessageSquare className="size-4" />
                Lo quiero
              </span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
