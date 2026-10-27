"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, LayoutGrid, Plus, Square, Star, type LucideIcon } from "lucide-react";

export function PanelNav({ nick }: { nick: string }) {
  const pathname = usePathname();

  const links: { href: string; label: string; icon: LucideIcon; active: boolean }[] = [
    { href: "/panel", label: "Inicio", icon: House, active: pathname === "/panel" },
    {
      href: "/panel/publicar",
      label: "Publicar artículo",
      icon: Plus,
      active: pathname === "/panel/publicar",
    },
    {
      href: "/panel#articulos",
      label: "Mis artículos",
      icon: LayoutGrid,
      active: pathname.startsWith("/panel/articulos"),
    },
    { href: "/panel#calificaciones", label: "Calificaciones", icon: Star, active: false },
    { href: `/${nick}`, label: "Mi tienda", icon: Square, active: false },
  ];

  return (
    <nav aria-label="Panel">
      <ul className="flex flex-col gap-1">
        {links.map(({ href, label, icon: Icon, active }) => (
          <li key={href}>
            <Link
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-13 items-center gap-3 rounded-2xl px-4 text-lg transition-colors ${
                active ? "bg-white/10 font-bold text-white" : "text-white/85 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon className="size-5 shrink-0" aria-hidden />
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
