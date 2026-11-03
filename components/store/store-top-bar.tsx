import Link from "next/link";
import { LayoutDashboard } from "lucide-react";
import { storeUrl } from "@/lib/site";
import { SessionSwitch } from "@/components/ui/session-switch";
import { ShareButton } from "./share-button";
import { StoreLinkPill } from "./store-link-pill";

export function StoreTopBar({ nick, title }: { nick: string; title: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <StoreLinkPill nick={nick} background="bg-surface" className="text-sm" />
      <div className="flex shrink-0 items-center gap-2">
        {/* Con la sesión iniciada, un acceso directo para volver al panel. */}
        <SessionSwitch
          guest={null}
          member={
            <Link
              href="/panel"
              aria-label="Mi panel"
              title="Mi panel"
              className="flex size-11 items-center justify-center rounded-full bg-ink text-white"
            >
              <LayoutDashboard className="size-5" aria-hidden />
            </Link>
          }
        />
        <ShareButton url={storeUrl(nick)} title={title} />
      </div>
    </div>
  );
}
