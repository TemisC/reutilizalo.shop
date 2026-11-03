import { Suspense } from "react";
import type { Metadata } from "next";
import { requireSeller } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { splitE164 } from "@/lib/format";
import { storeLinkLabel } from "@/lib/site";
import { BackButton } from "@/components/ui/back-button";
import { PANEL_CONTAINER } from "@/components/panel/panel-sidebar";
import { PasswordForm, StoreSettingsForm } from "@/components/panel/settings-forms";

export const metadata: Metadata = {
  title: "Configuración",
};

export default function SettingsPage() {
  return (
    <main className={PANEL_CONTAINER}>
      <Suspense fallback={<SettingsSkeleton />}>
        <SettingsContent />
      </Suspense>
    </main>
  );
}

async function SettingsContent() {
  const seller = await requireSeller();
  const supabase = await createClient();
  const { data } = await supabase.from("profile_private").select("whatsapp").eq("id", seller.id).maybeSingle();
  const { countryCode, localNumber } = splitE164(data?.whatsapp ?? "");

  return (
    <>
      {/* En computadora se vuelve con el menú lateral. */}
      <header className="lg:hidden">
        <BackButton href="/panel" />
      </header>
      <h1 className="text-[2.4rem] leading-[1.05] lg:text-5xl">Configuración</h1>

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <section className="flex flex-col gap-5 rounded-3xl bg-surface p-6 lg:p-8">
          <div>
            <h2 className="font-sans text-xl font-bold tracking-normal">Tu tienda</h2>
            <p className="text-ink-muted">
              Tu link <strong className="text-ink">{storeLinkLabel(seller.nick)}</strong> no se puede cambiar, así
              no se rompe lo que ya compartiste.
            </p>
          </div>
          <StoreSettingsForm
            storeName={seller.storeName}
            countryCode={countryCode || "+598"}
            localNumber={localNumber}
          />
        </section>

        <section className="flex flex-col gap-5 rounded-3xl bg-surface p-6 lg:p-8">
          <div>
            <h2 className="font-sans text-xl font-bold tracking-normal">Contraseña</h2>
            <p className="text-ink-muted">
              Entras con <strong className="text-ink">{seller.email}</strong>.
            </p>
          </div>
          <PasswordForm />
        </section>
      </div>
    </>
  );
}

function SettingsSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-hidden>
      <div className="h-12 w-64 rounded-2xl bg-surface" />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-80 rounded-3xl bg-surface" />
        <div className="h-80 rounded-3xl bg-surface" />
      </div>
    </div>
  );
}
