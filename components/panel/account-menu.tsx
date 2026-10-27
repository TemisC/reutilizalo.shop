"use client";

import { useState } from "react";
import Link from "next/link";
import { LogOut, Store } from "lucide-react";
import { logout } from "@/lib/actions/auth";

export function AccountMenu({ nick, initial }: { nick: string; initial: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label="Mi cuenta"
        aria-expanded={open}
        className="flex size-12 items-center justify-center rounded-full bg-accent font-display text-xl font-extrabold text-white"
      >
        {initial}
      </button>
      {open && (
        <>
          <button
            type="button"
            aria-label="Cerrar menú"
            className="fixed inset-0 z-10 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div
            role="menu"
            className="absolute right-0 top-14 z-20 flex w-52 flex-col overflow-hidden rounded-2xl bg-surface py-1 shadow-lg ring-1 ring-line"
          >
            <Link href={`/${nick}`} role="menuitem" className={menuItem}>
              <Store className="size-4" aria-hidden /> Ver mi tienda
            </Link>
            <form action={logout}>
              <button type="submit" role="menuitem" className={`${menuItem} w-full`}>
                <LogOut className="size-4" aria-hidden /> Cerrar sesión
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}

const menuItem = "flex min-h-11 items-center gap-3 px-4 text-left text-ink hover:bg-chip-off";
