import Link from "next/link";

/** `tone="light"` es para fondos oscuros (menú lateral del panel). */
export function Logo({ className = "", tone = "dark" }: { className?: string; tone?: "dark" | "light" }) {
  return (
    <Link
      href="/"
      className={`font-display text-xl font-extrabold tracking-tight ${tone === "light" ? "text-white" : "text-ink"} ${className}`}
    >
      reutilizalo<span className={tone === "light" ? "text-highlight" : "text-accent"}>.shop</span>
    </Link>
  );
}
