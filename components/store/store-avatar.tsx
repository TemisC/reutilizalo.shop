import Image from "next/image";
import { initialOf } from "@/lib/site";

export function StoreAvatar({
  name,
  avatarUrl,
  size = 72,
  className = "",
}: {
  name: string;
  avatarUrl: string | null;
  size?: number;
  /** Para cambiar el tamaño por breakpoint hay que usar clases con "!" (el tamaño base va en style). */
  className?: string;
}) {
  return (
    <span
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent font-display font-extrabold text-white ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.42 }}
      aria-hidden
    >
      {avatarUrl ? (
        <Image src={avatarUrl} alt="" fill sizes={`${size}px`} className="object-cover" />
      ) : (
        initialOf(name)
      )}
    </span>
  );
}
