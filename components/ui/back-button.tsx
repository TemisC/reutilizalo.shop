import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export function BackButton({ href = "/" }: { href?: string }) {
  return (
    <Link
      href={href}
      aria-label="Volver"
      className="flex size-11 items-center justify-center rounded-full bg-surface text-ink transition-colors hover:bg-chip-off"
    >
      <ChevronLeft className="size-5" aria-hidden />
    </Link>
  );
}
