import { Gift, MessageCircle } from "lucide-react";
import type { Seller } from "@/lib/auth/session";
import { FREE_MAX_WITH_REFERRALS, PLAN_LIMITS, REFERRAL_MAX_BONUS } from "@/lib/catalog";
import { inviteUrl } from "@/lib/site";
import { CopyLinkButton } from "@/components/panel/copy-link-button";

/** Texto para cuando un vendedor del plan gratis llega a su límite. */
export function freeLimitText(itemLimit: number) {
  const invite = itemLimit < FREE_MAX_WITH_REFERRALS ? ", invita a otras tiendas para sumar lugares" : "";
  return `Llegaste a tus ${itemLimit} artículos gratis. Marca alguno como vendido u ocúltalo${invite}, o pásate a Pro para publicar hasta ${PLAN_LIMITS.pro}.`;
}

/** Invitaciones (solo plan gratis): el link para compartir y cuántos lugares lleva ganados. */
export function InviteCard({ seller }: { seller: Seller }) {
  const { invited, activated, referredByNick, hasFirstItem } = seller.referral;
  const earned = Math.min(REFERRAL_MAX_BONUS, activated);
  const done = earned >= REFERRAL_MAX_BONUS || seller.itemLimit >= FREE_MAX_WITH_REFERRALS;
  const waiting = invited - activated;
  const url = inviteUrl(seller.nick);
  const shareText = `Te paso mi link para que crees gratis tu tiendita en Reutilizalo y vendas lo que ya no usas: ${url}`;

  return (
    <section className="flex flex-col gap-4 rounded-3xl bg-surface p-5 lg:p-6">
      <div className="flex items-start gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-highlight text-ink">
          <Gift className="size-5" aria-hidden />
        </span>
        <div>
          <h2 className="font-sans text-lg font-bold tracking-normal">Invita y gana lugares</h2>
          <p className="text-ink-muted">
            {done
              ? `Ya ganaste todos los lugares por invitaciones: puedes tener ${seller.itemLimit} artículos gratis.`
              : `Por cada tienda que se cree con tu link y publique su primer artículo, sumas 1 lugar gratis. Puedes llegar a ${FREE_MAX_WITH_REFERRALS}.`}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex gap-1.5" aria-hidden>
          {Array.from({ length: REFERRAL_MAX_BONUS }, (_, index) => (
            <span
              key={index}
              className={`h-2.5 flex-1 rounded-full ${index < earned ? "bg-accent" : "bg-chip-off"}`}
            />
          ))}
        </div>
        <p className="text-sm text-ink-muted">
          <strong className="text-ink">
            {earned} de {REFERRAL_MAX_BONUS}
          </strong>{" "}
          lugares ganados
          {waiting > 0 &&
            ` · ${waiting === 1 ? "1 tienda invitada todavía no publicó" : `${waiting} tiendas invitadas todavía no publicaron`}`}
        </p>
      </div>

      {!done && (
        <>
          <p className="break-all rounded-2xl bg-canvas px-4 py-3 text-sm font-bold text-ink">
            {url.replace(/^https?:\/\//, "")}
          </p>
          <div className="flex gap-3">
            <CopyLinkButton url={url} />
            <a
              href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-[var(--radius-button)] bg-ink px-4 font-bold text-white transition-colors hover:bg-ink-soft"
            >
              <MessageCircle className="size-4" aria-hidden /> WhatsApp
            </a>
          </div>
        </>
      )}

      {referredByNick && (
        <p className="border-t border-line pt-4 text-sm text-ink-muted">
          {hasFirstItem
            ? `Ganaste 1 lugar extra por llegar con la invitación de @${referredByNick}.`
            : `Te invitó @${referredByNick}: publica tu primer artículo y ganas 1 lugar extra.`}
        </p>
      )}
    </section>
  );
}
