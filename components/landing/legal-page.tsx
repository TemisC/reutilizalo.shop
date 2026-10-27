import type { ReactNode } from "react";
import { SITE_CONTAINER, SiteFooter, SiteHeader } from "./site-chrome";

/** Datos que todavía hay que completar antes del lanzamiento (ver README). */
export const LEGAL_PLACEHOLDERS = {
  owner: "[NOMBRE DEL RESPONSABLE]",
  email: "[EMAIL DE CONTACTO]",
} as const;

export const LEGAL_UPDATED_AT = "27 de octubre de 2026";

/** Diseño común de Términos de uso y Privacidad. */
export function LegalPage({ title, intro, children }: { title: string; intro: ReactNode; children: ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className={`${SITE_CONTAINER} flex flex-1 flex-col pb-10 pt-6 lg:pt-10`}>
        <article className="mx-auto flex w-full max-w-3xl flex-col gap-8 rounded-3xl bg-surface p-6 md:p-12">
          <header className="flex flex-col gap-3">
            <h1 className="text-[2.4rem] leading-[1.05] md:text-5xl">{title}</h1>
            <p className="text-sm text-ink-muted">Última actualización: {LEGAL_UPDATED_AT}</p>
            <div className="text-lg text-ink-soft">{intro}</div>
          </header>
          <div className="flex flex-col gap-8 text-ink-soft [&_a]:font-bold [&_a]:text-accent [&_a]:underline [&_a]:underline-offset-2 [&_li]:mt-1.5 [&_ul]:list-disc [&_ul]:pl-6">
            {children}
          </div>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-sans text-xl font-bold tracking-normal">{title}</h2>
      {children}
    </section>
  );
}
