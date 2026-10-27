"use client";

import { useState } from "react";
import { Check, Share } from "lucide-react";

/** Comparte con la hoja nativa del celular; si no existe, copia el link. */
export function ShareButton({
  url,
  title,
  labeled = false,
}: {
  url: string;
  title: string;
  /** Con texto "Compartir" (encabezado de computadora); si no, botón redondo solo con ícono. */
  labeled?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copia el link:", url);
    }
  }

  const icon = copied ? <Check className="size-5 text-accent" aria-hidden /> : <Share className="size-5" aria-hidden />;

  if (labeled) {
    return (
      <button
        type="button"
        onClick={share}
        className="flex min-h-11 shrink-0 items-center gap-2 rounded-full bg-canvas px-5 font-bold text-ink transition-colors hover:bg-chip-off"
      >
        {icon}
        {copied ? "Link copiado" : "Compartir"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={share}
      aria-label={copied ? "Link copiado" : "Compartir"}
      className="flex size-12 shrink-0 items-center justify-center rounded-full bg-surface text-ink transition-colors hover:bg-chip-off"
    >
      {icon}
    </button>
  );
}
