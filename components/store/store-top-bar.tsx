import Link from "next/link";
import { Link2 } from "lucide-react";
import { storeUrl } from "@/lib/site";
import { ShareButton } from "./share-button";

export function StoreTopBar({ nick, title }: { nick: string; title: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <Link
        href={`/${nick}`}
        className="flex min-h-11 min-w-0 items-center gap-2 rounded-full bg-surface px-4 text-sm text-ink-soft"
      >
        <Link2 className="size-4 shrink-0" aria-hidden />
        <span className="truncate">
          reutilizalo.shop/ <strong className="font-bold text-ink">{nick}</strong>
        </span>
      </Link>
      <ShareButton url={storeUrl(nick)} title={title} />
    </div>
  );
}
