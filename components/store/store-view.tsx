import type { ReactNode } from "react";
import { CreditCard, MessageSquare } from "lucide-react";
import type { StorePage } from "@/lib/data/store";
import { StoreTopBar } from "./store-top-bar";
import { StoreAvatar } from "./store-avatar";
import { ReputationBlock } from "./reputation-block";
import { StoreCatalog } from "./store-catalog";
import { CreateStoreBanner, ExploreCard, MadeWithFooter } from "./growth";
import { StoreTheme } from "./store-theme";
import { STORE_CONTAINER, StoreDesktopHeader } from "./store-desktop-header";

export function StoreView({ page }: { page: StorePage }) {
  const { store, items, reputation, reviews } = page;
  const place = store.zone ?? store.city;

  return (
    <StoreTheme accentColor={store.accentColor}>
      <StoreDesktopHeader nick={store.nick} title={store.storeName} />

      <div className={STORE_CONTAINER}>
        <div className="lg:hidden">
          <StoreTopBar nick={store.nick} title={store.storeName} />
        </div>

        {/* En computadora: perfil y reputación en una columna de 340 px, catálogo a la derecha. */}
        <div className="flex flex-col gap-5 lg:grid lg:grid-cols-[340px_minmax(0,1fr)] lg:items-start lg:gap-10">
          <aside className="flex flex-col gap-5">
            <section className="flex flex-col gap-5 lg:rounded-3xl lg:bg-surface lg:p-8">
              <header className="flex items-center gap-4 lg:flex-col lg:items-start">
                <StoreAvatar
                  name={store.storeName}
                  avatarUrl={store.avatarUrl}
                  className="lg:size-28! lg:text-5xl!"
                />
                <div className="min-w-0">
                  <h1 className="text-[1.9rem] leading-[1.05] lg:text-[2.2rem]">{store.storeName}</h1>
                  <p className="mt-1 text-ink-muted">
                    @{store.nick}
                    {place && ` · ${place}`}
                  </p>
                </div>
              </header>

              {store.bio && <p className="whitespace-pre-line text-lg text-ink-soft">{store.bio}</p>}

              <InfoChips paymentLink={store.paymentLink} className="hidden lg:flex" />
            </section>

            <ReputationBlock reputation={reputation} reviews={reviews} nick={store.nick} />

            {/* En celular las etiquetas van debajo de la reputación; en computadora, dentro del perfil. */}
            <InfoChips paymentLink={store.paymentLink} className="flex lg:hidden" />
          </aside>

          <StoreCatalog items={items} nick={store.nick} />
        </div>

        <div className="mt-4 flex flex-col gap-4 lg:mt-10">
          <CreateStoreBanner />
          {store.showExploreLink && <ExploreCard />}
          <MadeWithFooter />
        </div>
      </div>
    </StoreTheme>
  );
}

function InfoChips({ paymentLink, className }: { paymentLink: string | null; className: string }) {
  return (
    <ul className={`flex-wrap gap-2 ${className}`}>
      <InfoChip icon={<MessageSquare className="size-4" aria-hidden />}>Responde por WhatsApp</InfoChip>
      {paymentLink && (
        <InfoChip icon={<CreditCard className="size-4" aria-hidden />}>{paymentLabel(paymentLink)}</InfoChip>
      )}
    </ul>
  );
}

function InfoChip({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <li className="flex min-h-9 items-center gap-2 rounded-full bg-surface px-3 text-sm text-ink-soft lg:bg-canvas">
      {icon}
      {children}
    </li>
  );
}

function paymentLabel(link: string) {
  try {
    const host = new URL(link).hostname;
    if (host.includes("mercadopago") || host.startsWith("mpago.")) return "Acepta Mercado Pago";
  } catch {
    // Link inválido: igual mostramos el chip genérico.
  }
  return "Acepta pago con link";
}
