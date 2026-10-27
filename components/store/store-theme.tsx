import type { CSSProperties, ReactNode } from "react";

/** Para los vendedores Pro, accent_color reemplaza el verde dentro de su tienda (spec §8). */
export function StoreTheme({ accentColor, children }: { accentColor: string | null; children: ReactNode }) {
  const style = accentColor
    ? ({
        "--accent": accentColor,
        "--accent-hover": `color-mix(in srgb, ${accentColor} 80%, black)`,
      } as CSSProperties)
    : undefined;

  return (
    <div style={style} className="contents">
      {children}
    </div>
  );
}
