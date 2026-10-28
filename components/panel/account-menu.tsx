"use client";

import { useState } from "react";
import Link from "next/link";
import { LogOut, Store } from "lucide-react";
import { logout } from "@/lib/actions/auth";

export function AccountMenu({
  nick,
  initial,
  storeName,
  email,
}: {
  nick: string;
  initial: string;
  storeName: string;
  email: string;
}) {
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
            className="absolute right-0 top-14 z-20 flex w-64 flex-col overflow-hidden rounded-2xl bg-surface py-1 shadow-lg ring-1 ring-line"
          >
            <div className="flex flex-col gap-0.5 border-b border-line px-4 pb-3 pt-2 text-sm">
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-ink-muted">Mi cuenta</p>
              <p className="font-bold break-words text-ink">{storeName}</p>
              <p className="text-ink-muted">@{nick}</p>
              {email && <p className="truncate text-ink-muted">{email}</p>}
            </div>
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
