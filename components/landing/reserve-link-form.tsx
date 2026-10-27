"use client";

import { useState } from "react";
import Form from "next/form";
import { normalizeNick } from "@/lib/nick";

/** "Reservar mi link": lleva a /crear?nick=… con el nick ya normalizado. Funciona también sin JavaScript. */
export function ReserveLinkForm() {
  const [nick, setNick] = useState("");

  return (
    <Form action="/crear" className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 rounded-[1.25rem] bg-surface p-2 shadow-sm ring-1 ring-line sm:flex-row sm:items-center">
        <label htmlFor="landing-nick" className="flex min-h-12 flex-1 items-center pl-3 text-lg">
          <span className="text-ink-muted">reutilizalo.shop/</span>
          <input
            id="landing-nick"
            name="nick"
            value={nick}
            onChange={(event) => setNick(normalizeNick(event.target.value))}
            placeholder="tunombre"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            maxLength={20}
            aria-label="Tu nombre de tienda"
            className="min-w-0 flex-1 bg-transparent font-bold text-ink outline-none placeholder:font-bold placeholder:text-ink-muted/70"
          />
        </label>
        <button
          type="submit"
          className="min-h-12 shrink-0 rounded-[var(--radius-button)] bg-accent px-6 text-lg font-bold text-white transition-colors hover:bg-accent-hover"
        >
          Reservar mi link
        </button>
      </div>
      <p className="text-sm text-ink-muted">Sin tarjeta. Te escriben directo a tu WhatsApp.</p>
    </Form>
  );
}
