import { storeUrl } from "@/lib/site";
import { ShareButton } from "./share-button";
import { StoreLinkPill } from "./store-link-pill";

export function StoreTopBar({ nick, title }: { nick: string; title: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <StoreLinkPill nick={nick} background="bg-surface" className="text-sm" />
      <ShareButton url={storeUrl(nick)} title={title} />
    </div>
  );
}
