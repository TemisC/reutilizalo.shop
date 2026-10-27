import Image from "next/image";
import Link from "next/link";
import { Image as ImageIcon, MessageSquare } from "lucide-react";
import { CONDITIONS } from "@/lib/catalog";
import { formatUYU } from "@/lib/format";
import type { PublicItem } from "@/lib/data/store";

const PLACEHOLDER_COLORS = ["bg-[#e3ebe4]", "bg-[#f1e6d8]", "bg-[#e3e7ef]", "bg-[#ebe7df]"];

export function ItemCard({ item, nick, index }: { item: PublicItem; nick: string; index: number }) {
  const sold = item.status === "sold";
  const href = `/${nick}/${item.id}`;

  return (
    <article className="flex flex-col gap-2 rounded-3xl bg-surface p-2">
      <Link
        href={href}
        className={`relative aspect-[4/3.4] overflow-hidden rounded-2xl ${PLACEHOLDER_COLORS[index % PLACEHOLDER_COLORS.length]}`}
      >
        {item.mainPhotoUrl ? (
          <Image
            src={item.mainPhotoUrl}
            alt={item.title}
            fill
            sizes="(max-width: 767px) 45vw, 260px"
            className={`object-cover ${sold ? "grayscale" : ""}`}
          />
        ) : (
          <span className="flex size-full items-center justify-center">
            <ImageIcon className="size-7 text-ink-muted" aria-hidden />
          </span>
        )}
        {sold && <span className="absolute inset-0 bg-ink/45" aria-hidden />}
        <span className="absolute left-2 top-2 rounded-full bg-surface px-2.5 py-1 text-xs font-bold text-ink">
          {CONDITIONS[item.condition]}
        </span>
        {sold && (
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-6 rounded-full bg-highlight px-4 py-1.5 font-display font-extrabold text-ink shadow">
            ¡Vendido!
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-1 px-2 lg:flex-row lg:items-end lg:justify-between lg:gap-3">
        <Link href={href} className="line-clamp-2 text-ink-soft">
          {item.title}
        </Link>
        <p className="mt-auto shrink-0 whitespace-nowrap font-display text-xl font-bold text-ink lg:mt-0 lg:text-2xl">
          {formatUYU(item.priceUyu)}
        </p>
      </div>

      {sold ? (
        <span className="flex min-h-11 items-center justify-center rounded-[var(--radius-button)] bg-chip-off text-ink-muted">
          Ya tiene dueño
        </span>
      ) : (
        <a
          href={`/api/quiero/${item.id}`}
          target="_blank"
          rel="nofollow noopener"
          className="flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-button)] bg-accent font-bold text-white transition-colors hover:bg-accent-hover"
        >
          <MessageSquare className="hidden size-4 lg:block" aria-hidden />
          Lo quiero
        </a>
      )}
    </article>
  );
}
