"use client";

import { useEffect, useState } from "react";
import { Check, Link2 } from "lucide-react";
import { storeUrl } from "@/lib/site";

/** Píldora con el link de la tienda: al tocarla copia el link y avisa "¡Link copiado!". */
export function StoreLinkPill({
  nick,
  background,
  className = "",
}: {
  nick: string;
  /** Fondo en reposo, por ejemplo "bg-canvas" o "bg-surface". */
  background: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  async function copy() {
    const url = storeUrl(nick);
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Navegadores sin permiso de portapapeles: selección manual como respaldo.
      window.prompt("Copia el link de la tienda:", url);
      return;
    }
    setCopied(true);
  }

  return (
    <button
      type="button"
      onClick={copy}
      title="Copiar link"
      className={`relative flex min-h-11 min-w-0 items-center gap-2 rounded-full px-4 transition-colors duration-300 ${
        copied ? "bg-accent text-white" : `${background} text-ink-soft`
      } ${className}`}
    >
      <span className={`flex min-w-0 items-center gap-2 transition-opacity duration-200 ${copied ? "opacity-0" : ""}`}>
        <Link2 className="size-4 shrink-0" aria-hidden />
        <span className="truncate">
          reutilizalo.shop/ <strong className={`font-bold ${copied ? "" : "text-ink"}`}>{nick}</strong>
        </span>
      </span>
      <span
        aria-live="polite"
        className={`absolute inset-0 flex items-center justify-center gap-2 font-bold transition-all duration-200 ${
          copied ? "scale-100 opacity-100" : "pointer-events-none scale-90 opacity-0"
        }`}
      >
        {copied && (
          <>
            <Check className="size-4" aria-hidden /> ¡Link copiado!
          </>
        )}
      </span>
    </button>
  );
}
