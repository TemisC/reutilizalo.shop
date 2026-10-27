import Link from "next/link";
import { Plus } from "lucide-react";
import type { Seller } from "@/lib/auth/session";
import type { SellerItem } from "@/lib/data/items";
import type { SellerReview } from "@/lib/data/reputation";
import type { Reputation } from "@/lib/reputation";
import { greetingName, initialOf, storeLinkLabel, storeUrl } from "@/lib/site";
import { Logo } from "@/components/ui/logo";
import { buttonClasses } from "@/components/ui/button";
import { CopyLinkButton } from "@/components/panel/copy-link-button";
import { AccountMenu } from "@/components/panel/account-menu";
import {
  ItemsTableHead,
  ItemRow,
  ProCard,
  RecentReviews,
  ReputationCard,
  UsageCard,
} from "@/components/panel/sections";

type Props = { seller: Seller; items: SellerItem[]; reputation: Reputation; reviews: SellerReview[] };

export function PanelView({ seller, items, reputation, reviews }: Props) {
  const activeCount = items.filter((item) => item.status === "active").length;
  const atLimit = activeCount >= seller.itemLimit;
  const limitMessage =
    seller.plan === "free"
      ? "Llegaste a tus 5 artículos gratis. Marca alguno como vendido u ocúltalo, o pásate a Pro para publicar hasta 50."
      : "Llegaste al máximo de artículos activos de tu plan.";

  return (
    <>
      {/* En computadora la navegación está en el menú lateral. */}
      <header className="flex items-center justify-between lg:hidden">
        <Logo />
        <AccountMenu nick={seller.nick} initial={initialOf(seller.storeName)} />
      </header>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <h1 className="text-[2.4rem] leading-[1.05] lg:text-5xl">
          ¡Tu tienda está online, {greetingName(seller.storeName)}!
        </h1>
        <div className="hidden shrink-0 lg:block">
          <PublishButton disabled={atLimit} />
        </div>
      </div>

      <div className="flex flex-col gap-6 md:grid md:grid-cols-2 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <section className="flex flex-col gap-4 rounded-3xl bg-ink p-6 text-white md:col-span-2 lg:col-span-1">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-white/70">Tu link</p>
            <p className="mt-1 break-all font-display text-xl font-bold lg:text-2xl">{storeLinkLabel(seller.nick)}</p>
          </div>
          <div className="flex gap-3">
            <CopyLinkButton url={storeUrl(seller.nick)} />
            <Link
              href={`/${seller.nick}`}
              className="inline-flex min-h-11 flex-1 items-center justify-center rounded-[var(--radius-button)] bg-white/10 px-4 font-bold text-white transition-colors hover:bg-white/20"
            >
              Ver mi tienda
            </Link>
          </div>
          <p className="text-white/80">Pégalo en la bio de tu Instagram y compártelo en tus historias.</p>
        </section>

        <ReputationCard reputation={reputation} />

        <UsageCard seller={seller} activeCount={activeCount} />
      </div>

      {atLimit && <p className="hidden text-ink-muted lg:block">{limitMessage}</p>}

      <div className="flex flex-col gap-2 lg:hidden">
        <PublishButton disabled={atLimit} />
        {atLimit && <p className="text-center text-sm text-ink-muted">{limitMessage}</p>}
      </div>

      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        <section id="articulos" className="flex scroll-mt-6 flex-col gap-3 lg:rounded-3xl lg:bg-surface lg:p-8">
          <h2 className="font-sans text-lg font-bold tracking-normal lg:text-2xl">Mis artículos</h2>
          {items.length === 0 ? (
            <p className="rounded-3xl bg-surface p-5 text-ink-muted lg:bg-canvas">
              Todavía no publicaste nada. Empieza por algo que ya no uses: ropa, libros, cosas de la casa…
            </p>
          ) : (
            <div>
              <ItemsTableHead />
              <ul className="flex flex-col gap-3 lg:gap-0">
                {items.map((item, index) => (
                  <ItemRow key={item.id} item={item} index={index} showViews={seller.plan === "pro"} />
                ))}
              </ul>
            </div>
          )}
        </section>

        <RecentReviews reviews={reviews} />
      </div>

      {seller.plan === "free" && (
        <div className="lg:hidden">
          <ProCard />
        </div>
      )}
    </>
  );
}

function PublishButton({ disabled }: { disabled: boolean }) {
  if (disabled) {
    return (
      <span className={`${buttonClasses("primary", "lg")} pointer-events-none w-full opacity-50`} aria-disabled>
        <Plus className="size-5" aria-hidden /> Publicar un artículo
      </span>
    );
  }
  return (
    <Link href="/panel/publicar" className={`${buttonClasses("primary", "lg")} w-full`}>
      <Plus className="size-5" aria-hidden /> Publicar un artículo
    </Link>
  );
}
