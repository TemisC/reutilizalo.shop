import { formatUYU } from "@/lib/format";

const ITEMS = [
  { title: "Campera de jean", price: 900, color: "bg-[#e3ebe4]", sold: false },
  { title: "Lámpara nórdica", price: 650, color: "bg-[#f1e6d8]", sold: false },
  { title: "4 novelas", price: 500, color: "bg-[#e3e7ef]", sold: false },
  { title: "Patines 38", price: 1200, color: "bg-[#efe1e5]", sold: true },
];

/** Maqueta de celular con una tienda de ejemplo (ilustración de la landing). */
export function PhoneMockup() {
  return (
    <div
      className="mx-auto w-full max-w-[300px] rotate-3 rounded-[2.5rem] border-[10px] border-ink bg-surface p-3 shadow-2xl"
      aria-hidden
    >
      <div className="flex items-center gap-2 px-1 pb-3 pt-1">
        <span className="flex size-9 items-center justify-center rounded-full bg-accent font-display font-extrabold text-white">
          P
        </span>
        <div>
          <p className="font-display text-sm font-extrabold leading-tight text-ink">La tiendita de Paola</p>
          <p className="text-[0.65rem] text-ink-muted">reutilizalo.shop/paola</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {ITEMS.map((item) => (
          <div key={item.title} className="flex flex-col gap-1 rounded-xl bg-canvas p-1.5">
            <span className={`relative flex aspect-square items-center justify-center rounded-lg ${item.color}`}>
              {item.sold && (
                <span className="-rotate-6 rounded-full bg-highlight px-2 py-0.5 font-display text-[0.6rem] font-extrabold text-ink">
                  ¡Vendido!
                </span>
              )}
            </span>
            <p className="truncate px-0.5 text-[0.65rem] text-ink-soft">{item.title}</p>
            <p className="px-0.5 font-display text-xs font-bold text-ink">{formatUYU(item.price)}</p>
          </div>
        ))}
      </div>
      <p className="mt-3 flex min-h-9 items-center justify-center rounded-xl bg-accent text-xs font-bold text-white">
        Lo quiero
      </p>
    </div>
  );
}
