"use client";

import { useEffect } from "react";

/**
 * Cuenta una visita al artículo como máximo una vez por día en cada navegador. El registro de
 * "ya lo vi hoy" queda solo en este navegador (localStorage); al servidor no llega quién es.
 */
export function ViewTracker({ itemId }: { itemId: string }) {
  useEffect(() => {
    const key = `reutilizalo:visto:${itemId}`;
    const today = new Date().toISOString().slice(0, 10);
    try {
      if (localStorage.getItem(key) === today) return;
      localStorage.setItem(key, today);
    } catch {
      // Sin acceso a localStorage (modo privado estricto): contamos igual.
    }
    fetch(`/api/visto/${itemId}`, { method: "POST", keepalive: true }).catch(() => {});
  }, [itemId]);

  return null;
}
