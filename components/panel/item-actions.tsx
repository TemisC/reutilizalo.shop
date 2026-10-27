"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { EllipsisVertical, Eye, EyeOff, Pencil, RotateCcw } from "lucide-react";
import { setItemStatus } from "@/lib/actions/items";
import type { ItemStatus } from "@/lib/data/items";

type Props = { itemId: string; status: ItemStatus };

export function ItemActions({ itemId, status }: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  function run(next: "active" | "hidden" | "sold") {
    setMenuOpen(false);
    setError(null);
    startTransition(async () => {
      const result = await setItemStatus(itemId, next);
      if (result.message) setError(result.message);
    });
  }

  if (status === "removed_by_admin") {
    return <span className="rounded-xl bg-chip-off px-3 py-2 text-sm text-ink-muted">Retirado</span>;
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-0.5">
        {status === "active" && (
          <button
            type="button"
            onClick={() => run("sold")}
            disabled={pending}
            className="min-h-11 whitespace-nowrap rounded-[var(--radius-button)] bg-chip-off px-3 text-sm font-bold text-ink transition-colors hover:bg-line disabled:opacity-60"
          >
            Marcar vendido
          </button>
        )}
        {status === "sold" && (
          <span className="flex min-h-11 items-center whitespace-nowrap rounded-[var(--radius-button)] bg-highlight px-3 text-sm font-bold text-ink">
            ¡Vendido!
          </span>
        )}
        {status === "hidden" && (
          <span className="flex min-h-11 items-center rounded-[var(--radius-button)] bg-chip-off px-3 text-sm font-bold text-ink-muted">
            Oculto
          </span>
        )}

        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label="Más opciones"
            aria-expanded={menuOpen}
            className="-mr-1 flex h-11 w-8 items-center justify-center rounded-full text-ink-muted hover:bg-chip-off hover:text-ink"
          >
            <EllipsisVertical className="size-5" aria-hidden />
          </button>
          {menuOpen && (
            <>
              <button
                type="button"
                aria-label="Cerrar menú"
                className="fixed inset-0 z-10 cursor-default"
                onClick={() => setMenuOpen(false)}
              />
              <div
                role="menu"
                className="absolute right-0 top-12 z-20 flex w-52 flex-col overflow-hidden rounded-2xl bg-surface py-1 shadow-lg ring-1 ring-line"
              >
                <Link href={`/panel/articulos/${itemId}`} role="menuitem" className={menuItem}>
                  <Pencil className="size-4" aria-hidden /> Editar
                </Link>
                {status === "active" && (
                  <button type="button" role="menuitem" className={menuItem} onClick={() => run("hidden")}>
                    <EyeOff className="size-4" aria-hidden /> Ocultar
                  </button>
                )}
                {status === "hidden" && (
                  <button type="button" role="menuitem" className={menuItem} onClick={() => run("active")}>
                    <Eye className="size-4" aria-hidden /> Mostrar en mi tienda
                  </button>
                )}
                {status === "sold" && (
                  <button type="button" role="menuitem" className={menuItem} onClick={() => run("active")}>
                    <RotateCcw className="size-4" aria-hidden /> Volver a publicar
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      {error && (
        <p role="alert" className="max-w-56 text-right text-xs text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

const menuItem =
  "flex min-h-11 items-center gap-3 px-4 text-left text-ink hover:bg-chip-off";
