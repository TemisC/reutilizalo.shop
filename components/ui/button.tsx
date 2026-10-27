import type { ButtonHTMLAttributes } from "react";
import { LoaderCircle } from "lucide-react";

type Variant = "primary" | "secondary" | "dark" | "highlight";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-accent text-white hover:bg-accent-hover",
  secondary: "bg-chip-off text-ink hover:bg-line",
  dark: "bg-ink text-white hover:bg-ink-soft",
  highlight: "bg-highlight text-ink hover:brightness-95",
};

export function buttonClasses(variant: Variant = "primary", size: "md" | "lg" = "md") {
  const sizing = size === "lg" ? "min-h-14 px-6 text-lg" : "min-h-11 px-4 text-base";
  return `inline-flex items-center justify-center gap-2 rounded-[var(--radius-button)] font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${sizing} ${VARIANTS[variant]}`;
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: "md" | "lg";
  loading?: boolean;
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  className = "",
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`${buttonClasses(variant, size)} ${className}`}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <LoaderCircle className="size-5 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}
