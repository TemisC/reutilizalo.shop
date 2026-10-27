"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Store } from "lucide-react";
import { CATEGORIES, type Category } from "@/lib/catalog";
import type { PublicItem } from "@/lib/data/store";
import { ItemCard } from "./item-card";

/** Filtro por categoría (solo las que tiene la tienda) + grilla de 2 columnas (3 desde tablet). */
export function StoreCatalog({ items, nick }: { items: PublicItem[]; nick: string }) {
  const [category, setCategory] = useState<Category | null>(null);

  const present = (Object.keys(CATEGORIES) as Category[]).filter((key) =>
    items.some((item) => item.category === key),
  );
  const visible = category ? items.filter((item) => item.category === category) : items;

  return (
    <section className="flex flex-col gap-4" aria-label="Artículos">
      <div className="flex items-center justify-between gap-4">
        {present.length > 1 && (
          <div
            className="-mx-5 flex min-w-0 flex-1 gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] md:mx-0 md:flex-wrap md:px-0"
            role="group"
            aria-label="Filtrar por categoría"
          >
            <Chip active={category === null} onClick={() => setCategory(null)}>
              Todo
            </Chip>
            {present.map((key) => (
              <Chip key={key} active={category === key} onClick={() => setCategory(key)}>
                {CATEGORIES[key]}
              </Chip>
            ))}
          </div>
        )}
        {visible.length > 0 && (
          <p className="ml-auto hidden shrink-0 text-ink-muted md:block">
            {visible.length} {visible.length === 1 ? "artículo" : "artículos"}
          </p>
        )}
      </div>

      {items.length === 0 && (
        <p className="rounded-3xl bg-surface p-5 text-ink-muted">
          Esta tienda todavía no publicó artículos. ¡Vuelve pronto!
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:gap-5">
        {visible.map((item, index) => (
          <ItemCard key={item.id} item={item} nick={nick} index={index} />
        ))}
        <CreateYoursCard />
      </div>
    </section>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`min-h-11 shrink-0 rounded-full px-5 transition-colors ${
        active ? "bg-ink text-white" : "bg-surface text-ink hover:bg-chip-off"
      }`}
    >
      {children}
    </button>
  );
}

/** Elemento de crecimiento 1: última celda de la grilla. */
function CreateYoursCard() {
  return (
    <Link
      href="/crear"
      className="flex min-h-72 flex-col gap-3 rounded-3xl bg-highlight p-4 text-ink transition-[filter] hover:brightness-95"
    >
      <Store className="size-7" aria-hidden />
      <p className="mt-2 font-display text-2xl font-extrabold leading-tight tracking-tight">
        ¿Y tus cosas que ya no usas?
      </p>
      <p className="text-sm">Arma tu tiendita gratis en 2 minutos.</p>
      <span className="mt-auto flex items-center gap-1 font-bold">
        Crear la mía <ArrowRight className="size-4" aria-hidden />
      </span>
    </Link>
  );
}
